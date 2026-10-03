"use client";

import CheckRounded from "@mui/icons-material/CheckRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useMemo, useRef, useState } from "react";

import { EstablishmentGridFilters } from "@/components/admin/establishment-grid-filters";
import {
  changeEstablishmentFilter,
  emptyEstablishmentFilters,
  establishmentFiltersToQuery,
  type EstablishmentFilterField,
} from "@/components/admin/establishment-grid-filter-state";
import { AdminGridFilterPanel } from "@/components/ui/admin-grid-filter-panel";
import { SelectField } from "@/components/ui/form/select-field";

import { useAdminFeedback } from "@/components/admin/admin-feedback";
import { RecordActionsMenu } from "@/components/admin/record-actions-menu";
import {
  ReviewDecisionDialog,
  useReviewIntent,
} from "@/components/admin/review-decision-dialog";
import {
  ADMIN_TABLE_PAGE_SIZE,
  type AdminTablePagination,
} from "@/components/ui/admin-table";
import { AdminDataGrid } from "@/components/ui/admin-data-grid";
import {
  reviewAdminCenter,
  reviewAdminEstablishment,
  type AdminCenter,
  type AdminEstablishment,
  type ReviewAction,
} from "@/lib/admin-api";
import {
  adminKeys,
  catalogsQueryOptions,
  centersPageQueryOptions,
  establishmentsPageQueryOptions,
} from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { webTokens } from "@/theme/tokens";
import { CenterTable } from "./centers-section";
import { EstablishmentDetailDialog } from "./establishment-detail-dialog";
import { pageAfterRemoval } from "./pagination";

const pageSize = ADMIN_TABLE_PAGE_SIZE;

type GridSearch = { label: string; value: string; onChange: (value: string) => void };

const REVIEW_HELPER_TEXT: Record<ReviewAction, string> = {
  APPROVE: "Opcional. Puedes dejar una nota para la auditoría.",
  REJECT: "Explica qué debe corregirse antes de volver a solicitar revisión.",
};

type ReviewTab = "centers" | "establishments";

const REVIEW_TABS: { key: ReviewTab; label: string; description: string }[] = [
  {
    key: "centers",
    label: "Fichas",
    description: "Fichas de centros turísticos enviadas a revisión antes de publicarse.",
  },
  {
    key: "establishments",
    label: "Catastros",
    description:
      "Establecimientos enviados a revisión antes de publicarse en la aplicación.",
  },
];

const ACTIVE_FILTER_OPTIONS = [
  { value: "true", label: "Activas" },
  { value: "false", label: "Inactivas" },
];

type ReviewVariables<T> = { item: T; action: ReviewAction; observation?: string };

