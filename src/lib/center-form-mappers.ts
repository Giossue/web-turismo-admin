import type {
  AdminCatalogs,
  AdminCenterDetail,
  CatalogOption,
  CenterDraft,
  SaveCenterInput,
} from "./admin-api";
import { emptyCenterFormValues, type CenterFormValues } from "./center-form";
import type { CenterSectionCode } from "./center-sections/definitions";
import { findCatalogOption, toOptionalNumber } from "./values";

/** Contenido mínimo de un apartado marcado como completo a partir de los datos base. */
const SECTION_DONE = { schemaVersion: 1, response: "SI", observation: "" } as const;

/**
 * Apartados que se consideran completos cuando el borrador ya tiene los datos
 * del formulario principal, aunque su contenido de sección no exista todavía.
 */
const SECTIONS_INFERRED_FROM_DRAFT: ReadonlyArray<
  readonly [CenterSectionCode, (draft: CenterDraft) => boolean]
> = [
  [
    "identificacion",
    (draft) =>
      Boolean(
        draft.name &&
        draft.subtypeId &&
        draft.touristZoneId &&
        draft.parishId &&
        draft.productLineId &&
        draft.scenarioId,
      ),
  ],
  [
    "ubicacion-admin",
    (draft) => Number.isFinite(draft.latitude) && Number.isFinite(draft.longitude),
  ],
  ["caracteristicas", (draft) => Boolean(draft.productLineId && draft.scenarioId)],
  ["actividades", (draft) => Boolean(draft.activities?.some((item) => item.active))],
  ["descripcion", (draft) => Boolean(draft.description?.trim())],
  ["accesibilidad", (draft) => Boolean(draft.accessibility?.some((item) => item.applies))],
  ["planta", (draft) => Boolean(draft.facilities?.length)],
];

/**
 * Combina el borrador con la versión publicada (el borrador guarda solo lo
 * que cambió) y marca como completos los apartados cubiertos por el
 * formulario principal. Sin borrador devuelve el detalle tal cual.
 */
export function withEditorDraft(detail: AdminCenterDetail): AdminCenterDetail {
  if (!detail.draft) return detail;

  const sections: Record<string, unknown> = {
    ...(detail.published.sections ?? {}),
    ...(detail.draft.sections ?? {}),
  };
  const draft: CenterDraft = { ...detail.published, ...detail.draft, sections };
  for (const [code, isCovered] of SECTIONS_INFERRED_FROM_DRAFT) {
    if (sections[code] === undefined && isCovered(draft)) {
      sections[code] = { ...SECTION_DONE };
    }
  }
  return { ...detail, draft };
}

/** Datos que muestra el editor: el borrador si existe, si no la versión publicada. */
export function editorDraftOf(detail: AdminCenterDetail): CenterDraft {
  return detail.draft ?? detail.published;
}

export type CenterCatalogSelection = Pick<
  CenterFormValues,
  "categoryId" | "typeId" | "provinceId" | "cantonId"
>;

export type CenterCatalogOptions = {
  types: CatalogOption[];
  subtypes: CatalogOption[];
  cantons: CatalogOption[];
  parishes: CatalogOption[];
  zones: CatalogOption[];
  activities: CatalogOption[];
};

type ParentKey = "categoryId" | "typeId" | "provinceId" | "cantonId";

function childrenOf(
  options: readonly CatalogOption[] | undefined,
  parentKey: ParentKey,
  parentId: string,
): CatalogOption[] {
  if (!parentId) return [];
  const parent = Number(parentId);
  return (options ?? []).filter((option) => Number(option[parentKey]) === parent);
}

/** Actividades del catálogo que corresponden a la categoría seleccionada. */
export function activityOptionsFor(
  catalogs: AdminCatalogs | null | undefined,
  categoryId: string,
): CatalogOption[] {
  return childrenOf(catalogs?.activities, "categoryId", categoryId);
}

function matchesOptional(value: number | undefined, selectedId: string): boolean {
  return !selectedId || Number(value) === Number(selectedId);
}

/**
 * Opciones dependientes del formulario principal según la selección actual:
 * tipos por categoría, subtipos por tipo, cantones por provincia, parroquias
 * por cantón, zonas turísticas por las localidades del cantón y actividades
 * por categoría.
 */
