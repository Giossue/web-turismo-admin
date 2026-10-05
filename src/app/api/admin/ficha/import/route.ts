import { NextRequest, NextResponse } from "next/server";

import { getAdminCatalogs, type AdminCatalogs } from "@/lib/admin-api";
import { advertenciasDeCatalogos, resolverCatalogosFicha } from "@/lib/ficha/catalogos";
import { mapearFichaAFormulario } from "@/lib/ficha/mapear-formulario";
import {
  FichaInvalidaError,
  TAMANO_MAXIMO_BYTES,
  parsearFicha,
  validarArchivoFicha,
} from "@/lib/ficha/parser";
import { mapearSugerenciasSecciones } from "@/lib/ficha/sugerencias-secciones";
import { resultadoParseoFichaSchema } from "@/lib/ficha/validacion";
import { ApiError } from "@/lib/http";

/** Holgura para los encabezados y separadores de multipart/form-data. */
const MARGEN_MULTIPART_BYTES = 64 * 1024;
const TAMANO_MAXIMO_CUERPO = TAMANO_MAXIMO_BYTES + MARGEN_MULTIPART_BYTES;
const MENSAJE_ARCHIVO_GRANDE = `El archivo pesa más de ${TAMANO_MAXIMO_BYTES / (1024 * 1024)} MB.`;

function respuestaError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: { message } }, { status });
}

/**
 * Sube y precarga una ficha MINTUR (.xlsx/.xlsm). No escribe nada en ninguna
 * base de datos: solo lee el archivo, resuelve catálogos contra la API
 * NestJS (nunca contra Postgres directamente, este repo no se conecta a la
 * base — ver AGENTS.md) y devuelve el formulario precargado más las
 * advertencias para que el usuario revise antes de guardar.
 *
 * Antes de leer el cuerpo valida la sesión contra la API (los catálogos
 * administrativos exigen un rol del panel, y además se necesitan para
 * resolver la ficha) y limita el tamaño del cuerpo.
 *
 * Ver docs/plans/active/importar-ficha-mintur.md.
 */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) {
    return respuestaError(
      "Falta la sesión institucional (encabezado Authorization).",
      401,
    );
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > TAMANO_MAXIMO_CUERPO) {
    return respuestaError(MENSAJE_ARCHIVO_GRANDE, 413);
  }

  let catalogos: AdminCatalogs;
  try {
    catalogos = await getAdminCatalogs(token);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return respuestaError(error.message, error.status);
    }
    return respuestaError(
      "No se pudieron obtener los catálogos de la API institucional para resolver la " +
        "ficha. Intenta de nuevo.",
      502,
    );
  }

  const cuerpo = await leerCuerpoLimitado(request, TAMANO_MAXIMO_CUERPO);
  if (cuerpo === null) return respuestaError(MENSAJE_ARCHIVO_GRANDE, 413);

  let formData: FormData;
  try {
    formData = await new Response(cuerpo, {
      headers: { "content-type": request.headers.get("content-type") ?? "" },
    }).formData();
  } catch {
    return respuestaError(
      "No se pudo leer el cuerpo de la solicitud como multipart/form-data.",
      400,
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return respuestaError('Falta el archivo (campo "file").', 400);
  }

  let resultado;
  try {
    validarArchivoFicha(file.name, file.size);
    resultado = await parsearFicha(await file.arrayBuffer(), file.name);
  } catch (error) {
    if (error instanceof FichaInvalidaError) {
      return respuestaError(error.message, 422);
    }
    return respuestaErrorInesperado(error, "al leer la ficha");
  }

  const validado = resultadoParseoFichaSchema.safeParse(resultado);
  if (!validado.success) {
    return respuestaError(
      "El parser devolvió una forma de datos inesperada (posible desfase entre el " +
        "parser y su validación).",
      500,
    );
  }

  // Defensa en profundidad: la API real puede traer catálogos con una forma
  // que no coincide exactamente con lo que asumimos (ya pasó en producción —
  // un elemento sin `name` tumbó el endpoint entero con un 500 sin cuerpo).
  // Si algo inesperado revienta acá, el usuario debe recibir un mensaje
  // claro, no una respuesta vacía.
  try {
    const catalogosResueltos = resolverCatalogosFicha(resultado.datos, catalogos);
    return NextResponse.json({
      data: {
        formulario: mapearFichaAFormulario(resultado.datos, catalogosResueltos),
        sugerenciasSecciones: mapearSugerenciasSecciones(
          resultado.datos,
          catalogosResueltos,
        ),
        advertencias: [
          ...resultado.advertencias,
          ...advertenciasDeCatalogos(catalogosResueltos),
        ],
        fotos: resultado.imagenesAdjuntas,
      },
    });
  } catch (error) {
    return respuestaErrorInesperado(error, "al resolver los catálogos de la ficha");
  }
}

/**
 * Lee el cuerpo sin superar `limite` bytes (también si no hay
 * `Content-Length` o es falso). Devuelve `null` si lo supera.
 */
async function leerCuerpoLimitado(
  request: NextRequest,
  limite: number,
): Promise<Uint8Array<ArrayBuffer> | null> {
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const partes: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limite) {
      await reader.cancel();
      return null;
    }
    partes.push(value);
  }
  const cuerpo = new Uint8Array(total);
  let desplazamiento = 0;
  for (const parte of partes) {
    cuerpo.set(parte, desplazamiento);
    desplazamiento += parte.byteLength;
  }
  return cuerpo;
}

function respuestaErrorInesperado(error: unknown, contexto: string): NextResponse {
  console.error(`Error inesperado ${contexto}:`, error);
  return respuestaError(
    `Ocurrió un error inesperado ${contexto}. Si el problema continúa, avisa al equipo técnico.`,
    500,
  );
}