/** Cola de revisión de fichas y catastros; solo la ven administradores. */
export function ReviewSection({
  token,
  centersPage,
  establishmentsPage,
  onCentersPageChange,
  onEstablishmentsPageChange,
  onOpen,
}: {
  token: string;
  centersPage: number;
  establishmentsPage: number;
  onCentersPageChange: (page: number) => void;
  onEstablishmentsPageChange: (page: number) => void;
  onOpen: (code: string) => void;
}) {
  const queryClient = useQueryClient();
  const { showError, showNotice } = useAdminFeedback();
  const [tab, setTab] = useState<ReviewTab>("centers");
  const [centerSearch, setCenterSearch] = useState("");
  const [centerActive, setCenterActive] = useState("");
  const [establishmentSearch, setEstablishmentSearch] = useState("");
  const [establishmentFilters, setEstablishmentFilters] = useState({
    ...emptyEstablishmentFilters,
  });
  const appliedCenterSearch = useDebouncedValue(centerSearch.trim());
  const appliedEstablishmentSearch = useDebouncedValue(establishmentSearch.trim());
  const { data: catalogs } = useQuery(catalogsQueryOptions(token));
  const centersQuery = useQuery(
    centersPageQueryOptions(token, {
      status: "REVIEW_QUEUE",
      q: appliedCenterSearch || undefined,
      active: centerActive === "" ? undefined : centerActive === "true",
      limit: pageSize,
      offset: centersPage * pageSize,
    }),
  );
  const establishmentsQuery = useQuery(
    establishmentsPageQueryOptions(token, {
      ...establishmentFiltersToQuery(establishmentFilters),
      q: appliedEstablishmentSearch || undefined,
      reviewStatus: "EN_REVISION",
      limit: pageSize,
      offset: establishmentsPage * pageSize,
    }),
  );
  // Total sin filtros para el aviso de la pestaña.
  const pendingEstablishmentsQuery = useQuery(
    establishmentsPageQueryOptions(token, { reviewStatus: "EN_REVISION", limit: 1 }),
  );
  const hasPendingEstablishments = (pendingEstablishmentsQuery.data?.total ?? 0) > 0;
  const centers = centersQuery.data?.items ?? [];
  const establishments = establishmentsQuery.data?.items ?? [];
  const centerReview = useReviewIntent<AdminCenter>();
  const establishmentReview = useReviewIntent<AdminEstablishment>();
  const centerSubmittingRef = useRef(false);

  const centerMutation = useMutation({
    mutationFn: ({ item, action, observation }: ReviewVariables<AdminCenter>) =>
      reviewAdminCenter(token, item.code, action, observation),
    onMutate: () => showError(null),
    onSuccess: async (_, { item, action }) => {
      centerReview.close();
      showNotice(
        action === "APPROVE"
          ? "La ficha fue aprobada y publicada."
          : "La ficha volvió a borrador para corregirla. El motivo quedó registrado.",
      );
      const nextPage = pageAfterRemoval(centersPage, centers.length);
      if (nextPage !== centersPage) onCentersPageChange(nextPage);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminKeys.allCenters(),
          // Si cambia la página, la consulta nueva se carga sola al renderizar.
          refetchType: nextPage === centersPage ? "active" : "none",
        }),
        queryClient.invalidateQueries({ queryKey: adminKeys.summary() }),
        queryClient.invalidateQueries({ queryKey: adminKeys.center(item.code) }),
        queryClient.invalidateQueries({ queryKey: adminKeys.media(item.code) }),
        queryClient.invalidateQueries({ queryKey: adminKeys.allNavigationSummaries() }),
      ]);
    },
    onError: (cause) => showError(errorMessage(cause, "No se pudo actualizar la ficha.")),
    onSettled: () => {
      centerSubmittingRef.current = false;
    },
  });

  const establishmentMutation = useMutation({
    mutationFn: ({ item, action, observation }: ReviewVariables<AdminEstablishment>) =>
      reviewAdminEstablishment(token, item.id, action, observation),
    onMutate: () => showError(null),
    onSuccess: async (_, { action }) => {
      establishmentReview.close();
      showNotice(
        action === "APPROVE"
          ? "El catastro fue aprobado y publicado."
          : "El catastro fue rechazado y la observación quedó registrada.",
      );
      const nextPage = pageAfterRemoval(establishmentsPage, establishments.length);
      if (nextPage !== establishmentsPage) onEstablishmentsPageChange(nextPage);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminKeys.allEstablishments(),
          refetchType: nextPage === establishmentsPage ? "active" : "none",
        }),
        queryClient.invalidateQueries({ queryKey: adminKeys.allNavigationSummaries() }),
      ]);
    },
    onError: (cause) =>
      showError(errorMessage(cause, "No se pudo actualizar el catastro.")),
  });

  const centerIntent = centerReview.intent;
  const establishmentIntent = establishmentReview.intent;

  return (
    <Stack spacing={webTokens.spacing.control}>
      <Tabs
        value={tab}
        onChange={(_, value: ReviewTab) => setTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="Tipo de revisión"
      >
        {REVIEW_TABS.map(({ key, label }) => (
          <Tab
            key={key}
            value={key}
            id={`review-tab-${key}`}
            aria-controls="review-panel"
            aria-label={
              key === "establishments" && hasPendingEstablishments
                ? `${label}, con pendientes`
                : undefined
            }
            label={
              <Stack direction="row" alignItems="center" spacing={1}>
                <span>{label}</span>
                {key === "establishments" && hasPendingEstablishments ? (
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: webTokens.navigation.notification,
                    }}
                  />
                ) : null}
              </Stack>
            }
          />
        ))}
      </Tabs>

      <Stack
        id="review-panel"
        role="tabpanel"
        aria-labelledby={`review-tab-${tab}`}
        spacing={webTokens.spacing.control}
      >
        <Typography variant="body2" color="text.secondary">
          {REVIEW_TABS.find(({ key }) => key === tab)?.description}
        </Typography>

        {tab === "centers" ? (
          <CenterTable
            centers={centers}
            loading={centersQuery.isLoading}
            error={
              centersQuery.error
                ? errorMessage(centersQuery.error, "No se pudieron cargar las fichas.")
                : null
            }
            review={{ pending: centerMutation.isPending, onReview: centerReview.start }}
            onOpen={onOpen}
            pagination={{
              page: centersPage,
              total: centersQuery.data?.total ?? 0,
              onPageChange: onCentersPageChange,
            }}
            search={{
              label: "Buscar por nombre o código",
              value: centerSearch,
              onChange: (value) => {
                setCenterSearch(value);
                onCentersPageChange(0);
              },
            }}
            filterCount={Number(centerActive !== "")}
            filterPanel={
              <AdminGridFilterPanel
                width={360}
                activeCount={Number(centerActive !== "")}
                onClear={() => {
                  setCenterActive("");
                  onCentersPageChange(0);
                }}
              >
                <SelectField
                  id="review-center-active"
                  label="Estado"
                  value={centerActive}
                  options={ACTIVE_FILTER_OPTIONS}
                  emptyLabel="Todas"
                  onChange={(value) => {
                    setCenterActive(value);
                    onCentersPageChange(0);
                  }}
                />
              </AdminGridFilterPanel>
            }
          />
        ) : (
          <EstablishmentReviewTable
            establishments={establishments}
            loading={establishmentsQuery.isLoading}
            error={
              establishmentsQuery.error
                ? errorMessage(
                    establishmentsQuery.error,
                    "No se pudieron cargar los catastros en revisión.",
                  )
                : null
            }
            pagination={{
              page: establishmentsPage,
              total: establishmentsQuery.data?.total ?? 0,
              onPageChange: onEstablishmentsPageChange,
            }}
            search={{
              label: "Buscar por nombre, actividad o registro",
              value: establishmentSearch,
              onChange: (value) => {
                setEstablishmentSearch(value);
                onEstablishmentsPageChange(0);
              },
            }}
            filterCount={Object.values(establishmentFilters).filter(Boolean).length}
            filterPanel={
              <EstablishmentGridFilters
                values={establishmentFilters}
                catalogs={catalogs}
                onChange={(field: EstablishmentFilterField, value: string) => {
                  setEstablishmentFilters((current) =>
                    changeEstablishmentFilter(current, field, value),
                  );
                  onEstablishmentsPageChange(0);
                }}
                onClear={() => {
                  setEstablishmentFilters({ ...emptyEstablishmentFilters });
                  onEstablishmentsPageChange(0);
                }}
              />
            }
            workingId={
              establishmentMutation.isPending
                ? (establishmentMutation.variables?.item.id ?? null)
                : null
            }
            onReview={establishmentReview.start}
          />
        )}
      </Stack>

      {centerIntent ? (
        <ReviewDecisionDialog
          open={centerReview.open}
          title={
            centerIntent.action === "APPROVE"
              ? "Aprobar y publicar ficha"
              : "Devolver ficha para corregir"
          }
          subject={`${centerIntent.item.name || "Esta ficha"} (${centerIntent.item.code})`}
          action={centerIntent.action}
          reason={centerReview.reason}
          onReasonChange={centerReview.setReason}
          helperText={REVIEW_HELPER_TEXT[centerIntent.action]}
          confirmLabel={
            centerIntent.action === "APPROVE"
              ? "Aprobar y publicar"
              : "Devolver para corregir"
          }
          reasonLabel={
            centerIntent.action === "REJECT" ? "Motivo de devolución" : "Observación"
          }
          reasonRequired={centerIntent.action === "REJECT"}
          pending={centerMutation.isPending}
          onCancel={centerReview.close}
          onConfirm={() => {
            if (
              centerSubmittingRef.current ||
              (centerIntent.action === "REJECT" && !centerReview.reason.trim())
            )
              return;
            centerSubmittingRef.current = true;
            centerMutation.mutate({
              item: centerIntent.item,
              action: centerIntent.action,
              observation: centerReview.reason.trim() || undefined,
            });
          }}
        />
      ) : null}
      {establishmentIntent ? (
        <ReviewDecisionDialog
          open={establishmentReview.open}
          title={
            establishmentIntent.action === "APPROVE"
              ? "Aprobar catastro"
              : "Rechazar catastro"
          }
          subject={establishmentIntent.item.nombreComercial || "Este catastro"}
          action={establishmentIntent.action}
          reason={establishmentReview.reason}
          onReasonChange={establishmentReview.setReason}
          helperText={REVIEW_HELPER_TEXT[establishmentIntent.action]}
          pending={establishmentMutation.isPending}
          onCancel={establishmentReview.close}
          onConfirm={() =>
            establishmentMutation.mutate({
              item: establishmentIntent.item,
              action: establishmentIntent.action,
              observation: establishmentReview.reason.trim() || undefined,
            })
          }
        />
      ) : null}
    </Stack>
  );
}