export function centerCatalogOptions(
  catalogs: AdminCatalogs | null | undefined,
  { categoryId, typeId, provinceId, cantonId }: CenterCatalogSelection,
): CenterCatalogOptions {
  const localityIds = new Set(
    (catalogs?.localities ?? [])
      .filter(
        (locality) =>
          matchesOptional(locality.provinceId, provinceId) &&
          matchesOptional(locality.cantonId, cantonId),
      )
      .map((locality) => Number(locality.id)),
  );
  return {
    types: childrenOf(catalogs?.types, "categoryId", categoryId),
    subtypes: childrenOf(catalogs?.subtypes, "typeId", typeId),
    cantons: childrenOf(catalogs?.cantons, "provinceId", provinceId),
    parishes: childrenOf(catalogs?.parishes, "cantonId", cantonId),
    zones: cantonId
      ? (catalogs?.zones ?? []).filter(
          (zone) => zone.localityId !== undefined && localityIds.has(Number(zone.localityId)),
        )
      : [],
    activities: activityOptionsFor(catalogs, categoryId),
  };
}

function includesId(options: readonly CatalogOption[], id: string): boolean {
  return options.some((option) => Number(option.id) === Number(id));
}

/**
 * Limpia los ids que no corresponden a su catálogo superior (tipo fuera de la
 * categoría, cantón fuera de la provincia, zona fuera del cantón, actividades
 * de otra categoría…). Se aplica una sola vez al cargar o importar datos; al
 * editar, los selectores limpian sus dependientes al cambiar.
 */
export function sanitizeFormValues(
  values: CenterFormValues,
  catalogs: AdminCatalogs,
): CenterFormValues {
  const next = { ...values };
  const parents = centerCatalogOptions(catalogs, next);
  if (next.typeId && !includesId(parents.types, next.typeId)) {
    next.typeId = "";
    next.subtypeId = "";
  }
  if (next.cantonId && !includesId(parents.cantons, next.cantonId)) {
    next.cantonId = "";
    next.parishId = "";
  }
  const children = centerCatalogOptions(catalogs, next);
  if (next.subtypeId && !includesId(children.subtypes, next.subtypeId)) {
    next.subtypeId = "";
  }
  if (next.parishId && !includesId(children.parishes, next.parishId)) {
    next.parishId = "";
  }
  if (next.touristZoneId && !includesId(children.zones, next.touristZoneId)) {
    next.touristZoneId = "";
  }
  next.activityIds = next.activityIds.filter((id) => includesId(children.activities, id));
  return next;
}

function textOf(value: string | number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value);
}

/** Valores del formulario a partir del borrador (o la versión publicada) de la API. */
export function toFormValues(
  data: CenterDraft | null | undefined,
  catalogs: AdminCatalogs,
): CenterFormValues {
  if (!data) return emptyCenterFormValues;
  const subtype = findCatalogOption(catalogs.subtypes, data.subtypeId);
  const type = findCatalogOption(catalogs.types, subtype?.typeId);
  const parish = findCatalogOption(catalogs.parishes, data.parishId);
  const canton = findCatalogOption(catalogs.cantons, parish?.cantonId);
  const facilities = data.facilities ?? [];
  return sanitizeFormValues(
    {
      name: data.name ?? "",
      categoryId: textOf(type?.categoryId),
      typeId: textOf(subtype?.typeId),
      subtypeId: textOf(data.subtypeId),
      touristZoneId: textOf(data.touristZoneId),
      provinceId: textOf(canton?.provinceId),
      cantonId: textOf(parish?.cantonId),
      parishId: textOf(data.parishId),
      productLineId: textOf(data.productLineId),
      scenarioId: textOf(data.scenarioId),
      hierarchyId: textOf(data.hierarchyId),
      latitude: textOf(data.latitude),
      longitude: textOf(data.longitude),
      altitudeMeters: textOf(data.altitudeMeters),
      description: data.description ?? "",
      address: {
        barrio: data.address?.barrio ?? "",
        street: data.address?.street ?? "",
        number: data.address?.number ?? "",
        crossStreet: data.address?.crossStreet ?? "",
      },
      administration: {
        type: data.administration?.type ?? "",
        institution: data.administration?.institution ?? "",
        name: data.administration?.name ?? "",
        position: data.administration?.position ?? "",
        phone: data.administration?.phone ?? "",
        email: data.administration?.email ?? "",
        observation: data.administration?.observation ?? "",
      },
      admission: {
        incomeTypeId: textOf(data.admission?.incomeTypeId),
        attentionModeId: textOf(data.admission?.attentionModeId),
        opensAt: data.admission?.opensAt ?? "",
        closesAt: data.admission?.closesAt ?? "",
        otherAttention: data.admission?.otherAttention ?? "",
        reservations: data.admission?.reservations ?? false,
        priceFrom: textOf(data.admission?.priceFrom),
        priceTo: textOf(data.admission?.priceTo),
        observation: data.admission?.observation ?? "",
      },
      activityIds: (data.activities ?? [])
        .filter((item) => item.active)
        .map((item) => String(item.activityId)),
      accessibilityIds: (data.accessibility ?? [])
        .filter((item) => item.applies)
        .map((item) => String(item.typeId)),
      facilityIds: facilities.map((item) => String(item.typeId)),
      facilityQuantities: Object.fromEntries(
        facilities.map((item) => [String(item.typeId), textOf(item.quantity)]),
      ),
      facilityObservations: Object.fromEntries(
        facilities.map((item) => [String(item.typeId), item.observation ?? ""]),
      ),
    },
    catalogs,
  );
}

