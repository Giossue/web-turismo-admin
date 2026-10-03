"use client";

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useId, useState, type ReactNode } from "react";

import { useAdminFeedback } from "@/components/admin/admin-feedback";
import { errorMessage } from "@/lib/errors";

export type DeleteRecordActionProps = {
  subject: string;
  title: string;
  description: string;
  onDelete: () => Promise<unknown>;
  queryKeys: readonly QueryKey[];
  onDeleted?: () => void;
  disabled?: boolean;
  renderTrigger: (trigger: { onClick: () => void; disabled: boolean }) => ReactNode;
};

/** Eliminación confirmada; el diálogo permanece montado al cerrar el menú de acciones. */
export function DeleteRecordAction({
  subject,
  title,
  description,
  onDelete,
  queryKeys,
  onDeleted,
  renderTrigger,
  disabled = false,
}: DeleteRecordActionProps) {
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
      {renderTrigger({
        disabled: disabled || deletion.isPending,
        onClick: () => {
          clear();
          deletion.reset();
          setOpen(true);
        },
      })}
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
