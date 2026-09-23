"use client";

import { Alert, Box, Button, Stack } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { SectionCard } from "@/components/admin/center-sections/section-card";
import { ContentState } from "@/components/ui/content-state";
import type { AdminCatalogs, AdminCenterDetail, AdminMediaItem } from "@/lib/admin-api";
import {
  centerMediaQueryOptions,
  centerSectionsQueryOptions,
} from "@/lib/admin-queries";
import {
  centerSectionDefinitions,
  type CenterSectionCode,
} from "@/lib/center-sections/definitions";
import { errorMessage } from "@/lib/errors";
import type { SugerenciasSecciones } from "@/lib/ficha/sugerencias-secciones";
import { webTokens } from "@/theme/tokens";

const EMPTY_MEDIA: readonly AdminMediaItem[] = [];

/**
 * Apartados de la ficha turística en un solo recorrido. Cada apartado es un
 * formulario independiente con guardado automático (`SectionCard`) que queda
 * montado mientras el editor muestra un paso a la vez, así las ediciones
 * pendientes sobreviven a la navegación.
 */
export function ContinuousCenterSectionWorkflow({
  token,
  code,
  detail,
  catalogs,
  canEdit,
  activeSectionCode,
  visible,
  onDetailChanged,
  onError,
  sugerenciasImportadas,
}: {
  token: string;
  code: string | null;
  detail: AdminCenterDetail | null;
  catalogs: AdminCatalogs | null;
  canEdit: boolean;
  activeSectionCode: CenterSectionCode | null;
  visible: boolean;
  onDetailChanged: (detail: AdminCenterDetail) => void;
  onError: (message: string | null) => void;
  /** Ver src/lib/ficha/sugerencias-secciones.ts. */
  sugerenciasImportadas?: SugerenciasSecciones | null;
}) {
  const sectionsQuery = useQuery(centerSectionsQueryOptions(token, code));
  const mediaQuery = useQuery(centerMediaQueryOptions(token, code));
  const mediaItems = mediaQuery.data?.items ?? EMPTY_MEDIA;
  const draftSections = detail?.draft?.sections;
  const loadedSections = sectionsQuery.data?.sections;
  // Cada apartado conserva la identidad de su objeto mientras no cambie, para
  // que `SectionCard` (memo) no se vuelva a renderizar por los demás.
  const sections: Partial<Record<CenterSectionCode, unknown>> = useMemo(
    () => ({ ...draftSections, ...loadedSections }),
    [draftSections, loadedSections],
  );
  const display = visible ? "flex" : "none";

  if (code && sectionsQuery.isLoading) {
    return (
      <Box sx={{ display: visible ? "block" : "none" }}>
        <ContentState status="loading" label="Cargando secciones de la ficha" />
      </Box>
    );
  }

  const retryButton = (
    <Button
      type="button"
      color="inherit"
      size="small"
      onClick={() => void sectionsQuery.refetch()}
    >
      Reintentar
    </Button>
  );

  // Sin datos no hay formularios que mostrar; con datos, un error al
  // actualizar en segundo plano no desmonta los formularios (ni sus cambios).
  if (sectionsQuery.isLoadingError) {
    return (
      <Box sx={{ display: visible ? "block" : "none" }}>
        <Alert severity="error" action={retryButton}>
          {errorMessage(
            sectionsQuery.error,
            "No se pudieron cargar las secciones de la ficha.",
          )}
        </Alert>
      </Box>
    );
  }

  return (
    <Stack spacing={webTokens.spacing.section} sx={{ display }}>
      {sectionsQuery.isRefetchError ? (
        <Alert severity="warning" action={retryButton}>
          No se pudieron actualizar las secciones de la ficha. Se muestran los últimos
          datos cargados.
        </Alert>
      ) : null}
      {centerSectionDefinitions.map((definition) => (
        <SectionCard
          // Cambiar de ficha monta formularios nuevos; los anteriores guardan
          // su cambio pendiente en la ficha a la que pertenecen.
          key={`${code ?? "nueva"}:${definition.code}`}
          active={definition.code === activeSectionCode}
          definition={definition}
          token={token}
          code={code}
          canEdit={canEdit}
          rawSection={sections[definition.code]}
          catalogs={catalogs}
          mediaItems={mediaItems}
          sugerencias={sugerenciasImportadas}
          onDetailChanged={onDetailChanged}
          onError={onError}
        />
      ))}
    </Stack>
  );
}
