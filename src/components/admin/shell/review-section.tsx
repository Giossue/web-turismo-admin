"use client";

import CheckRounded from "@mui/icons-material/CheckRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import VisibilityRounded from "@mui/icons-material/VisibilityRounded";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";

import { useAdminFeedback } from "@/components/admin/admin-feedback";
import {
  ReviewDecisionDialog,
  useReviewIntent,
} from "@/components/admin/review-decision-dialog";
import {
  ADMIN_TABLE_PAGE_SIZE,
  type AdminTablePagination,
} from "@/components/ui/admin-table";
import { AdminDataGrid } from "@/components/ui/admin-data-grid";
import { SectionHeader } from "@/components/ui/section-header";
import {
  reviewAdminCenter,
  reviewAdminEstablishment,
  type AdminCenter,
  type AdminEstablishment,
  type ReviewAction,
} from "@/lib/admin-api";
import {
  adminKeys,
  centersPageQueryOptions,
  establishmentsPageQueryOptions,
} from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { webTokens } from "@/theme/tokens";
import { CenterTable } from "./centers-section";
import { EstablishmentDetailDialog } from "./establishment-detail-dialog";
import { pageAfterRemoval } from "./pagination";

const pageSize = ADMIN_TABLE_PAGE_SIZE;

const REVIEW_HELPER_TEXT: Record<ReviewAction, string> = {
  APPROVE: "Opcional. Puedes dejar una nota para la auditoría.",
  REJECT: "Explica qué debe corregirse antes de volver a solicitar revisión.",
};

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
  const centersQuery = useQuery(
    centersPageQueryOptions(token, {
      status: "REVIEW_QUEUE",
      limit: pageSize,
      offset: centersPage * pageSize,
    }),
  );
  const establishmentsQuery = useQuery(
    establishmentsPageQueryOptions(token, {
      reviewStatus: "EN_REVISION",
      limit: pageSize,
      offset: establishmentsPage * pageSize,
    }),
  );
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
      await queryClient.invalidateQueries({
        queryKey: adminKeys.allEstablishments(),
        refetchType: nextPage === establishmentsPage ? "active" : "none",
      });
    },
    onError: (cause) =>
      showError(errorMessage(cause, "No se pudo actualizar el catastro.")),
  });

  const centerIntent = centerReview.intent;
  const establishmentIntent = establishmentReview.intent;

  return (
    <Stack spacing={webTokens.spacing.control}>
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
      />
      <Box sx={{ pt: 2 }}>
        <SectionHeader
          title="Catastros en revisión"
          description="Establecimientos enviados a revisión antes de publicarse en la aplicación."
        />
      </Box>
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
        workingId={
          establishmentMutation.isPending
            ? (establishmentMutation.variables?.item.id ?? null)
            : null
        }
        onReview={establishmentReview.start}
      />

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
  workingId,
  onReview,
}: {
  establishments: AdminEstablishment[];
  loading: boolean;
  error: string | null;
  pagination: AdminTablePagination;
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
        width: 155,
        align: "right",
        headerAlign: "right",
        filterable: false,
        renderCell: ({ row, hasFocus }) => (
          <Stack direction="row" alignItems="center" justifyContent="flex-end">
            <Tooltip title="Ver detalle" disableInteractive>
              <IconButton
                aria-label={`Ver detalle de ${row.nombreComercial}`}
                tabIndex={hasFocus ? 0 : -1}
                onClick={() => {
                  setDetail(row);
                  setDetailOpen(true);
                }}
              >
                <VisibilityRounded fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rechazar" disableInteractive>
              <span>
                <IconButton
                  color="error"
                  aria-label={`Rechazar catastro ${row.nombreComercial}`}
                  tabIndex={hasFocus ? 0 : -1}
                  onClick={() => onReview(row, "REJECT")}
                  disabled={workingId === row.id}
                >
                  <CloseRounded fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Aprobar" disableInteractive>
              <span>
                <IconButton
                  color="success"
                  aria-label={`Aprobar catastro ${row.nombreComercial}`}
                  tabIndex={hasFocus ? 0 : -1}
                  onClick={() => onReview(row, "APPROVE")}
                  disabled={workingId === row.id}
                >
                  <CheckRounded fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
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
      />
      <EstablishmentDetailDialog
        establishment={detail}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
