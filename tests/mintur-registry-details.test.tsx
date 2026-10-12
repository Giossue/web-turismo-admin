import { describe, expect, it } from "bun:test";
import { renderToString } from "react-dom/server";

import {
  MinturRegistryDetails,
  minturStatusLabel,
} from "@/components/admin/mintur-registry-details";
import type { EstablishmentMinturData } from "@/lib/admin-api";

const data: EstablishmentMinturData = {
  codigoEstablecimientoRuc: "2",
  referenciaDireccion: null,
  telefonoSecundario: null,
  correo: "info@hotelcordero.com",
  sitioWeb: null,
  estadoRegistro: "PENDIENTE_INSPECCION",
  fechaRegistro: "2021-07-29",
  totalTrabajadores: 9,
  totalHabitaciones: 22,
  totalCamas: 53,
  totalPlazas: 71,
  totalMesas: 0,
  capacidadPersonas: 0,
  importadoAt: "2026-10-12T21:56:46.385Z",
};

describe("MinturRegistryDetails", () => {
  it("muestra el estado y las capacidades del catastro sin ceros ni vacíos", () => {
    const html = renderToString(<MinturRegistryDetails data={data} />);

    expect(html).toContain("Pendiente de inspección");
    expect(html).toContain("info@hotelcordero.com");
    expect(html).toContain("29/7/2021");
    expect(html).toContain("Camas");
    expect(html).not.toContain("Mesas");
    expect(html).not.toContain("Sitio web");
  });

  it("no muestra nada si el establecimiento no viene del catastro", () => {
    expect(
      renderToString(<MinturRegistryDetails data={{ ...data, importadoAt: null }} />),
    ).toBe("");
  });

  it("traduce los estados del MINTUR", () => {
    expect(minturStatusLabel("SUSPENSION_TEMPORAL")).toBe("Suspensión temporal");
    expect(minturStatusLabel(null)).toBe("—");
  });
});
