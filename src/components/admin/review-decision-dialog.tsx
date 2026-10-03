"use client";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

import type { ReviewAction } from "@/lib/admin-api";
import { webTokens } from "@/theme/tokens";

/** Confirmación de una revisión (aprobar/rechazar) con observación o motivo. */
export function ReviewDecisionDialog({
  open,
  title,
  subject,
  action,
  reason,
  onReasonChange,
  showReason = true,
  reasonLabel = "Observación",
  reasonRequired = false,
  reasonMaxLength,
  helperText,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
  children,
}: {
  open: boolean;
  title: string;
  subject: React.ReactNode;
  action: ReviewAction;
  reason: string;
  onReasonChange: (value: string) => void;
  /** Oculta el campo cuando la decisión no admite observación. */
  showReason?: boolean;
  reasonLabel?: string;
  /** Exige un texto antes de confirmar. */
  reasonRequired?: boolean;
  reasonMaxLength?: number;
  helperText?: string;
  /** Etiqueta específica del flujo; otros dominios conservan Aprobar/Rechazar. */
  confirmLabel?: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** Contenido adicional entre el asunto y el campo de observación. */
  children?: React.ReactNode;
}) {
  const missingReason = showReason && reasonRequired && !reason.trim();

  return (
    <Dialog open={open} onClose={() => !pending && onCancel()} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={webTokens.spacing.control} sx={{ pt: 1 }}>
          <Typography>{subject}</Typography>
          {children}
          {showReason ? (
            <TextField
              label={reasonLabel}
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              required={reasonRequired}
              multiline
              minRows={3}
              helperText={helperText}
              autoFocus
              slotProps={
                reasonMaxLength
                  ? { htmlInput: { maxLength: reasonMaxLength } }
                  : undefined
              }
            />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={pending}>
          Cancelar
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={action === "REJECT" ? "error" : "primary"}
          disabled={pending || missingReason}
          startIcon={pending ? <CircularProgress size={16} /> : <CheckCircleRounded />}
        >
          {pending
            ? "Guardando…"
            : (confirmLabel ?? (action === "APPROVE" ? "Aprobar" : "Rechazar"))}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type ReviewIntent<T> = { item: T; action: ReviewAction; open: boolean };

/**
 * Elemento y acción pendientes de confirmar en un `ReviewDecisionDialog`. Al
 * cerrar se conserva el último elemento para que el diálogo no cambie de
 * contenido durante la transición de salida.
 */
export function useReviewIntent<T>() {
  const [intent, setIntent] = useState<ReviewIntent<T> | null>(null);
  const [reason, setReason] = useState("");

  return {
    intent,
    open: intent?.open ?? false,
    reason,
    setReason,
    start(item: T, action: ReviewAction) {
      setReason("");
      setIntent({ item, action, open: true });
    },
    close() {
      setIntent((current) => (current ? { ...current, open: false } : current));
    },
  };
}
