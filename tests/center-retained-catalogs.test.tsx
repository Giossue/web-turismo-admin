import { describe, expect, test } from "bun:test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { FormProvider, useForm } from "react-hook-form";

import { OptionGrid } from "@/components/admin/center-editor/option-grid";
import { ContinuousCenterSectionWorkflow } from "@/components/admin/center-section-workflow";
import type { AdminCatalogs, AdminCenterDetail, CenterDraft } from "@/lib/admin-api";
import { centerEditorCatalogs } from "@/lib/center-editor-catalogs";
import { emptyCenterFormValues, type CenterFormValues } from "@/lib/center-form";
import { toFormValues, toPayload } from "@/lib/center-form-mappers";
import type { CenterSectionCode } from "@/lib/center-sections/definitions";

const catalogs = {
  types: [{ id: 10, name: "Arquitectura", categoryId: 1 }],
  subtypes: [{ id: 100, name: "Religiosa", typeId: 10 }],
  cantons: [{ id: 21, name: "Guaranda", provinceId: 2 }],
  parishes: [{ id: 211, name: "Guanujo", cantonId: 21 }],
  localities: [{ id: 5, name: "Guaranda", provinceId: 2, cantonId: 21 }],
  zones: [{ id: 50, name: "Guaranda", localityId: 5 }],
  activities: [{ id: 7, name: "Fotografía", categoryId: 1 }],
  accessibilityTypes: [],
  accessibilityCriteria: [],
  facilities: [],
  facilityCategories: [{ id: 5, name: "Servicios" }],
} as unknown as AdminCatalogs;

const retained: NonNullable<AdminCenterDetail["retainedCatalogOptions"]> = {
  activities: [{ id: 90, name: "Paseo histórico", categoryId: 1, active: false }],
  accessibilityTypes: [{ id: 91, name: "Accesibilidad general", active: false }],
  accessibilityCriteria: [{ id: 92, name: "Rampa original", typeId: 91, active: false }],
  facilities: [{ id: 93, name: "Mirador antiguo", categoryId: 5, active: false }],
};

const draft = {
  subtypeId: 100,
  parishId: 211,
  touristZoneId: 50,
  activities: [{ activityId: 90, active: true }],
  accessibility: [{ typeId: 91, applies: true }],
  facilities: [{ typeId: 93, quantity: 3, observation: "Conservar detalle" }],
} as CenterDraft;

function GridForm({ selected }: { selected: boolean }) {
  const form = useForm<CenterFormValues>({
    defaultValues: {
      ...emptyCenterFormValues,
      facilityIds: selected ? ["93"] : [],
    },
  });
  return (
    <FormProvider {...form}>
      <OptionGrid
        name="facilityIds"
        options={centerEditorCatalogs(catalogs, retained)!.facilities}
      />
    </FormProvider>
  );
}

function renderSection(sectionCode: CenterSectionCode, section: unknown) {
  const detail = {
    draft: { sections: { [sectionCode]: section } },
  } as unknown as AdminCenterDetail;
  return renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <ContinuousCenterSectionWorkflow
        token=""
        code={null}
        detail={detail}
        catalogs={centerEditorCatalogs(catalogs, retained)}
        canEdit
        activeSectionCode={sectionCode}
        visible
        onDetailChanged={() => {}}
        onError={() => {}}
      />
    </QueryClientProvider>,
  );
}

describe("referencias anteriores a catálogos en el editor de centros", () => {
  test("una ficha nueva solo recibe las opciones disponibles", () => {
    expect(centerEditorCatalogs(catalogs, undefined)).toBe(catalogs);
    expect(catalogs.activities.map((item) => item.id)).toEqual([7]);
    expect(catalogs.facilities).toEqual([]);
  });

  test("no duplica ni marca como retirada una opción que sigue disponible", () => {
    const merged = centerEditorCatalogs(catalogs, {
      activities: [{ id: 7, name: "Nombre anterior", categoryId: 1 }],
    });
    expect(merged?.activities).toEqual(catalogs.activities);
  });

  test("guardar un texto ajeno al catálogo conserva actividades, accesibilidad y facilidades anteriores", () => {
    const merged = centerEditorCatalogs(catalogs, retained)!;
    const values = toFormValues(draft, merged);
    const payload = toPayload(
      { ...values, description: "Descripción corregida" },
      merged,
    );
    expect(payload.activities).toEqual([{ activityId: 90, active: true }]);
    expect(payload.accessibility).toEqual([{ typeId: 91, applies: true }]);
    expect(payload.facilities).toEqual([
      { typeId: 93, quantity: 3, observation: "Conservar detalle" },
    ]);
    expect(payload.description).toBe("Descripción corregida");
  });

  test("cambiar de categoría conserva la limpieza de actividades incompatibles", () => {
    const merged = centerEditorCatalogs(catalogs, retained)!;
    const values = toFormValues(draft, merged);
    expect(toPayload({ ...values, categoryId: "2" }, merged).activities).toEqual([]);
  });

  test("la opción anterior marcada muestra su nombre y puede retirarse", () => {
    const html = renderToString(<GridForm selected />);
    expect(html).toContain("Mirador antiguo (ya no disponible)");
    const input = html
      .match(/<input\b[^>]*>/g)
      ?.find((tag) => tag.includes('value="93"'));
    expect(input).toContain("checked");
    expect(input).not.toContain("disabled");
  });

  test("una opción anterior retirada de la ficha queda deshabilitada para seleccionarla de nuevo", () => {
    const html = renderToString(<GridForm selected={false} />);
    const input = html
      .match(/<input\b[^>]*>/g)
      ?.find((tag) => tag.includes('value="93"'));
    expect(input).toContain("disabled");
    expect(input).not.toContain("checked");
  });

  test("el detalle de accesibilidad muestra el tipo y criterio anteriores", () => {
    const html = renderSection("accesibilidad", {
      response: "SI",
      accessibilityDetails: {
        criteria: [{ accessibilityTypeId: 91, criterionId: 92, response: "SI" }],
      },
    });
    expect(html).toContain(">Accesibilidad general (ya no disponible)<");
    expect(html).toContain(">Rampa original (ya no disponible)<");
  });

  test("el detalle de facilidades muestra el tipo anterior y conserva sus cantidades", () => {
    const html = renderSection("planta", {
      response: "SI",
      facilitiesDetails: [{ categoryId: 5, typeId: 93, quantity: 3 }],
    });
    expect(html).toContain(">Mirador antiguo (ya no disponible)<");
    expect(html).toContain('value="3"');
  });
});
