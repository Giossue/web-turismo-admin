"use client";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import {
  Alert,
  Button,
  CircularProgress,
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
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";

import { AdminTable, ADMIN_TABLE_PAGE_SIZE } from "@/components/ui/admin-table";
import {
  getAdminOpinionHistory,
  getAdminOpinions,
  reviewAdminOpinion,
  type AdminOpinion,
  type AdminOpinionHistory,
  type OpinionStatus,
  type ReviewAction,
} from "@/lib/admin-api";
import {
  opinionStatusLabel,
  opinionStatusTone,
  opinionTargetTypeLabel,
} from "@/lib/admin-labels";
import { adminKeys } from "@/lib/admin-queries";
import { errorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { webTokens } from "@/theme/tokens";

const pageSize = ADMIN_TABLE_PAGE_SIZE;

type ReviewIntent = {
  opinion: AdminOpinion;
  action: ReviewAction;
};

export function OpinionManagement({
  token,
  onError,
  onNotice,
}: {
  token: string;
  onError: (message: string | null) => void;
  onNotice: (message: string | null) => void;
}) {
  const [items, setItems] = useState<AdminOpinion[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [workingCode, setWorkingCode] = useState<string | null>(null);
  const [reviewIntent, setReviewIntent] = useState<ReviewIntent | null>(null);
  const [historyOpinion, setHistoryOpinion] = useState<AdminOpinion | null>(null);
  const [reason, setReason] = useState("");
  const historyQuery = useQuery({
    queryKey: adminKeys.opinionHistory(historyOpinion?.reviewCode ?? null),
    queryFn: () => getAdminOpinionHistory(token, historyOpinion?.reviewCode ?? ""),
    enabled: Boolean(token && historyOpinion),
  });

  useEffect(() => {
    if (historyQuery.error) {
      onError(
        errorMessage(historyQuery.error, "No se pudo cargar el historial de la opinión."),
      );
    }
  }, [historyQuery.error, onError]);

  const load = useCallback(
    async (nextPage: number) => {
      if (!token) return;
      setLoading(true);
      onError(null);
      try {
        const result = await getAdminOpinions(token, {
          limit: pageSize,
          offset: nextPage * pageSize,
        });
        setItems(result.items);
        setTotal(result.total);
      } catch (cause) {
        onError(errorMessage(cause, "No se pudieron cargar las opiniones pendientes."));
      } finally {
        setLoading(false);
      }
    },
    [onError, token],
  );

  useEffect(() => {
    void Promise.resolve().then(() => load(page));
  }, [load, page]);

  function openReview(opinion: AdminOpinion, action: ReviewAction) {
    setReason("");
    setHistoryOpinion(null);
    setReviewIntent({ opinion, action });
  }

  function openHistory(opinion: AdminOpinion) {
    onError(null);
    setHistoryOpinion(opinion);
  }

  async function submitReview() {
    if (!reviewIntent || !token) return;
    const normalizedReason = reason.trim();
    if (reviewIntent.action === "REJECT" && !normalizedReason) {
      onError("Debes indicar el motivo del rechazo.");
      return;
    }

    setWorkingCode(reviewIntent.opinion.reviewCode);
    onError(null);
    try {
      await reviewAdminOpinion(
        token,
        reviewIntent.opinion.reviewCode,
        reviewIntent.action,
        normalizedReason || undefined,
      );
      setReviewIntent(null);
      setReason("");
      onNotice(
        reviewIntent.action === "APPROVE"
          ? "La opinión fue aprobada y ahora está publicada."
          : reviewIntent.opinion.current
            ? "La edición fue rechazada; la versión anterior sigue publicada."
            : "La opinión fue rechazada y no se mostrará en la aplicación.",
      );
      const nextPage = page > 0 && items.length === 1 ? page - 1 : page;
      if (nextPage !== page) setPage(nextPage);
      else await load(page);
    } catch (cause) {
      onError(errorMessage(cause, "No se pudo revisar la opinión."));
    } finally {
      setWorkingCode(null);
    }
  }

  return (
    <Stack spacing={webTokens.spacing.control}>
      <AdminTable
        ariaLabel="Opiniones de visitantes"
        minWidth={760}
        loading={loading && items.length === 0}
        empty={items.length === 0}
        emptyMessage="No hay opiniones pendientes ni publicadas."
        pagination={{ page, total, pageSize, onPageChange: setPage }}
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
                <Button
                  size="small"
                  variant="text"
                  startIcon={<HistoryRounded />}
                  onClick={() => openHistory(opinion)}
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
        open={historyOpinion !== null}
        onClose={() => setHistoryOpinion(null)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Historial de la opinión</DialogTitle>
        <DialogContent dividers>
          {historyQuery.isPending ? (
            <Stack alignItems="center" spacing={webTokens.spacing.inline} sx={{ py: 5 }}>
              <CircularProgress size={28} />
              <Typography color="text.secondary">Cargando historial…</Typography>
            </Stack>
          ) : historyQuery.data ? (
            <OpinionHistoryDetail history={historyQuery.data} />
          ) : (
            <Alert severity="info">No hay información histórica disponible.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpinion(null)}>Cerrar</Button>
          {historyOpinion?.status === "PENDIENTE" ? (
            <>
              <Button
                color="error"
                onClick={() => openReview(historyOpinion, "REJECT")}
                disabled={workingCode !== null}
              >
                Rechazar
              </Button>
              <Button
                variant="contained"
                onClick={() => openReview(historyOpinion, "APPROVE")}
                disabled={workingCode !== null}
                startIcon={<CheckCircleRounded />}
              >
                Aprobar
              </Button>
            </>
          ) : null}
        </DialogActions>
      </Dialog>

      <Dialog
        open={reviewIntent !== null}
        onClose={() => workingCode === null && setReviewIntent(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {reviewIntent?.action === "APPROVE" ? "Aprobar opinión" : "Rechazar opinión"}
        </DialogTitle>
        <DialogContent>
          {reviewIntent ? (
            <Stack spacing={webTokens.spacing.control} sx={{ pt: 1 }}>
              <Typography>
                <strong>{reviewIntent.opinion.target.name}</strong> · versión{" "}
                {reviewIntent.opinion.version}
              </Typography>
              <OpinionVersionSummary version={reviewIntent.opinion.proposed} expanded />
              {reviewIntent.opinion.current ? (
                <Alert severity="info">
                  Al rechazar esta edición, la versión{" "}
                  {reviewIntent.opinion.current.version} seguirá publicada.
                </Alert>
              ) : null}
              {reviewIntent.action === "REJECT" ? (
                <TextField
                  required
                  autoFocus
                  label="Motivo del rechazo"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  multiline
                  minRows={3}
                  helperText="El motivo se conserva en la auditoría y se muestra al autor."
                  slotProps={{ htmlInput: { maxLength: 1000 } }}
                />
              ) : (
                <Typography color="text.secondary">
                  Esta versión reemplazará la versión publicada anterior, si existe.
                </Typography>
              )}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewIntent(null)} disabled={workingCode !== null}>
            Cancelar
          </Button>
          <Button
            onClick={() => void submitReview()}
            variant="contained"
            color={reviewIntent?.action === "REJECT" ? "error" : "primary"}
            disabled={workingCode !== null}
            startIcon={
              workingCode ? <CircularProgress size={16} /> : <CheckCircleRounded />
            }
          >
            {workingCode
              ? "Guardando…"
              : reviewIntent?.action === "APPROVE"
                ? "Aprobar"
                : "Rechazar"}
          </Button>
        </DialogActions>
      </Dialog>
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
          <Stack
            key={version.reviewCode}
            spacing={webTokens.spacing.inline}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              p: 2,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={webTokens.spacing.inline}
              alignItems={{ sm: "center" }}
              justifyContent="space-between"
            >
              <Typography fontWeight={700}>Versión {version.version}</Typography>
              <OpinionHistoryStatus status={version.status} />
            </Stack>
            <OpinionRating rating={version.rating} />
            <Typography variant="body2">{version.comment || "Sin comentario"}</Typography>
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
        ))}
      </Stack>
    </Stack>
  );
}

function OpinionHistoryStatus({ status }: { status: OpinionStatus }) {
  return (
    <StatusBadge label={opinionStatusLabel(status)} tone={opinionStatusTone(status)} />
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

function OpinionRating({ rating }: { rating: number | null }) {
  return (
    <Typography variant="body2" fontWeight={700} whiteSpace="nowrap">
      {rating === null
        ? "Sin calificación"
        : `${"★".repeat(rating)}${"☆".repeat(5 - rating)}`}
    </Typography>
  );
}
