"use client";

import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import PhotoLibraryRounded from "@mui/icons-material/PhotoLibraryRounded";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { FlatSurface } from "@/components/ui/flat-surface";
import { ContentState } from "@/components/ui/content-state";
import { SelectField } from "@/components/ui/form/select-field";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  deleteAdminCenterMedia,
  uploadAdminCenterMedia,
  type AdminMediaItem,
} from "@/lib/admin-api";
import { mediaStateLabel, mediaStateTone } from "@/lib/admin-labels";
import { adminKeys, centerMediaQueryOptions } from "@/lib/admin-queries";
import { publicApiUrl } from "@/lib/config";
import { errorMessage } from "@/lib/errors";
import { webTokens } from "@/theme/tokens";

type MediaTypeCode = AdminMediaItem["typeCode"];

const IMAGE_OR_PDF = "image/jpeg,image/png,image/webp,application/pdf";
const PDF_OR_IMAGE = "application/pdf,image/jpeg,image/png,image/webp";

type MediaTypeOption = {
  value: MediaTypeCode;
  label: string;
  /** Tipos MIME aceptados por el selector de archivos. */
  accept: string;
  /** Mensajes al eliminar un archivo de este tipo. */
  removed: string;
  removeError: string;
};

const MEDIA_TYPE_OPTIONS: readonly MediaTypeOption[] = [
  {
    value: "FOTOGRAFIA",
    label: "Fotografía",
    accept: IMAGE_OR_PDF,
    removed: "Fotografía eliminada.",
    removeError: "No se pudo eliminar la fotografía.",
  },
  {
    value: "VIDEO",
    label: "Video",
    accept: "video/mp4,video/webm",
    removed: "Video eliminado.",
    removeError: "No se pudo eliminar el video.",
  },
  {
    value: "AUDIO",
    label: "Audio",
    accept: "audio/mpeg,audio/mp4,audio/wav,audio/ogg",
    removed: "Audio eliminado.",
    removeError: "No se pudo eliminar el audio.",
  },
  {
    value: "MAPA",
    label: "Mapa",
    accept: IMAGE_OR_PDF,
    removed: "Mapa eliminado.",
    removeError: "No se pudo eliminar el mapa.",
  },
  {
    value: "PLAN_CONTINGENCIA",
    label: "Plan de contingencia",
    accept: PDF_OR_IMAGE,
    removed: "Plan de contingencia eliminado.",
    removeError: "No se pudo eliminar el plan de contingencia.",
  },
  {
    value: "OTRO",
    label: "Otro anexo",
    accept: PDF_OR_IMAGE,
    removed: "Anexo eliminado.",
    removeError: "No se pudo eliminar el anexo.",
  },
];

function mediaTypeOption(typeCode: MediaTypeCode): MediaTypeOption {
  return (
    MEDIA_TYPE_OPTIONS.find((option) => option.value === typeCode) ??
    MEDIA_TYPE_OPTIONS[MEDIA_TYPE_OPTIONS.length - 1]
  );
}

