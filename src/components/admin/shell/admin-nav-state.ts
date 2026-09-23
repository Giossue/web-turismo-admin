import { isAdminSection, type AdminSection } from "./sections";

export const CENTER_STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "EN_REVISION", label: "En revisión" },
  { value: "APROBADO", label: "Aprobado" },
  { value: "PUBLICADO", label: "Publicado" },
  { value: "RECHAZADO", label: "Rechazado" },
  { value: "INACTIVO", label: "Inactivo" },
] as const;

export type CenterStatusFilter = (typeof CENTER_STATUS_FILTER_OPTIONS)[number]["value"];

/** Longitud mínima de una búsqueda de fichas. */
const MIN_CENTER_QUERY_LENGTH = 2;

function isCenterStatusFilter(value: string | null): value is CenterStatusFilter {
  return CENTER_STATUS_FILTER_OPTIONS.some((option) => option.value === value);
}

/** Estado de navegación del panel; se refleja en la URL (`?section=…`). */
export type AdminNavState = {
  section: AdminSection;
  editorCode: string | null;
  /** Aumenta al abrir el editor: es la `key` que reinicia su estado local. */
  editorSession: number;
  centerStatus: CenterStatusFilter;
  /** Texto escrito en la búsqueda de fichas (se consulta con retardo). */
  queryDraft: string;
  centersPage: number;
  reviewCentersPage: number;
  reviewEstablishmentsPage: number;
};

export type AdminNavAction =
  | { type: "navigate"; section: AdminSection }
  | { type: "openEditor"; code: string | null }
  | { type: "editorSaved"; code: string; session: number }
  | { type: "setCenterStatus"; status: CenterStatusFilter }
  | { type: "setQueryDraft"; query: string }
  | { type: "setCentersPage"; page: number }
  | { type: "setReviewCentersPage"; page: number }
  | { type: "setReviewEstablishmentsPage"; page: number };

type SearchParamsLike = { get: (name: string) => string | null };

/** Página 0-based a partir de un parámetro 1-based; 0 si falta o no es válido. */
function parsePage(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page - 1 : 0;
}

/** Estado inicial a partir de la URL (una sola lectura al montar el panel). */
export function parseAdminNavState(params: SearchParamsLike): AdminNavState {
  const fromUrl = params.get("section");
  const section = isAdminSection(fromUrl) ? fromUrl : "summary";
  const status = params.get("status");
  const query = params.get("q")?.trim() ?? "";
  const page = parsePage(params.get("page"));
  return {
    section,
    editorCode: section === "editor" ? params.get("code") || null : null,
    editorSession: 0,
    centerStatus: isCenterStatusFilter(status) ? status : "ALL",
    queryDraft: query.length >= MIN_CENTER_QUERY_LENGTH ? query : "",
    centersPage: section === "centers" || section === "editor" ? page : 0,
    reviewCentersPage: section === "review" ? page : 0,
    reviewEstablishmentsPage:
      section === "review" ? parsePage(params.get("establishmentsPage")) : 0,
  };
}

/**
 * Cadena de búsqueda (con `?`) que representa el estado. Solo incluye los
 * parámetros del apartado visible; `section` es el apartado efectivo según el
 * rol y `centerQuery` la búsqueda ya aplicada (tras el retardo).
 */
export function serializeAdminNavState(
  state: AdminNavState,
  section: AdminSection,
  centerQuery: string,
): string {
  const params = new URLSearchParams();
  params.set("section", section);
  if (section === "centers" && state.centerStatus !== "ALL") {
    params.set("status", state.centerStatus);
  }
  if (section === "centers" && centerQuery) params.set("q", centerQuery);
  if (section === "editor" && state.editorCode) params.set("code", state.editorCode);
  const page =
    section === "review"
      ? state.reviewCentersPage
      : section === "centers" || section === "editor"
        ? state.centersPage
        : 0;
  if (page > 0) params.set("page", String(page + 1));
  if (section === "review" && state.reviewEstablishmentsPage > 0) {
    params.set("establishmentsPage", String(state.reviewEstablishmentsPage + 1));
  }
  return `?${params.toString()}`;
}

export function adminNavReducer(
  state: AdminNavState,
  action: AdminNavAction,
): AdminNavState {
  switch (action.type) {
    case "navigate": {
      if (action.section === state.section) return state;
      // Volver a "centers" (por ejemplo, desde el editor) conserva la búsqueda y
      // la página del listado; cualquier otro apartado las reinicia.
      const keepCenters = action.section === "centers";
      return {
        ...state,
        section: action.section,
        editorCode: null,
        queryDraft: keepCenters ? state.queryDraft : "",
        centersPage: keepCenters ? state.centersPage : 0,
        reviewCentersPage: 0,
        reviewEstablishmentsPage: 0,
      };
    }
    case "openEditor":
      return {
        ...state,
        section: "editor",
        editorCode: action.code,
        editorSession: state.editorSession + 1,
      };
    case "editorSaved":
      // Un guardado tardío de otra sesión del editor no debe cambiar la ficha abierta.
      if (state.section !== "editor" || action.session !== state.editorSession) {
        return state;
      }
      return action.code === state.editorCode
        ? state
        : { ...state, editorCode: action.code };
    case "setCenterStatus":
      return { ...state, centerStatus: action.status, centersPage: 0 };
    case "setQueryDraft":
      return { ...state, queryDraft: action.query, centersPage: 0 };
    case "setCentersPage":
      return { ...state, centersPage: Math.max(action.page, 0) };
    case "setReviewCentersPage":
      return { ...state, reviewCentersPage: Math.max(action.page, 0) };
    case "setReviewEstablishmentsPage":
      return { ...state, reviewEstablishmentsPage: Math.max(action.page, 0) };
  }
}

/**
 * Búsqueda aplicada: vacía si el texto actual es corto (así borrar el campo no
 * espera al retardo) o si el valor con retardo aún no alcanza el mínimo.
 */
export function effectiveCenterQuery(draft: string, debounced: string): string {
  return draft.trim().length < MIN_CENTER_QUERY_LENGTH ||
    debounced.length < MIN_CENTER_QUERY_LENGTH
    ? ""
    : debounced;
}