function EstablishmentReviewTable({
  establishments,
  loading,
  error,
  pagination,
  search,
  filterCount,
  filterPanel,
  workingId,
  onReview,
}: {
  establishments: AdminEstablishment[];
  loading: boolean;
  error: string | null;
  pagination: AdminTablePagination;
  search: GridSearch;
  filterCount: number;
  filterPanel: ReactNode;
  workingId: number | null;
  onReview: (establishment: AdminEstablishment, action: ReviewAction) => void;
}) {
  const [detail, setDetail] = useState<AdminEstablishment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const columns = useMemo<GridColDef<AdminEstablishment>[]>(
    () => [
      {
        field: "nombreComercial",
        headerName: "Establecimiento",
        minWidth: 240,
        flex: 1.5,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack justifyContent="center" sx={{ height: "100%", minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={600}
              noWrap
              title={row.nombreComercial}
            >
              {row.nombreComercial}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              title={row.categoriaEtiqueta ?? row.categoria ?? "Sin categoría"}
            >
              {row.categoriaEtiqueta ?? row.categoria ?? "Sin categoría"}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "location",
        headerName: "Ubicación",
        minWidth: 190,
        flex: 1,
        filterable: false,
        valueGetter: (_value, row) => `${row.localityName}, ${row.cantonName}`,
      },
      {
        field: "actividad",
        headerName: "Actividad / tipo de establecimiento",
        minWidth: 280,
        flex: 1.5,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack justifyContent="center" sx={{ height: "100%", minWidth: 0 }}>
            <Typography variant="body2" noWrap title={row.actividad}>
              {row.actividad}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              title={row.clasificacion ?? "Sin tipo de establecimiento"}
            >
              {row.clasificacion ?? "Sin tipo de establecimiento"}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "numeroRegistro",
        headerName: "Registro y RUC",
        minWidth: 175,
        flex: 0.7,
        filterable: false,
        renderCell: ({ row }) => (
          <Stack justifyContent="center" sx={{ height: "100%", minWidth: 0 }}>
            <Typography
              variant="body2"
              noWrap
              title={row.numeroRegistro ?? "Sin registro"}
            >
              {row.numeroRegistro ?? "Sin registro"}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              RUC: {row.ruc ?? "—"}
            </Typography>
          </Stack>
        ),
      },
      {
        field: "requestedBy",
        headerName: "Enviado por",
        minWidth: 140,
        flex: 0.7,
        filterable: false,
        valueFormatter: (value: string | null) => value ?? "—",
      },
      {
        field: "actions",
        headerName: "Acciones",
        width: 96,
        align: "right",
        headerAlign: "right",
        filterable: false,
        renderCell: ({ row, hasFocus }) => (
          <RecordActionsMenu
            subject={row.nombreComercial}
            tabIndex={hasFocus ? 0 : -1}
            actions={[
              {
                label: "Ver detalle",
                icon: <VisibilityRounded fontSize="small" />,
                onClick: () => {
                  setDetail(row);
                  setDetailOpen(true);
                },
              },
              {
                label: "Rechazar",
                icon: <CloseRounded fontSize="small" />,
                color: "error",
                disabled: workingId === row.id,
                onClick: () => onReview(row, "REJECT"),
              },
              {
                label: "Aprobar",
                icon: <CheckRounded fontSize="small" />,
                color: "success",
                disabled: workingId === row.id,
                onClick: () => onReview(row, "APPROVE"),
              },
            ]}
          />
        ),
      },
    ],
    [onReview, workingId],
  );

  return (
    <>
      <AdminDataGrid
        ariaLabel="Catastros en revisión"
        rows={establishments}
        columns={columns}
        loading={loading}
        error={error}
        emptyMessage="No hay catastros pendientes de revisión."
        pagination={pagination}
        search={search}
        filterCount={filterCount}
        filterPanel={filterPanel}
      />
      <EstablishmentDetailDialog
        establishment={detail}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
