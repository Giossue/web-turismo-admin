"use client";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
import { pageAfterRemoval } from "@/components/admin/shell/pagination";
import { AdminTable, ADMIN_TABLE_PAGE_SIZE } from "@/components/ui/admin-table";
import { ContentState } from "@/components/ui/content-state";
import { FlatSurface } from "@/components/ui/flat-surface";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  reviewAdminOpinion,
  type AdminOpinion,
  type AdminOpinionHistory,
  type ReviewAction,
} from "@/lib/admin-api";
import {
  opinionStatusLabel,
  opinionStatusTone,
  opinionTargetTypeLabel,
} from "@/lib/admin-labels";
import {
  adminKeys,
  opinionHistoryQueryOptions,
  opinionsPageQueryOptions,
} from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { webTokens } from "@/theme/tokens";

const pageSize = ADMIN_TABLE_PAGE_SIZE;
const MAX_RATING = 5;
const REASON_MAX_LENGTH = 1000;

type ReviewVariables = { item: AdminOpinion; action: ReviewAction; reason?: string };

/** Moderación de opiniones; usa los avisos de `AdminFeedbackProvider`. */
export function OpinionManagement({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const { showError, showNotice } = useAdminFeedback();
  const [page, setPage] = useState(0);
  const opinionsQuery = useQuery(
    opinionsPageQueryOptions(token, { limit: pageSize, offset: page * pageSize }),
  );
  const items = opinionsQuery.data?.items ?? [];
  // Se conserva la opinión al cerrar para no vaciar el diálogo durante la transición.
  const [historyOpinion, setHistoryOpinion] = useState<AdminOpinion | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const historyCode = historyOpinion?.reviewCode ?? null;
  const historyQuery = useQuery({
    ...opinionHistoryQueryOptions(token, historyCode),
    enabled: Boolean(token && historyCode && historyOpen),
  });
  const review = useReviewIntent<AdminOpinion>();

  const reviewMutation = useMutation({
    mutationFn: ({ item, action, reason }: ReviewVariables) =>
      reviewAdminOpinion(token, item.reviewCode, action, reason),
    onMutate: () => showError(null),
    onSuccess: async (_, { item, action }) => {
      review.close();
      showNotice(
        action === "APPROVE"
          ? "La opinión fue aprobada y ahora está publicada."
          : item.current
            ? "La edición fue rechazada; la versión anterior sigue publicada."
            : "La opinión fue rechazada y no se mostrará en la aplicación.",
      );
      const nextPage = pageAfterRemoval(page, items.length);
      if (nextPage !== page) setPage(nextPage);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminKeys.allOpinions(),
          // Si cambia la página, la consulta nueva se carga sola al renderizar.
          refetchType: nextPage === page ? "active" : "none",
        }),
        queryClient.invalidateQueries({
          queryKey: adminKeys.opinionHistory(item.reviewCode),
        }),
      ]);
    },
    onError: (cause) => showError(errorMessage(cause, "No se pudo revisar la opinión.")),
  });

  function openHistory(opinion: AdminOpinion) {
    showError(null);
    setHistoryOpinion(opinion);
    setHistoryOpen(true);
  }

  function openReview(opinion: AdminOpinion, action: ReviewAction) {
    setHistoryOpen(false);
    review.start(opinion, action);
  }

  const intent = review.intent;

  return (
    <Stack spacing={webTokens.spacing.control}>
      <AdminTable
        ariaLabel="Opiniones de visitantes"
        minWidth={760}
        loading={opinionsQuery.isLoading}
        error={
          opinionsQuery.error
            ? errorMessage(
                opinionsQuery.error,
                "No se pudieron cargar las opiniones pendientes.",
              )
            : null
        }
        empty={items.length === 0}
        emptyMessage="No hay opiniones pendientes ni publicadas."
        pagination={{
          page,
          total: opinionsQuery.data?.total ?? 0,
          onPageChange: setPage,
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Lugar</TableCell>
            <TableCell>Usuario</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Calificación</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((opinion) => (
            <TableRow hover key={opinion.reviewCode}>
              <TableCell component="th" scope="row">
                <Typography fontWeight={700}>{opinion.target.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {opinionTargetTypeLabel(opinion.target.type)}
                  {opinion.target.code ? ` · ${opinion.target.code}` : ""}
                </Typography>
              </TableCell>
              <TableCell>{opinion.authorName}</TableCell>
              <TableCell>
                <StatusBadge
                  label={opinionStatusLabel(opinion.status)}
                  tone={opinionStatusTone(opinion.status)}
                />
              </TableCell>
              <TableCell>
                <OpinionVersionSummary version={opinion.proposed} />
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  variant="text"
                  startIcon={<HistoryRounded />}
                  onClick={() => openHistory(opinion)}
                  aria-label={`Ver historial de la opinión sobre ${opinion.target.name}`}
                  sx={{
                    backgroundColor: "transparent",
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  Ver historial
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </AdminTable>

      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Historial de la opinión</DialogTitle>
        <DialogContent dividers>
          {historyQuery.isLoading ? (
            <ContentState status="loading" label="Cargando historial" />
          ) : historyQuery.error ? (
            <ContentState
              status="error"
              message={errorMessage(
                historyQuery.error,
                "No se pudo cargar el historial de la opinión.",
              )}
            />
          ) : historyQuery.data ? (
            <OpinionHistoryDetail history={historyQuery.data} />
          ) : (
            <Alert severity="info">No hay información histórica disponible.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Cerrar</Button>
          {historyOpinion?.status === "PENDIENTE" ? (
            <>
              <Button
                color="error"
                onClick={() => openReview(historyOpinion, "REJECT")}
                disabled={reviewMutation.isPending}
              >
                Rechazar
              </Button>
              <Button
                variant="contained"
                onClick={() => openReview(historyOpinion, "APPROVE")}
                disabled={reviewMutation.isPending}
                startIcon={<CheckCircleRounded />}
              >
                Aprobar
              </Button>
            </>
          ) : null}
        </DialogActions>
      </Dialog>

      {intent ? (
        <ReviewDecisionDialog
          open={review.open}
          title={intent.action === "APPROVE" ? "Aprobar opinión" : "Rechazar opinión"}
          subject={
            <>
              <strong>{intent.item.target.name}</strong> · versión {intent.item.version}
            </>
          }
          action={intent.action}
          reason={review.reason}
          onReasonChange={review.setReason}
          showReason={intent.action === "REJECT"}
          reasonLabel="Motivo del rechazo"
          reasonRequired
          reasonMaxLength={REASON_MAX_LENGTH}
          helperText="El motivo se conserva en la auditoría y se muestra al autor."
          pending={reviewMutation.isPending}
          onCancel={review.close}
          onConfirm={() =>
            reviewMutation.mutate({
              item: intent.item,
              action: intent.action,
              reason:
                intent.action === "REJECT"
                  ? review.reason.trim() || undefined
                  : undefined,
            })
          }
        >
          <OpinionVersionSummary version={intent.item.proposed} expanded />
          {intent.item.current ? (
            <Alert severity="info">
              Al rechazar esta edición, la versión {intent.item.current.version} seguirá
              publicada.
            </Alert>
          ) : null}
          {intent.action === "APPROVE" ? (
            <Typography color="text.secondary">
              Esta versión reemplazará la versión publicada anterior, si existe.
            </Typography>
          ) : null}
        </ReviewDecisionDialog>
      ) : null}
    </Stack>
  );
}

function OpinionHistoryDetail({ history }: { history: AdminOpinionHistory }) {
  return (
    <Stack spacing={webTokens.spacing.control}>
      <Stack spacing={0.5}>
        <Typography variant="h6">{history.target.name}</Typography>
        <Typography color="text.secondary" variant="body2">
          {opinionTargetTypeLabel(history.target.type)}
          {history.target.code ? ` · ${history.target.code}` : ""}
        </Typography>
        <Typography variant="body2">
          Autor: <strong>{history.authorName}</strong>
        </Typography>
      </Stack>
      <Divider />
      <Stack spacing={webTokens.spacing.control}>
        {history.versions.map((version) => (
          <FlatSurface key={version.reviewCode} padding="compact">
            <Stack spacing={webTokens.spacing.inline}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={webTokens.spacing.inline}
                alignItems={{ sm: "center" }}
                justifyContent="space-between"
              >
                <Typography fontWeight={700}>Versión {version.version}</Typography>
                <StatusBadge
                  label={opinionStatusLabel(version.status)}
                  tone={opinionStatusTone(version.status)}
                />
              </Stack>
              <OpinionRating rating={version.rating} />
              <Typography variant="body2">
                {version.comment || "Sin comentario"}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                Enviada: {formatDateTime(version.submittedAt)}
                {version.reviewedAt
                  ? ` · Revisada: ${formatDateTime(version.reviewedAt)}`
                  : ""}
              </Typography>
              {version.moderations.length > 0 ? (
                <Stack spacing={webTokens.spacing.inline} sx={{ pt: 1 }}>
                  <Typography fontWeight={700} variant="body2">
                    Moderación
                  </Typography>
                  {version.moderations.map((moderation, index) => (
                    <Stack key={`${version.reviewCode}-${moderation.createdAt}-${index}`}>
                      <Typography variant="body2">
                        {moderation.action === "APROBAR" ? "Aprobada" : "Rechazada"} por{" "}
                        <strong>{moderation.moderatorName}</strong>
                      </Typography>
                      <Typography color="text.secondary" variant="caption">
                        {formatDateTime(moderation.createdAt)}
                        {moderation.reason ? ` · Motivo: ${moderation.reason}` : ""}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              ) : null}
            </Stack>
          </FlatSurface>
        ))}
      </Stack>
    </Stack>
  );
}

function OpinionVersionSummary({
  expanded = false,
  version,
}: {
  expanded?: boolean;
  version: AdminOpinion["proposed"];
}) {
  return (
    <Stack spacing={expanded ? webTokens.spacing.inline : 0} sx={{ maxWidth: 360 }}>
      <Stack direction="row" spacing={webTokens.spacing.inline} alignItems="center">
        <OpinionRating rating={version.rating} />
        <Typography variant="body2" fontWeight={700}>
          · v{version.version}
        </Typography>
      </Stack>
      {version.comment ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={
            expanded
              ? undefined
              : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }
          }
        >
          {version.comment}
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Sin comentario
        </Typography>
      )}
    </Stack>
  );
}

/** Calificación entera acotada a 0–5 (la API podría enviar valores fuera de rango). */
export function clampRating(rating: number): number {
  if (!Number.isFinite(rating)) return 0;
  return Math.min(MAX_RATING, Math.max(0, Math.round(rating)));
}

function OpinionRating({ rating }: { rating: number | null }) {
  if (rating === null) {
    return (
      <Typography variant="body2" fontWeight={700} whiteSpace="nowrap">
        Sin calificación
      </Typography>
    );
  }
  const value = clampRating(rating);
  return (
    <Typography
      variant="body2"
      fontWeight={700}
      whiteSpace="nowrap"
      role="img"
      aria-label={`${value} de ${MAX_RATING}`}
    >
      {"★".repeat(value)}
      {"☆".repeat(MAX_RATING - value)}
    </Typography>
  );
}
