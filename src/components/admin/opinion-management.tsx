"use client";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";

import { AdminTable, AdminTableFooter } from "@/components/ui/admin-table";
import { getAdminOpinions, reviewAdminOpinion, type AdminOpinion } from "@/lib/admin-api";
import { webTokens } from "@/theme/tokens";

const pageSize = 20;

type ReviewIntent = {
  opinion: AdminOpinion;
  action: "APPROVE" | "REJECT";
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
  const [reason, setReason] = useState("");

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
        onError(
          cause instanceof Error
            ? cause.message
            : "No se pudieron cargar las opiniones pendientes.",
        );
      } finally {
        setLoading(false);
      }
    },
    [onError, token],
  );

  useEffect(() => {
    void Promise.resolve().then(() => load(page));
  }, [load, page]);

  function openReview(opinion: AdminOpinion, action: "APPROVE" | "REJECT") {
    setReason("");
    setReviewIntent({ opinion, action });
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
      onError(cause instanceof Error ? cause.message : "No se pudo revisar la opinión.");
    } finally {
      setWorkingCode(null);
    }
  }

  return (
    <Stack spacing={webTokens.spacing.control}>
      <AdminTable
        ariaLabel="Opiniones pendientes de moderación"
        minWidth={1100}
        loading={loading && items.length === 0}
        empty={!loading && items.length === 0}
        emptyMessage="No hay opiniones pendientes de moderación."
        footer={
          <AdminTableFooter
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        }
      >
        <TableHead>
          <TableRow>
            <TableCell>Lugar</TableCell>
            <TableCell>Usuario</TableCell>
            <TableCell>Versión propuesta</TableCell>
            <TableCell>Versión publicada</TableCell>
            <TableCell>Enviada</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((opinion) => (
            <TableRow hover key={opinion.reviewCode}>
              <TableCell component="th" scope="row">
                <Typography fontWeight={700}>{opinion.target.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {opinion.target.type === "CENTRO"
                    ? "Centro turístico"
                    : "Punto de interés"}
                  {opinion.target.code ? ` · ${opinion.target.code}` : ""}
                </Typography>
              </TableCell>
              <TableCell>{opinion.authorName}</TableCell>
              <TableCell>
                <OpinionVersionSummary version={opinion.proposed} />
              </TableCell>
              <TableCell>
                {opinion.current ? (
                  <OpinionVersionSummary version={opinion.current} />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Nueva opinión
                  </Typography>
                )}
              </TableCell>
              <TableCell>{formatDate(opinion.submittedAt)}</TableCell>
              <TableCell align="right">
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={webTokens.spacing.inline}
                  justifyContent="flex-end"
                >
                  <Button
                    size="small"
                    variant="contained"
                    disabled={workingCode !== null}
                    onClick={() => openReview(opinion, "APPROVE")}
                  >
                    Aprobar
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    variant="text"
                    disabled={workingCode !== null}
                    onClick={() => openReview(opinion, "REJECT")}
                  >
                    Rechazar
                  </Button>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </AdminTable>

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
                  inputProps={{ maxLength: 1000 }}
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

function OpinionVersionSummary({
  expanded = false,
  version,
}: {
  expanded?: boolean;
  version: AdminOpinion["proposed"];
}) {
  return (
    <Stack spacing={expanded ? webTokens.spacing.inline : 0} sx={{ maxWidth: 360 }}>
      <Typography variant="body2" fontWeight={700}>
        {version.rating === null
          ? "Sin calificación"
          : `${"★".repeat(version.rating)}${"☆".repeat(5 - version.rating)}`}
        {` · v${version.version}`}
      </Typography>
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

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("es-EC", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}
