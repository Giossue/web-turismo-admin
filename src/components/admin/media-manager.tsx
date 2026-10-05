"use client";

import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import PhotoLibraryRounded from "@mui/icons-material/PhotoLibraryRounded";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { PhotoUploadDialog } from "@/components/admin/photo-upload-dialog";
import { FlatSurface } from "@/components/ui/flat-surface";
import { ContentState } from "@/components/ui/content-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  deleteAdminCenterMedia,
  deleteAdminEstablishmentMedia,
  uploadAdminCenterMedia,
  uploadAdminEstablishmentMedia,
  type AdminEstablishmentMediaItem,
  type AdminMediaItem,
  type FichaImportPhoto,
} from "@/lib/admin-api";
import { mediaStateLabel, mediaStateTone } from "@/lib/admin-labels";
import {
  adminKeys,
  centerMediaQueryOptions,
  establishmentMediaQueryOptions,
} from "@/lib/admin-queries";
import { publicApiUrl } from "@/lib/config";
import { errorMessage } from "@/lib/errors";
import { webTokens } from "@/theme/tokens";

type MediaTypeCode = AdminMediaItem["typeCode"];

/** Elemento listado: los establecimientos solo admiten fotografías sin tipo. */
type MediaListItem = AdminEstablishmentMediaItem &
  Partial<Pick<AdminMediaItem, "typeCode" | "typeName">>;

/** Dueño de los archivos: la ficha de un centro o un establecimiento del catastro. */
export type MediaTarget =
  { kind: "center"; code: string | null } | { kind: "establishment"; id: number | null };

type MediaTypeOption = {
  value: MediaTypeCode;
  /** Mensajes al eliminar un archivo de este tipo. */
  removed: string;
  removeError: string;
};

