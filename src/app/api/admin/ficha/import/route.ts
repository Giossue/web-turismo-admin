import { NextRequest, NextResponse } from "next/server";

import { getAdminCatalogs } from "@/lib/admin-api";
import { advertenciasDeCatalogos, resolverCatalogosFicha } from "@/lib/ficha/catalogos";
import { mapearFichaAFormulario } from "@/lib/ficha/mapear-formulario";
import { FichaInvalidaError, parsearFicha } from "@/lib/ficha/parser";
import { resultadoParseoFichaSchema } from "@/lib/ficha/validacion";

// exceljs necesita APIs de Node (Buffer, zlib) que no existen en el runtime Edge.
export const runtime = "nodejs";

/**
 * Sube y precarga una ficha MINTUR (.xlsx/.xlsm). No escribe nada en ninguna
 * base de datos: solo lee el archivo, resuelve catálogos contra la API
 * NestJS (nunca contra Postgres directamente, este repo no se conecta a la
 * base — ver AGENTS.md) y devuelve el formulario precargado más las
 * advertencias para que el usuario revise antes de guardar.
 *
 * Ver docs/plans/active/importar-ficha-mintur.md.
 */
export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (!token) {
    return NextResponse.json(
      { error: { message: "Falta la sesión institucional (encabezado Authorization)." } },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error: {
          message: "No se pudo leer el cuerpo de la solicitud como multipart/form-data.",
        },
      },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { message: 'Falta el archivo (campo "file").' } },
      { status: 400 },
    );
  }

  let resultado;
  try {
    const buffer = await file.arrayBuffer();
    resultado = await parsearFicha(buffer, file.name);
  } catch (error) {
    if (error instanceof FichaInvalidaError) {
      return NextResponse.json({ error: { message: error.message } }, { status: 422 });
    }
    return respuestaErrorInesperado(error, "al leer la ficha");
  }

  const validado = resultadoParseoFichaSchema.safeParse(resultado);
  if (!validado.success) {
    return NextResponse.json(
      {
        error: {
          message:
            "El parser devolvió una forma de datos inesperada (posible desfase entre el " +
            "parser y su validación).",
        },
      },
      { status: 500 },
    );
  }

  let catalogos;
  try {
    catalogos = await getAdminCatalogs(token);
  } catch {
    return NextResponse.json(
      {
        error: {
          message:
            "El archivo se leyó correctamente, pero no se pudieron obtener los catálogos de " +
            "la API institucional para resolverlo. Intenta de nuevo.",
        },
      },
      { status: 502 },
    );
  }

  // Defensa en profundidad: la API real puede traer catálogos con una forma
  // que no coincide exactamente con lo que asumimos (ya pasó en producción —
  // un elemento sin `name` tumbó el endpoint entero con un 500 sin cuerpo).
  // Si algo inesperado revienta acá, el usuario debe recibir un mensaje
  // claro, no una respuesta vacía.
  try {
    const catalogosResueltos = resolverCatalogosFicha(resultado.datos, catalogos);
    const formulario = mapearFichaAFormulario(resultado.datos, catalogosResueltos);
    const advertencias = [
      ...resultado.advertencias,
      ...advertenciasDeCatalogos(catalogosResueltos),
    ];

    return NextResponse.json({
      data: {
        formulario,
        advertencias,
        imagenes: resultado.imagenes,
      },
    });
  } catch (error) {
    return respuestaErrorInesperado(error, "al resolver los catálogos de la ficha");
  }
}

function respuestaErrorInesperado(error: unknown, contexto: string): NextResponse {
  console.error(`Error inesperado ${contexto}:`, error);
  return NextResponse.json(
    {
      error: {
        message: `Ocurrió un error inesperado ${contexto}. Si el problema continúa, avisa al equipo técnico.`,
      },
    },
    { status: 500 },
  );
}
