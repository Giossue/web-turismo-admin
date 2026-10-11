import { NextRequest, NextResponse } from "next/server";

import { getAdminCatalogs, type AdminCatalogs } from "@/lib/admin-api";
import { advertenciasDeCatalogos, resolverCatalogosFicha } from "@/lib/ficha/catalogos";
import { mapearFichaAFormulario } from "@/lib/ficha/mapear-formulario";
import {
  FichaInvalidaError,
  TAMANO_MAXIMO_BYTES,
  validarArchivoFicha,
} from "@/lib/ficha/archivo";
import { ImportAdmission } from "@/lib/ficha/admission";
import { leerCuerpoLimitado } from "@/lib/ficha/cuerpo-limitado";
import { parsearFichaAislada } from "@/lib/ficha/import-worker";
import { mapearSeccionesImportadas } from "@/lib/ficha/mapear-secciones";
import { mapearSugerenciasSecciones } from "@/lib/ficha/sugerencias-secciones";
import { resultadoParseoFichaSchema } from "@/lib/ficha/validacion";
import { ApiError, apiEndpoint, sendApiRequest, toApiError } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;
const admission = new ImportAdmission();
const headersPrivados = { "Cache-Control": "private, no-store" };

/** Holgura para los encabezados y separadores de multipart/form-data. */
const MARGEN_MULTIPART_BYTES = 64 * 1024;
const TAMANO_MAXIMO_CUERPO = TAMANO_MAXIMO_BYTES + MARGEN_MULTIPART_BYTES;
const MENSAJE_ARCHIVO_GRANDE = `El archivo pesa más de ${TAMANO_MAXIMO_BYTES / (1024 * 1024)} MB.`;

function respuestaError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: { message } }, { status, headers: headersPrivados });
}
function respuestaLimite() {
  const response = respuestaError(
    "Hay demasiadas importaciones en curso. Espera un minuto e intenta de nuevo.",
    429,
  );
  response.headers.set("Retry-After", "60");
  return response;
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
 * Ver openspec/specs/mintur-import/spec.md y docs/security/controles.md.
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
  const liberar = admission.reservar();
  if (!liberar) return respuestaLimite();
  try {
    return await importarFicha(request, token);
  } catch (error) {
    if (error instanceof ApiError) return respuestaError(error.message, error.status);
    return respuestaError("No se pudo completar la importación. Intenta de nuevo.", 500);
  } finally {
    liberar();
  }
}

async function importarFicha(request: NextRequest, token: string) {
  const apiSignal = AbortSignal.any([request.signal, AbortSignal.timeout(5_000)]);

  let catalogos: AdminCatalogs;
  try {
    const sesion = await sendApiRequest<{ user?: { id?: number; roles?: string[] } }>(
      apiEndpoint("/auth/me"),
      {
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: apiSignal,
      },
    );
    if (!sesion.response.ok)
      throw toApiError(sesion, "La sesión institucional no es válida.");
    const user = sesion.body?.data?.user;
    if (
      !user ||
      !Number.isSafeInteger(user.id) ||
      user.id! <= 0 ||
      !Array.isArray(user.roles) ||
      !user.roles.some((r) => r === "ADMINISTRADOR" || r === "AGENTE_TURISTICO")
    ) {
      return respuestaError("La cuenta no tiene permiso para importar fichas.", 403);
    }
    if (!admission.admitirUsuario(user.id!)) return respuestaLimite();
    catalogos = await getAdminCatalogs(token, false, apiSignal);
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

  const cuerpo = await leerCuerpoLimitado(
    request,
    TAMANO_MAXIMO_CUERPO,
    AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]),
  );
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
    resultado = await parsearFichaAislada(
      await file.arrayBuffer(),
      file.name,
      request.signal,
    );
  } catch (error) {
    if (error instanceof FichaInvalidaError) {
      return respuestaError(error.message, 422);
    }
    return respuestaErrorInesperado("al leer la ficha");
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
    const apartados = mapearSeccionesImportadas(
      resultado.datos,
      catalogos,
      catalogosResueltos,
    );
    return NextResponse.json(
      {
        data: {
          formulario: mapearFichaAFormulario(resultado.datos, catalogosResueltos),
          secciones: apartados.secciones,
          sugerenciasSecciones: mapearSugerenciasSecciones(
            resultado.datos,
            catalogosResueltos,
          ),
          advertencias: [
            ...resultado.advertencias,
            ...advertenciasDeCatalogos(catalogosResueltos),
            ...apartados.advertencias,
          ],
          fotos: resultado.imagenesAdjuntas,
        },
      },
      { headers: headersPrivados },
    );
  } catch {
    return respuestaErrorInesperado("al resolver los catálogos de la ficha");
  }
}
function respuestaErrorInesperado(contexto: string): NextResponse {
  console.error(`Error inesperado ${contexto}.`);
  return respuestaError(
    `Ocurrió un error inesperado ${contexto}. Si el problema continúa, avisa al equipo técnico.`,
    500,
  );
}
