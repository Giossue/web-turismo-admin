import { describe, expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";

import { ContinuousCenterSectionWorkflow } from "@/components/admin/center-section-workflow";
import type { AdminCatalogs, AdminCenterDetail, CatalogOption } from "@/lib/admin-api";
import type { CenterSectionCode } from "@/lib/center-sections/definitions";

const catalogOverrides: Partial<Record<keyof AdminCatalogs, CatalogOption[]>> = {
  roadTypes: [
    { id: 1, name: "Asfaltada" },
    { id: 2, name: "Lastrada" },
  ],
  months: [
    { id: 1, code: "1", name: "Enero" },
    { id: 7, code: "7", name: "Julio" },
    { id: 12, code: "12", name: "Diciembre" },
  ],
};

// Cualquier catálogo no definido arriba se lee como lista vacía.
const catalogs = new Proxy(catalogOverrides, {
  get: (target, key: string) => target[key as keyof AdminCatalogs] ?? [],
}) as AdminCatalogs;

function renderWorkflow(
  sections: Partial<Record<CenterSectionCode, unknown>>,
  activeSectionCode: CenterSectionCode,
  canEdit = true,
) {
  const detail = { draft: { sections } } as unknown as AdminCenterDetail;
  return renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <ContinuousCenterSectionWorkflow
        token=""
        code={null}
        detail={detail}
        catalogs={catalogs}
        canEdit={canEdit}
        activeSectionCode={activeSectionCode}
        visible
        onDetailChanged={() => {}}
        onError={() => {}}
      />
    </QueryClientProvider>,
  );
}

/** HTML de la tarjeta de un apartado (desde su `id` hasta la siguiente tarjeta). */
function cardHtml(html: string, code: CenterSectionCode): string {
  const start = html.indexOf(`id="center-detail-section-${code}"`);
  expect(start).toBeGreaterThan(-1);
  const next = html.indexOf('id="center-detail-section-', start + 1);
  return html.slice(start, next === -1 ? undefined : next);
}

describe("apartados de la ficha", () => {
  test("renderiza los 14 apartados con sus filas sugeridas", () => {
    const html = renderWorkflow({}, "planta");
    expect(html.match(/id="center-detail-section-/g)).toHaveLength(14);
    expect(cardHtml(html, "planta")).toContain("Planta turística en el atractivo");
  });

  test("las vías guardadas se cargan y el selector muestra el valor guardado", () => {
    const html = cardHtml(
      renderWorkflow(
        {
          accesibilidad: {
            response: "SI",
            accessibilityDetails: {
              roads: [{ roadTypeId: 2, typeLabel: "", observation: "Tramo lastrado" }],
            },
          },
        },
        "accesibilidad",
      ),
      "accesibilidad",
    );
    expect(html).toContain(">Lastrada<");
    expect(html).toContain("Tramo lastrado");
    expect(html).toContain('aria-label="Eliminar vía terrestre 1"');
    expect(html).not.toContain("No hay vías terrestres registradas.");
  });

  test("los selectores cerrados muestran el valor cargado", () => {
    const html = cardHtml(
      renderWorkflow(
        {
          conservacion: {
            response: "SI",
            conservation: { attraction: { state: "ALTERADO", observation: "" } },
          },
        },
        "conservacion",
      ),
      "conservacion",
    );
    expect(html).toContain(">Alterado<");
    expect(html).toContain(">Sí<");
  });

  test("con respuesta No el detalle del apartado no se monta", () => {
    const html = cardHtml(
      renderWorkflow({ conservacion: { response: "NO" } }, "conservacion"),
      "conservacion",
    );
    expect(html).toContain("Observación general del apartado");
    expect(html).not.toContain("Estado por componente");
    expect(html).not.toContain("Añadir fila");
  });

  test("los meses de una temporada se muestran por nombre", () => {
    const html = cardHtml(
      renderWorkflow(
        {
          visitantes: {
            response: "SI",
            visitors: { seasons: [{ type: "ALTA", months: [1, 7] }] },
          },
        },
        "visitantes",
      ),
      "visitantes",
    );
    expect(html).toContain("Enero, Julio");
  });

  test("cada pregunta de políticas nombra el grupo de sus campos", () => {
    const html = cardHtml(renderWorkflow({}, "politicas"), "politicas");
    expect(html.match(/role="group" aria-labelledby=/g)).toHaveLength(4);
  });

  test("sin permiso de edición los campos y botones quedan deshabilitados", () => {
    const html = cardHtml(
      renderWorkflow({ planta: { response: "SI", rows: [] } }, "planta", false),
      "planta",
    );
    expect(html).toMatch(/<button[^>]*disabled[^>]*>.*?Añadir registro/);
    expect(html).not.toMatch(/<textarea(?![^>]*disabled)[^>]*>/);
  });
});
