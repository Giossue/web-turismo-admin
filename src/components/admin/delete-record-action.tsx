"use client";

import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useId, useState } from "react";

import { useAdminFeedback } from "@/components/admin/admin-feedback";
import { errorMessage } from "@/lib/errors";

/** Eliminación confirmada con el nombre del registro, pendiente y error recuperable. */
export function DeleteRecordAction({
  subject,
  title,
  description,
  onDelete,
  queryKeys,
  onDeleted,
  tabIndex,
  disabled = false,
}: {
  subject: string;
  title: string;
  description: string;
  onDelete: () => Promise<unknown>;
  queryKeys: readonly QueryKey[];
  onDeleted?: () => void;
  tabIndex?: number;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const queryClient = useQueryClient();
  const { clear, showNotice } = useAdminFeedback();
  const deletion = useMutation({
    mutationFn: onDelete,
    onSuccess: async () => {
      setOpen(false);
      onDeleted?.();
      showNotice("Registro eliminado. El historial se conserva.");
      await Promise.all(
        queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      );
    },
  });

  function close() {
    if (!deletion.isPending) setOpen(false);
  }

  return (
    <>
      <Tooltip title="Eliminar" disableInteractive>
        <span>
          <IconButton
            aria-label={`Eliminar ${subject}`}
            tabIndex={tabIndex}
            disabled={disabled || deletion.isPending}
            onClick={() => {
              clear();
              deletion.reset();
              setOpen(true);
            }}
          >
            <DeleteOutlineRounded fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Dialog
        open={open}
        onClose={close}
        fullWidth
        maxWidth="sm"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
      >
        <DialogTitle id={`${id}-title`}>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText id={`${id}-description`}>
            ¿Eliminar <strong>{subject}</strong>? {description}
          </DialogContentText>
          {deletion.error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {errorMessage(deletion.error, "No se pudo eliminar el registro.")}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={close} disabled={deletion.isPending} autoFocus>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            disabled={deletion.isPending}
            onClick={() => !deletion.isPending && deletion.mutate()}
            startIcon={deletion.isPending ? <CircularProgress size={16} /> : undefined}
          >
            {deletion.isPending ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