/**
 * Aplica los valores precargados desde una ficha MINTUR sobre los actuales:
 * los campos sin fuente en la ficha (zona turística, jerarquía) conservan su
 * valor y los ids incoherentes con sus catálogos se limpian.
 */
export function mergeImportedValues(
  current: CenterFormValues,
  imported: Partial<CenterFormValues>,
  catalogs: AdminCatalogs,
): CenterFormValues {
  return sanitizeFormValues({ ...current, ...imported }, catalogs);
}

function optionalText(value: string): string | undefined {
  return value.trim() || undefined;
}

function toAdmission(admission: CenterFormValues["admission"]): CenterDraft["admission"] {
  const incomeTypeId = toOptionalNumber(admission.incomeTypeId);
  const attentionModeId = toOptionalNumber(admission.attentionModeId);
  if (incomeTypeId === undefined || attentionModeId === undefined) return undefined;
  return {
    incomeTypeId,
    attentionModeId,
    opensAt: admission.opensAt || undefined,
    closesAt: admission.closesAt || undefined,
    otherAttention: optionalText(admission.otherAttention),
    priceFrom: toOptionalNumber(admission.priceFrom),
    priceTo: toOptionalNumber(admission.priceTo),
    reservations: admission.reservations,
    observation: optionalText(admission.observation),
  };
}

function toAdministration(
  administration: CenterFormValues["administration"],
): CenterDraft["administration"] {
  const name = administration.name.trim();
  if (!name) return undefined;
  return {
    type: administration.type.trim() || "OTRO",
    institution: optionalText(administration.institution),
    name,
    position: optionalText(administration.position),
    phone: optionalText(administration.phone),
    email: optionalText(administration.email),
    observation: optionalText(administration.observation),
  };
}

/**
 * Cuerpo del guardado del formulario principal. Descarta las actividades que
 * no pertenecen a la categoría seleccionada.
 */
export function toPayload(
  values: CenterFormValues,
  catalogs: AdminCatalogs | null,
  version?: number,
): SaveCenterInput {
  const validActivities = catalogs
    ? centerCatalogOptions(catalogs, values).activities
    : null;
  const activityIds = validActivities
    ? values.activityIds.filter((id) => includesId(validActivities, id))
    : values.activityIds;
  return {
    name: values.name.trim(),
    subtypeId: toOptionalNumber(values.subtypeId),
    touristZoneId: toOptionalNumber(values.touristZoneId),
    parishId: toOptionalNumber(values.parishId),
    productLineId: toOptionalNumber(values.productLineId),
    scenarioId: toOptionalNumber(values.scenarioId),
    hierarchyId: toOptionalNumber(values.hierarchyId),
    latitude: toOptionalNumber(values.latitude),
    longitude: toOptionalNumber(values.longitude),
    altitudeMeters: toOptionalNumber(values.altitudeMeters),
    description: optionalText(values.description),
    address: {
      barrio: optionalText(values.address.barrio),
      street: optionalText(values.address.street),
      number: optionalText(values.address.number),
      crossStreet: optionalText(values.address.crossStreet),
    },
    administration: toAdministration(values.administration),
    admission: toAdmission(values.admission),
    activities: activityIds.map((id) => ({ activityId: Number(id), active: true })),
    accessibility: values.accessibilityIds.map((id) => ({
      typeId: Number(id),
      applies: true,
    })),
    facilities: values.facilityIds.map((id) => ({
      typeId: Number(id),
      quantity: toOptionalNumber(values.facilityQuantities[id]) ?? 1,
      observation: optionalText(values.facilityObservations[id] ?? ""),
    })),
    version,
  };
}
