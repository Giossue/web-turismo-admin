"use client";

import CloseRounded from "@mui/icons-material/CloseRounded";
import LocationOnRounded from "@mui/icons-material/LocationOnRounded";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import * as maplibregl from "maplibre-gl";
import { useEffect, useState } from "react";

import { readMapCoordinate, type MapCoordinate } from "@/lib/map-coordinates";

const mapStyleUrl =
  process.env.NEXT_PUBLIC_TILESERVER_STYLE_URL ??
  "https://maps.devs-ueb.tech/styles/basic-preview/style.json";
const defaultCenter: [number, number] = [-79.0016, -1.5923];

// El bundler no emite el worker de MapLibre v6; se sirve desde `public/maplibre`
// (ver scripts/copy-maplibre-worker.mjs). Sin él solo se dibuja el fondo.
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

/**
 * Selector de coordenadas sobre un mapa MapLibre. Debe renderizarse de forma
 * condicional (`{open && <CoordinatePickerDialog … />}`): el mapa se crea al
 * montar el contenido del diálogo y se destruye al cerrarlo.
 */
export function CoordinatePickerDialog({
  initialLatitude,
  initialLongitude,
  onClose,
  onConfirm,
}: Readonly<{
  initialLatitude?: string | number | null;
  initialLongitude?: string | number | null;
  onClose: () => void;
  onConfirm: (coordinate: MapCoordinate) => void;
}>) {
  // Color concreto (no una variable CSS): MapLibre lo aplica como atributo SVG.
  const markerColor = useTheme().palette.primary.main;
  // El `Portal` de MUI monta el contenido en un segundo commit: un ref de
  // objeto seguiría en `null` cuando corre el efecto. Con un callback ref en
  // estado, el efecto se ejecuta cuando el contenedor ya existe.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [initialCoordinate] = useState(() =>
    readMapCoordinate(initialLatitude, initialLongitude),
  );
  const [coordinate, setCoordinate] = useState<MapCoordinate | null>(initialCoordinate);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: mapStyleUrl,
      center: initialCoordinate
        ? [initialCoordinate.longitude, initialCoordinate.latitude]
        : defaultCenter,
      zoom: initialCoordinate ? 16 : 13,
      attributionControl: {},
    });
    let marker: maplibregl.Marker | null = null;

    const setMarker = (longitude: number, latitude: number) => {
      marker?.remove();
      marker = new maplibregl.Marker({ color: markerColor })
        .setLngLat([longitude, latitude])
        .addTo(map);
    };

    if (initialCoordinate) {
      setMarker(initialCoordinate.longitude, initialCoordinate.latitude);
    }
    map.on("click", (event) => {
      setMarker(event.lngLat.lng, event.lngLat.lat);
      setCoordinate({ latitude: event.lngLat.lat, longitude: event.lngLat.lng });
    });
    map.on("error", () => {
      setMapError(
        "No se pudo cargar el mapa. Revisa la conexión o el estilo configurado.",
      );
    });
    const resizeFrame = requestAnimationFrame(() => map.resize());

    return () => {
      cancelAnimationFrame(resizeFrame);
      marker?.remove();
      map.remove();
    };
  }, [container, initialCoordinate, markerColor]);

  return (
    <Dialog
      aria-labelledby="coordinate-picker-title"
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      open
    >
      <DialogTitle id="coordinate-picker-title" sx={{ pr: 7 }}>
        Seleccionar ubicación
        <IconButton
          aria-label="Cerrar selector de ubicación"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography color="text.secondary" variant="body2">
            Haz clic en el mapa para marcar el punto exacto. Solo se guardarán la latitud
            y la longitud seleccionadas.
          </Typography>
          <Box
            role="region"
            aria-label="Mapa para seleccionar coordenadas"
            ref={setContainer}
            sx={{
              bgcolor: "background.default",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              height: { xs: 420, md: 560 },
              overflow: "hidden",
              width: "100%",
            }}
          />
          {mapError ? <Alert severity="warning">{mapError}</Alert> : null}
          <Alert icon={<LocationOnRounded />} severity={coordinate ? "success" : "info"}>
            {coordinate
              ? `Latitud ${coordinate.latitude.toFixed(6)} · Longitud ${coordinate.longitude.toFixed(6)}`
              : "Selecciona un punto en el mapa para continuar."}
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          disabled={!coordinate}
          onClick={() => coordinate && onConfirm(coordinate)}
          variant="contained"
        >
          Usar esta ubicación
        </Button>
      </DialogActions>
    </Dialog>
  );
}
