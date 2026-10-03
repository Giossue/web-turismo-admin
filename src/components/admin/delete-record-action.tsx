"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useId, useRef, useState, type ReactNode } from "react";

import { useAdminFeedback } from "@/components/admin/admin-feedback";
import { LoadingSpinner } from "@/components/ui/loading-state";
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
  const deletingRef = useRef(false);
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
    onSettled: () => {
      deletingRef.current = false;
    },
  });

  function close() {
    if (!deletingRef.current && !deletion.isPending) setOpen(false);
  }

  function confirmDeletion() {
    if (deletingRef.current || deletion.isPending) return;
    // El bloqueo se aplica antes de que React renderice el estado pendiente.
    deletingRef.current = true;
    deletion.mutate();
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
            onClick={confirmDeletion}
            startIcon={
              deletion.isPending ? (
                <LoadingSpinner label="Eliminando" size={16} color="inherit" />
              ) : undefined
            }
          >
            {deletion.isPending ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
