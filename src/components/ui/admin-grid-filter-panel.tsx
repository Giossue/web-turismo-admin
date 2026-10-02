"use client";

import type { ReactNode } from "react";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { useGridApiContext } from "@mui/x-data-grid";

export function AdminGridFilterPanel({
  children,
  activeCount,
  onClear,
  width = 480,
}: {
  children: ReactNode;
  activeCount: number;
  onClear: () => void;
  width?: number;
}) {
  const apiRef = useGridApiContext();
  const close = () => apiRef.current.hideFilterPanel();

  return (
    <Stack
      sx={{
        width,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "min(640px, calc(100dvh - 32px))",
        p: 2,
        boxSizing: "border-box",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography component="h2" variant="subtitle1" fontWeight={600}>
          Filtros
        </Typography>
        <IconButton aria-label="Cerrar filtros" size="small" onClick={close}>
          <CloseRounded fontSize="small" />
        </IconButton>
      </Stack>
      <Box sx={{ overflowY: "auto", minHeight: 0, py: 2, px: 0.5 }}>{children}</Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        gap={1}
        sx={{ borderTop: 1, borderColor: "divider", pt: 2, flexShrink: 0 }}
      >
        <Button onClick={onClear} disabled={activeCount === 0} size="small">
          Limpiar filtros
        </Button>
        <Button variant="contained" onClick={close} size="small">
          Ver resultados
        </Button>
      </Stack>
    </Stack>
  );
}