export function MediaManager({
  token,
  code,
  canEdit,
  onNotice,
  onError,
}: {
  token: string;
  code: string | null;
  canEdit: boolean;
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [sourceAuthor, setSourceAuthor] = useState("");
  const [typeCode, setTypeCode] = useState<MediaTypeCode>("FOTOGRAFIA");
  const [working, setWorking] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<AdminMediaItem | null>(null);
  const mediaQuery = useQuery(centerMediaQueryOptions(token, code));

  useEffect(() => {
    if (mediaQuery.error) {
      onError(errorMessage(mediaQuery.error, "No se pudo cargar la multimedia."));
    }
  }, [mediaQuery.error, onError]);

  async function upload(file: File) {
    if (!code) return;
    setWorking(true);
    onError(null);
    try {
      await uploadAdminCenterMedia(token, code, file, {
        typeCode,
        description,
        sourceAuthor,
      });
      setDescription("");
      setSourceAuthor("");
      await queryClient.invalidateQueries({ queryKey: adminKeys.media(code) });
      onNotice("Archivo cargado. Quedará pendiente hasta publicar la ficha.");
    } catch (cause) {
      onError(errorMessage(cause, "No se pudo cargar el archivo multimedia."));
    } finally {
      setWorking(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove(item: AdminMediaItem) {
    if (!code) return;
    const messages = mediaTypeOption(item.typeCode);
    setWorking(true);
    onError(null);
    try {
      await deleteAdminCenterMedia(token, code, item.id);
      await queryClient.invalidateQueries({ queryKey: adminKeys.media(code) });
      onNotice(messages.removed);
    } catch (cause) {
      onError(errorMessage(cause, messages.removeError));
    } finally {
      setWorking(false);
      setPendingRemoval(null);
    }
  }

  const items = mediaQuery.data?.items ?? [];
  return (
    <FlatSurface padding="default">
      <Stack spacing={webTokens.spacing.control}>
        <SectionHeader
          icon={<PhotoLibraryRounded />}
          title="Archivos institucionales"
          description="Sube fotografías, multimedia o anexos documentales. Las imágenes tienen límite de 10 MB y el resto de archivos de 50 MB."
        />
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={webTokens.spacing.control}
        >
          <SelectField
            id="media-type"
            label="Tipo de archivo"
            value={typeCode}
            options={MEDIA_TYPE_OPTIONS}
            onChange={(value) => {
              if (value) setTypeCode(value);
            }}
            disabled={!canEdit || !code || working}
          />
          <TextField
            label="Descripción del archivo"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={!canEdit || !code || working}
            fullWidth
          />
          <TextField
            label="Autor o fuente"
            value={sourceAuthor}
            onChange={(event) => setSourceAuthor(event.target.value)}
            disabled={!canEdit || !code || working}
            fullWidth
          />
          <input
            ref={fileInput}
            hidden
            type="file"
            accept={mediaTypeOption(typeCode).accept}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <Button
            type="button"
            variant="outlined"
            startIcon={working ? <CircularProgress size={18} /> : <UploadFileRounded />}
            onClick={() => fileInput.current?.click()}
            disabled={!canEdit || !code || working}
            sx={{ minWidth: 180 }}
          >
            {working ? "Procesando…" : "Seleccionar archivo"}
          </Button>
        </Stack>
        {mediaQuery.error ? (
          <ContentState status="error" message="No se pudo cargar la multimedia." />
        ) : mediaQuery.isLoading ? (
          <ContentState status="loading" label="Cargando multimedia" />
        ) : null}
        {!mediaQuery.isLoading && !mediaQuery.error && items.length === 0 ? (
          <ContentState
            status="empty"
            message="Aún no hay archivos multimedia cargados."
          />
        ) : null}
        {items.map((item) => (
          <Stack key={item.id} spacing={webTokens.spacing.inline}>
            <Stack
              direction="row"
              spacing={webTokens.spacing.control}
              alignItems="center"
            >
              {item.downloadUrl && item.typeCode === "FOTOGRAFIA" ? (
                <Box
                  component="img"
                  src={`${publicApiUrl}${item.downloadUrl}`}
                  alt={item.description ?? item.originalName}
                  sx={{
                    width: 72,
                    height: 56,
                    objectFit: "cover",
                    borderRadius: `${webTokens.shape.radius}px`,
                  }}
                />
              ) : null}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap>{item.originalName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.typeName} · {item.description || "Sin descripción"}
                  {item.sourceAuthor ? ` · ${item.sourceAuthor}` : ""}
                </Typography>
              </Box>
              <StatusBadge
                label={mediaStateLabel(item.state)}
                tone={mediaStateTone(item.state)}
              />
              {item.downloadUrl && item.typeCode !== "FOTOGRAFIA" ? (
                <Button
                  component="a"
                  href={`${publicApiUrl}${item.downloadUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  size="small"
                >
                  Abrir
                </Button>
              ) : null}
              <Tooltip title="Eliminar">
                <span>
                  <IconButton
                    aria-label={`Eliminar ${item.originalName}`}
                    onClick={() => setPendingRemoval(item)}
                    disabled={!canEdit || working}
                  >
                    <DeleteOutlineRounded />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
            <Divider sx={{ my: webTokens.spacing.inline }} />
          </Stack>
        ))}
      </Stack>
      <Dialog
        open={pendingRemoval !== null}
        onClose={() => !working && setPendingRemoval(null)}
        aria-labelledby="media-remove-title"
        aria-describedby="media-remove-description"
      >
        <DialogTitle id="media-remove-title">Eliminar archivo</DialogTitle>
        <DialogContent>
          <DialogContentText id="media-remove-description">
            ¿Eliminar {pendingRemoval?.originalName}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingRemoval(null)} disabled={working}>
            Cancelar
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => pendingRemoval && void remove(pendingRemoval)}
            disabled={working}
          >
            {working ? "Eliminando…" : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </FlatSurface>
  );
}
