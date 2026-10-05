"use client";

import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import CloudUploadRounded from "@mui/icons-material/CloudUploadRounded";
import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRef, useState, type DragEvent } from "react";

import { errorMessage } from "@/lib/errors";
import { webTokens } from "@/theme/tokens";

export const PHOTO_ACCEPT = "image/jpeg,image/png";
const PHOTO_TYPES = new Set(PHOTO_ACCEPT.split(","));
/** Igual que `MEDIA_MAX_IMAGE_BYTES` de la API; se valida antes de subir. */
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
/** Pausa breve para que se vea el resultado antes de cerrar el modal. */
const CLOSE_DELAY_MS = 800;

type UploadStatus = "pending" | "uploading" | "done" | "error";
type QueuedPhoto = { id: string; file: File; status: UploadStatus; error?: string };

function validationError(file: File): string | null {
  if (!PHOTO_TYPES.has(file.type)) return "Solo se aceptan imágenes JPEG o PNG.";
  if (file.size > PHOTO_MAX_BYTES) return "Pesa más de 5 MB.";
  return null;
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Modal de carga de fotografías: arrastrar y soltar o elegir del equipo,
 * varias a la vez. Sube una por una mostrando su estado y se cierra solo
 * cuando todas terminaron bien; si alguna falla, queda abierto con el motivo.
 */
export function PhotoUploadDialog({
  open,
  onClose,
  upload,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  upload: (
    file: File,
    metadata: { description: string; sourceAuthor: string },
  ) => Promise<void>;
  /** Se llama una vez al terminar la tanda con la cantidad subida. */
  onUploaded: (count: number) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueuedPhoto[]>([]);
  const [description, setDescription] = useState("");
  const [sourceAuthor, setSourceAuthor] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pending = queue.filter((item) => item.status === "pending");
  const finished = queue.filter((item) => item.status === "done").length;
  const progress = queue.length === 0 ? 0 : Math.round((finished / queue.length) * 100);

  function reset() {
    setQueue([]);
    setDescription("");
    setSourceAuthor("");
    setDragging(false);
  }

  function close() {
    if (uploading) return;
    reset();
    onClose();
  }

  function addFiles(files: FileList | null) {
    if (!files || uploading) return;
    const added = Array.from(files).map((file): QueuedPhoto => {
      const error = validationError(file);
      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        status: error ? "error" : "pending",
        error: error ?? undefined,
      };
    });
    // Una tanda nueva reemplaza los resultados de la anterior ya terminada.
    setQueue((current) => [
      ...current.filter((item) => item.status === "pending"),
      ...added,
    ]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function setStatus(id: string, status: UploadStatus, error?: string) {
    setQueue((current) =>
      current.map((item) => (item.id === id ? { ...item, status, error } : item)),
    );
  }

  async function start() {
    if (uploading || pending.length === 0) return;
    setUploading(true);
    let uploaded = 0;
    let failed = 0;
    for (const item of pending) {
      setStatus(item.id, "uploading");
      try {
        await upload(item.file, { description, sourceAuthor });
        setStatus(item.id, "done");
        uploaded += 1;
      } catch (cause) {
        setStatus(item.id, "error", errorMessage(cause, "No se pudo subir."));
        failed += 1;
      }
    }
    setUploading(false);
    if (uploaded > 0) onUploaded(uploaded);
    if (failed === 0) {
      setTimeout(() => {
        reset();
        onClose();
      }, CLOSE_DELAY_MS);
    }
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Subir fotografías</DialogTitle>
      <DialogContent>
        <Stack spacing={webTokens.spacing.control} sx={{ pt: 1 }}>
          <Box
            component="button"
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            disabled={uploading}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              width: "100%",
              p: 4,
              border: "2px dashed",
              borderColor: dragging ? "primary.main" : "divider",
              borderRadius: `${webTokens.shape.radius}px`,
              bgcolor: dragging ? "action.hover" : "transparent",
              color: "text.primary",
              font: "inherit",
              cursor: uploading ? "default" : "pointer",
              transition: "border-color 120ms, background-color 120ms",
              "&:hover:not(:disabled)": { borderColor: "primary.main" },
            }}
          >
            <CloudUploadRounded color="primary" sx={{ fontSize: 40 }} />
            <Typography fontWeight={600}>
              Arrastra las fotos aquí o haz clic para elegirlas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              JPEG o PNG, hasta 5 MB cada una. Se recortan a 4:3 y se guardan en WebP.
            </Typography>
          </Box>
          <input
            ref={fileInput}
            hidden
            multiple
            type="file"
            accept={PHOTO_ACCEPT}
            onChange={(event) => addFiles(event.target.files)}
          />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={webTokens.spacing.control}
          >
            <TextField
              label="Descripción de la fotografía"
              slotProps={{ htmlInput: { maxLength: 2000 } }}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={uploading}
              fullWidth
            />
            <TextField
              label="Autor o fuente"
              slotProps={{ htmlInput: { maxLength: 250 } }}
              value={sourceAuthor}
              onChange={(event) => setSourceAuthor(event.target.value)}
              disabled={uploading}
              fullWidth
            />
          </Stack>
          {queue.length > 0 ? (
            <Stack spacing={webTokens.spacing.inline}>
              {uploading || finished > 0 ? (
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {uploading
                      ? `Subiendo y optimizando… ${finished} de ${queue.length}`
                      : `${finished} de ${queue.length} subida(s)`}
                  </Typography>
                  <LinearProgress
                    variant={
                      uploading && finished === 0 ? "indeterminate" : "determinate"
                    }
                    value={progress}
                    aria-label="Progreso de carga"
                    sx={{ borderRadius: 999, height: 6 }}
                  />
                </Stack>
              ) : null}
              {queue.map((item) => (
                <Stack key={item.id} direction="row" spacing={1} alignItems="center">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap>
                      {item.file.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={item.status === "error" ? "error" : "text.secondary"}
                    >
                      {item.status === "error"
                        ? item.error
                        : item.status === "uploading"
                          ? "Subiendo…"
                          : item.status === "done"
                            ? "Subida"
                            : `Lista para subir · ${formatSize(item.file.size)}`}
                    </Typography>
                  </Box>
                  {item.status === "done" ? (
                    <CheckCircleRounded color="success" fontSize="small" />
                  ) : item.status === "error" ? (
                    <ErrorOutlineRounded color="error" fontSize="small" />
                  ) : null}
                </Stack>
              ))}
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={uploading}>
          {finished > 0 && pending.length === 0 ? "Cerrar" : "Cancelar"}
        </Button>
        <Button
          variant="contained"
          onClick={() => void start()}
          disabled={uploading || pending.length === 0}
        >
          {uploading
            ? "Subiendo…"
            : pending.length > 1
              ? `Subir ${pending.length} fotos`
              : "Subir foto"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
