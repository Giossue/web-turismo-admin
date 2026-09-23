"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useReducer } from "react";

import { ADMIN_SEARCH_DEBOUNCE_MS, useDebouncedValue } from "@/lib/use-debounced-value";
import {
  adminNavReducer,
  effectiveCenterQuery,
  parseAdminNavState,
  serializeAdminNavState,
  type CenterStatusFilter,
} from "./admin-nav-state";
import { resolveSection, type AdminSection } from "./sections";

/**
 * Estado de navegación del panel. Se lee de la URL una sola vez al montar
 * (`useSearchParams`, por eso la página envuelve el panel en `Suspense`) y se
 * refleja en ella con `history.replaceState`, que Next.js sincroniza con su router.
 */
export function useAdminUrlState(isAdmin: boolean) {
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(adminNavReducer, searchParams, parseAdminNavState);
  const section = resolveSection(state.section, isAdmin);
  const debouncedQuery = useDebouncedValue(
    state.queryDraft.trim(),
    ADMIN_SEARCH_DEBOUNCE_MS,
  );
  const centerQuery = effectiveCenterQuery(state.queryDraft, debouncedQuery);
  const search = serializeAdminNavState(state, section, centerQuery);

  useEffect(() => {
    if (window.location.search === search) return;
    window.history.replaceState(null, "", `${window.location.pathname}${search}`);
  }, [search]);

  const actions = useMemo(
    () => ({
      navigate: (next: AdminSection) => dispatch({ type: "navigate", section: next }),
      openEditor: (code?: string | null) =>
        dispatch({ type: "openEditor", code: code ?? null }),
      editorSaved: (code: string, session: number) =>
        dispatch({ type: "editorSaved", code, session }),
      setCenterStatus: (status: CenterStatusFilter) =>
        dispatch({ type: "setCenterStatus", status }),
      setQueryDraft: (query: string) => dispatch({ type: "setQueryDraft", query }),
      setCentersPage: (page: number) => dispatch({ type: "setCentersPage", page }),
      setReviewCentersPage: (page: number) =>
        dispatch({ type: "setReviewCentersPage", page }),
      setReviewEstablishmentsPage: (page: number) =>
        dispatch({ type: "setReviewEstablishmentsPage", page }),
    }),
    [],
  );

  return { state, section, centerQuery, ...actions };
}
