import { describe, expect, test } from "bun:test";

import type { CatalogosResueltos } from "@/lib/ficha/catalogos";
import { mapearSugerenciasSecciones } from "@/lib/ficha/sugerencias-secciones";
import type { FichaExtraida } from "@/lib/ficha/tipos";

function fichaConDistancia(distanciaKm: number | null): FichaExtraida {
  return {
    accesoConectividad: { distanciaKm },
  } as unknown as FichaExtraida;
}

function catalogosCon(localidadId: number | null): CatalogosResueltos {
  return {
    localidadId: {
      id: localidadId,
      advertencia: localidadId === null ? "sin coincidencia" : null,
    },
  } as unknown as CatalogosResueltos;
}

describe("mapearSugerenciasSecciones", () => {
  test("sugiere localidad y distancia cuando ambas se resolvieron", () => {
    const sugerencias = mapearSugerenciasSecciones(
      fichaConDistancia(5),
      catalogosCon(42),
    );
    expect(sugerencias.accesibilidad).toEqual({ localityId: 42, distanceKm: 5 });
  });

  test("localidad null si no se pudo resolver contra el catálogo", () => {
    const sugerencias = mapearSugerenciasSecciones(
      fichaConDistancia(5),
      catalogosCon(null),
    );
    expect(sugerencias.accesibilidad.localityId).toBeNull();
    expect(sugerencias.accesibilidad.distanceKm).toBe(5);
  });
});
