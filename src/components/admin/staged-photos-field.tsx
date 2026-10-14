"use client";

import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import PhotoLibraryRounded from "@mui/icons-material/PhotoLibraryRounded";
import UploadFileRounded from "@mui/icons-material/UploadFileRounded";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";

import { FlatSurface } from "@/components/ui/flat-surface";
import { SectionHeader } from "@/components/ui/section-header";
import { PHOTO_ACCEPT } from "@/lib/photo-preparation-policy";
import { photoFileError } from "@/lib/prepare-photo-file";
import { webTokens } from "@/theme/tokens";

/** Fotografías elegidas antes de guardar; se suben cuando el registro existe. */
export type StagedPhotos = {
  files: File[];
  description: string;
  sourceAuthor: string;
};

export const emptyStagedPhotos: StagedPhotos = {
  files: [],
  description: "",
  sourceAuthor: "",
};

const MAX_STAGED_PHOTOS = 10;

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function Thumbnail({ file }: { file: File }) {
  // La URL se crea durante el render y se libera al quitar la foto.
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <Box
      component="img"
      src={url}
      alt={file.name}
      sx={{
        width: 72,
        height: 56,
        objectFit: "cover",
        borderRadius: `${webTokens.shape.radius}px`,
        bgcolor: "action.hover",
      }}
    />
  );
}

/**
 * Selector de fotografías para un registro nuevo. Valida el formato y deja
 * las fotos en espera; quien guarda el registro las sube al terminar.
 */
export function StagedPhotosField({
  value,
  onChange,
  disabled,
}: {
  value: StagedPhotos;
  onChange: (next: StagedPhotos) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [rejected, setRejected] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) addFiles(event.dataTransfer.files);
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const accepted: File[] = [];
    const errors: string[] = [];
    for (const file of Array.from(list)) {
      const error = photoFileError(file);
      if (error) errors.push(`${file.name}: ${error}`);
      else accepted.push(file);
    }
    const files = [...value.files, ...accepted];
    if (files.length > MAX_STAGED_PHOTOS) {
      errors.push(`Puedes adjuntar hasta ${MAX_STAGED_PHOTOS} fotografías a la vez.`);
    }
    setRejected(errors);
    onChange({ ...value, files: files.slice(0, MAX_STAGED_PHOTOS) });
    if (input.current) input.current.value = "";
  }

  return (
    <FlatSurface padding="default">
      <Stack spacing={webTokens.spacing.control}>
        <SectionHeader
          icon={<PhotoLibraryRounded />}
          title="Fotografías del establecimiento"
          description="Opcional. Se suben al guardar. JPEG o PNG; se recortan a 4:3 y se optimizan automáticamente."
        />
        <Box
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          sx={{
            border: "1px dashed",
            borderColor: dragging ? "primary.main" : "divider",
            bgcolor: dragging ? "action.hover" : "transparent",
            borderRadius: `${webTokens.shape.radius}px`,
            p: 2,
            textAlign: "center",
          }}
        >
          <Button
            type="button"
            variant="outlined"
            startIcon={<UploadFileRounded />}
            onClick={() => input.current?.click()}
            disabled={disabled || value.files.length >= MAX_STAGED_PHOTOS}
          >
            Elegir fotografías
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            component="p"
            sx={{ mt: 1 }}
          >
            Selecciona varias a la vez (Ctrl o Shift) o arrástralas aquí. Hasta{" "}
            {MAX_STAGED_PHOTOS}.
          </Typography>
          <input
            ref={input}
            hidden
            multiple
            type="file"
            accept={PHOTO_ACCEPT}
            onChange={(event) => addFiles(event.target.files)}
          />
        </Box>
        {rejected.length > 0 ? (
          <Alert severity="warning" onClose={() => setRejected([])}>
            {rejected.map((message) => (
              <div key={message}>{message}</div>
            ))}
          </Alert>
        ) : null}
        {value.files.map((file, index) => (
          <Stack
            key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
            direction="row"
            spacing={webTokens.spacing.control}
            alignItems="center"
          >
            <Thumbnail file={file} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap>{file.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                Se subirá al guardar · {formatSize(file.size)}
              </Typography>
            </Box>
            <Tooltip title="Quitar">
              <span>
                <IconButton
                  aria-label={`Quitar ${file.name}`}
                  disabled={disabled}
                  onClick={() =>
                    onChange({
                      ...value,
                      files: value.files.filter((_, position) => position !== index),
                    })
                  }
                >
                  <DeleteOutlineRounded />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        ))}
        {value.files.length > 0 ? (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={webTokens.spacing.control}
          >
            <TextField
              label="Descripción de las fotografías"
              slotProps={{ htmlInput: { maxLength: 2000 } }}
              value={value.description}
              onChange={(event) =>
                onChange({ ...value, description: event.target.value })
              }
              disabled={disabled}
              fullWidth
            />
            <TextField
              label="Autor o fuente"
              slotProps={{ htmlInput: { maxLength: 250 } }}
              value={value.sourceAuthor}
              onChange={(event) =>
                onChange({ ...value, sourceAuthor: event.target.value })
              }
              disabled={disabled}
              fullWidth
            />
          </Stack>
        ) : null}
      </Stack>
    </FlatSurface>
  );
}
