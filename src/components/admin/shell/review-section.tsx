"use client";

import {
  Box,
  Button,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useAdminFeedback } from "@/components/admin/admin-feedback";
import {
  ReviewDecisionDialog,
  useReviewIntent,
} from "@/components/admin/review-decision-dialog";
import {
  AdminTable,
  ADMIN_TABLE_PAGE_SIZE,
  type AdminTablePagination,
} from "@/components/ui/admin-table";
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

  const centerMutation = useMutation({
    mutationFn: ({ item, action, observation }: ReviewVariables<AdminCenter>) =>
      reviewAdminCenter(token, item.code, action, observation),
    onMutate: () => showError(null),
    onSuccess: async (_, { item, action }) => {
      centerReview.close();
      showNotice(
        action === "APPROVE"
          ? "La ficha fue aprobada correctamente."
          : "La ficha fue rechazada y la observación quedó registrada.",
      );
      // Las fichas aprobadas siguen en la cola; las rechazadas salen de ella.
      const nextPage =
        action === "REJECT" ? pageAfterRemoval(centersPage, centers.length) : centersPage;
      if (nextPage !== centersPage) onCentersPageChange(nextPage);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminKeys.allCenters(),
          // Si cambia la página, la consulta nueva se carga sola al renderizar.
          refetchType: nextPage === centersPage ? "active" : "none",
        }),
        queryClient.invalidateQueries({ queryKey: adminKeys.summary() }),
        queryClient.invalidateQueries({ queryKey: adminKeys.center(item.code) }),
      ]);
    },
    onError: (cause) => showError(errorMessage(cause, "No se pudo actualizar la ficha.")),
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
          title={centerIntent.action === "APPROVE" ? "Aprobar ficha" : "Rechazar ficha"}
          subject={`${centerIntent.item.name || "Esta ficha"} (${centerIntent.item.code})`}
          action={centerIntent.action}
          reason={centerReview.reason}
          onReasonChange={centerReview.setReason}
          helperText={REVIEW_HELPER_TEXT[centerIntent.action]}
          pending={centerMutation.isPending}
          onCancel={centerReview.close}
          onConfirm={() =>
            centerMutation.mutate({
              item: centerIntent.item,
              action: centerIntent.action,
              observation: centerReview.reason.trim() || undefined,
            })
          }
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

  return (
    <>
      <AdminTable
        ariaLabel="Catastros en revisión"
        minWidth={900}
        loading={loading}
        error={error}
        empty={establishments.length === 0}
        emptyMessage="No hay catastros pendientes de revisión."
        pagination={pagination}
      >
        <TableHead>
          <TableRow>
            <TableCell>Establecimiento</TableCell>
            <TableCell>Ubicación</TableCell>
            <TableCell>Actividad / clasificación</TableCell>
            <TableCell>Registro y RUC</TableCell>
            <TableCell>Enviado por</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {establishments.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell component="th" scope="row">
                <Typography fontWeight={600}>{item.nombreComercial}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.categoriaEtiqueta ?? item.categoria ?? "Sin categoría"}
                </Typography>
              </TableCell>
              <TableCell>
                {item.localityName}, {item.cantonName}
              </TableCell>
              <TableCell>
                {item.actividad}
                <Typography variant="caption" display="block" color="text.secondary">
                  {item.clasificacion ?? "Sin clasificación"}
                </Typography>
              </TableCell>
              <TableCell>
                {item.numeroRegistro ?? "Sin registro"}
                <Typography variant="caption" display="block" color="text.secondary">
                  RUC: {item.ruc ?? "—"}
                </Typography>
              </TableCell>
              <TableCell>{item.requestedBy ?? "—"}</TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  onClick={() => {
                    setDetail(item);
                    setDetailOpen(true);
                  }}
                >
                  Ver detalle
                </Button>
                <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                  <Button
                    size="small"
                    color="error"
                    onClick={() => onReview(item, "REJECT")}
                    disabled={workingId === item.id}
                  >
                    Rechazar
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => onReview(item, "APPROVE")}
                    disabled={workingId === item.id}
                  >
                    Aprobar
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </AdminTable>
      <EstablishmentDetailDialog
        establishment={detail}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
