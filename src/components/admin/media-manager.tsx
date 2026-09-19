"use client";

import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import PhotoLibraryRounded from "@mui/icons-material/PhotoLibraryRounded";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { FlatSurface } from "@/components/ui/flat-surface";
import { ContentState } from "@/components/ui/content-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  apiUrl,
  deleteAdminCenterMedia,
  getAdminCenterMedia,
  uploadAdminCenterMedia,
  type AdminMediaItem,
} from "@/lib/admin-api";
import { webTokens } from "@/theme/tokens";

export function MediaManager({
  token,
  code,
  canEdit,
  onNotice,
}: {
  token: string;
  code: string | null;
  canEdit: boolean;
  onNotice: (message: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [sourceAuthor, setSourceAuthor] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaQuery = useQuery({
    queryKey: ["admin", "media", code],
    queryFn: () => getAdminCenterMedia(token, code as string),
    enabled: Boolean(token && code),
  });

  async function upload(file: File) {
    if (!code) return;
    setWorking(true);
    setError(null);
    try {
      await uploadAdminCenterMedia(token, code, file, { description, sourceAuthor });
      setDescription("");
      setSourceAuthor("");
      await queryClient.invalidateQueries({ queryKey: ["admin", "media", code] });
      onNotice("Archivo multimedia cargado. Quedará pendiente hasta publicar la ficha.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo cargar el archivo multimedia.",
      );
    } finally {
      setWorking(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function remove(item: AdminMediaItem) {
    if (!code || !window.confirm(`¿Eliminar ${item.originalName}?`)) return;
    setWorking(true);
    setError(null);
    try {
      await deleteAdminCenterMedia(token, code, item.id);
      await queryClient.invalidateQueries({ queryKey: ["admin", "media", code] });
      onNotice("Fotografía eliminada.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo eliminar la fotografía.",
      );
    } finally {
      setWorking(false);
    }
  }

  const items = mediaQuery.data?.items ?? [];
  return (
    <FlatSurface padding="default">
      <Stack spacing={webTokens.spacing.control}>
        <SectionHeader
          icon={<PhotoLibraryRounded color="primary" />}
          title="Fotos y multimedia"
          description="Sube fotografías, videos o audios institucionales. Imágenes hasta 10 MB y multimedia hasta 50 MB."
        />
        {!code ? (
          <Alert severity="info">
            Guarda la ficha antes de cargar archivos multimedia.
          </Alert>
        ) : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={webTokens.spacing.control}
        >
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
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,audio/mpeg,audio/mp4,audio/wav,audio/ogg"
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
        {mediaQuery.isLoading ? (
          <ContentState status="loading" label="Cargando multimedia" />
        ) : null}
        {!mediaQuery.isLoading && items.length === 0 ? (
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
                  src={`${apiUrl}${item.downloadUrl}`}
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
                code={item.state === "PUBLICADO" ? "PUBLICADO" : "PENDIENTE"}
                label={item.state === "PUBLICADO" ? "Publicado" : "Pendiente"}
              />
              {item.downloadUrl && item.typeCode !== "FOTOGRAFIA" ? (
                <Button
                  component="a"
                  href={`${apiUrl}${item.downloadUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  size="small"
                >
                  Abrir
                </Button>
              ) : null}
              <IconButton
                aria-label={`Eliminar ${item.originalName}`}
                onClick={() => void remove(item)}
                disabled={!canEdit || working}
              >
                <DeleteOutlineRounded />
              </IconButton>
            </Stack>
            <Divider sx={{ my: webTokens.spacing.inline }} />
          </Stack>
        ))}
      </Stack>
    </FlatSurface>
  );
}