const MEDIA_TYPE_OPTIONS: readonly MediaTypeOption[] = [
  {
    value: "FOTOGRAFIA",
    removed: "Fotografía eliminada.",
    removeError: "No se pudo eliminar la fotografía.",
  },
  {
    value: "VIDEO",
    removed: "Video eliminado.",
    removeError: "No se pudo eliminar el video.",
  },
  {
    value: "AUDIO",
    removed: "Audio eliminado.",
    removeError: "No se pudo eliminar el audio.",
  },
  {
    value: "MAPA",
    removed: "Mapa eliminado.",
    removeError: "No se pudo eliminar el mapa.",
  },
  {
    value: "PLAN_CONTINGENCIA",
    removed: "Plan de contingencia eliminado.",
    removeError: "No se pudo eliminar el plan de contingencia.",
  },
  {
    value: "OTRO",
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
  target,
  canEdit,
  pendingImports = [],
  onNotice,
  onError,
}: {
  token: string;
  target: MediaTarget;
  canEdit: boolean;
  /** Fotos importadas de la ficha que se subirán cuando la ficha se guarde. */
  pendingImports?: readonly FichaImportPhoto[];
  onNotice: (message: string) => void;
  onError: (message: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<MediaListItem | null>(null);
  const ownerId = target.kind === "center" ? target.code : target.id;
  const mediaKey =
    target.kind === "center"
      ? adminKeys.media(target.code)
      : adminKeys.establishmentMedia(target.id);
  const centerQuery = useQuery({
    ...centerMediaQueryOptions(token, target.kind === "center" ? target.code : null),
    enabled: token.length > 0 && target.kind === "center",
  });
  const establishmentQuery = useQuery({
    ...establishmentMediaQueryOptions(
      token,
      target.kind === "establishment" ? target.id : null,
    ),
    enabled: token.length > 0 && target.kind === "establishment",
  });
  const mediaQuery: {
    data?: { items: MediaListItem[] };
    error: Error | null;
    isLoading: boolean;
  } = target.kind === "center" ? centerQuery : establishmentQuery;
  useEffect(() => {
    if (mediaQuery.error) {
      onError(errorMessage(mediaQuery.error, "No se pudo cargar la multimedia."));
    }
  }, [mediaQuery.error, onError]);

  async function uploadPhoto(
    file: File,
    metadata: { description: string; sourceAuthor: string },
  ) {
    if (target.kind === "center" && target.code) {
      await uploadAdminCenterMedia(token, target.code, file, {
        typeCode: "FOTOGRAFIA",
        ...metadata,
      });
    } else if (target.kind === "establishment" && target.id) {
      await uploadAdminEstablishmentMedia(token, target.id, file, metadata);
    }
  }

  async function onPhotosUploaded(count: number) {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: mediaKey }),
      queryClient.invalidateQueries({ queryKey: adminKeys.allNavigationSummaries() }),
    ]);
    const label = count === 1 ? "Fotografía cargada." : `${count} fotografías cargadas.`;
    onNotice(
      target.kind === "center"
        ? `${label} Quedará pendiente hasta publicar la ficha.`
        : label,
    );
  }

  async function remove(item: MediaListItem) {
    if (!ownerId) return;
    const messages = mediaTypeOption(item.typeCode ?? "FOTOGRAFIA");
    setWorking(true);
    onError(null);
    try {
      if (target.kind === "center" && target.code) {
        await deleteAdminCenterMedia(token, target.code, item.id);
      } else if (target.kind === "establishment" && target.id) {
        await deleteAdminEstablishmentMedia(token, target.id, item.id);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: mediaKey }),
        queryClient.invalidateQueries({ queryKey: adminKeys.allNavigationSummaries() }),
      ]);
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
          title={
            target.kind === "center"
              ? "Fotografías del centro"
              : "Fotografías del establecimiento"
          }
          description="Sube fotografías JPEG o PNG de hasta 5 MB. Se recortan a 4:3 y se optimizan en WebP automáticamente."
        />
        <Box>
          <Button
            type="button"
            variant="contained"
            startIcon={<UploadFileRounded />}
            onClick={() => setUploadOpen(true)}
            disabled={!canEdit || !ownerId || working}
          >
            Subir fotografías
          </Button>
        </Box>
        <PhotoUploadDialog
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          upload={uploadPhoto}
          onUploaded={(count) => void onPhotosUploaded(count)}
        />
        {mediaQuery.error ? (
          <ContentState status="error" message="No se pudo cargar la multimedia." />
        ) : mediaQuery.isLoading ? (
          <ContentState status="loading" label="Cargando multimedia" />
        ) : null}
        {pendingImports.map((photo) => (
          <Stack
            key={photo.nombre}
            direction="row"
            spacing={webTokens.spacing.control}
            alignItems="center"
          >
            <Box
              component="img"
              src={`data:${photo.mimeType};base64,${photo.contenidoBase64}`}
              alt={photo.nombre}
              sx={{
                width: 72,
                height: 56,
                objectFit: "cover",
                borderRadius: `${webTokens.shape.radius}px`,
              }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap>{photo.nombre}</Typography>
              <Typography variant="caption" color="text.secondary">
                Importada desde la ficha MINTUR
              </Typography>
            </Box>
            <StatusBadge label="Se subirá al guardar" tone="warning" />
          </Stack>
        ))}
        {!mediaQuery.isLoading &&
        !mediaQuery.error &&
        items.length === 0 &&
        pendingImports.length === 0 ? (
          <ContentState status="empty" message="Aún no hay fotografías cargadas." />
        ) : null}
        {items.map((item) => (
          <Stack key={item.id} spacing={webTokens.spacing.inline}>
            <Stack
              direction="row"
              spacing={webTokens.spacing.control}
              alignItems="center"
            >
              {item.downloadUrl && (item.typeCode ?? "FOTOGRAFIA") === "FOTOGRAFIA" ? (
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
                  {item.typeName ? `${item.typeName} · ` : ""}
                  {item.description || "Sin descripción"}
                  {item.sourceAuthor ? ` · ${item.sourceAuthor}` : ""}
                </Typography>
              </Box>
              <StatusBadge
                label={mediaStateLabel(item.state)}
                tone={mediaStateTone(item.state)}
              />
              {item.downloadUrl && (item.typeCode ?? "FOTOGRAFIA") !== "FOTOGRAFIA" ? (
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
