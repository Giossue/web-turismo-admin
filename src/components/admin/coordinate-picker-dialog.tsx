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
} from "@mui/material";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

const mapStyleUrl =
  process.env.NEXT_PUBLIC_TILESERVER_STYLE_URL ??
  "https://maps.devs-ueb.tech/styles/basic-preview/style.json";
const defaultCenter: [number, number] = [-79.0016, -1.5923];

type Coordinate = Readonly<{ latitude: number; longitude: number }>;

function parseCoordinate(value: string | number | null | undefined): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function CoordinatePickerDialog({
  initialLatitude,
  initialLongitude,
  onClose,
  onConfirm,
  open,
}: Readonly<{
  initialLatitude?: string | number | null;
  initialLongitude?: string | number | null;
  onClose: () => void;
  onConfirm: (coordinate: Coordinate) => void;
  open: boolean;
}>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [coordinate, setCoordinate] = useState<Coordinate | null>(() => {
    const latitude = parseCoordinate(initialLatitude);
    const longitude = parseCoordinate(initialLongitude);
    return latitude !== null && longitude !== null
      ? { latitude, longitude }
      : null;
  });
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !containerRef.current) return;

    const latitude = parseCoordinate(initialLatitude);
    const longitude = parseCoordinate(initialLongitude);
    const initialCenter: [number, number] =
      latitude !== null && longitude !== null ? [longitude, latitude] : defaultCenter;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyleUrl,
      center: initialCenter,
      zoom: latitude !== null && longitude !== null ? 16 : 13,
      attributionControl: {},
    });
    mapRef.current = map;

    const setMarker = (longitudeValue: number, latitudeValue: number) => {
      markerRef.current?.remove();
      markerRef.current = new maplibregl.Marker({ color: "#22c55e" })
        .setLngLat([longitudeValue, latitudeValue])
        .addTo(map);
      setCoordinate({ latitude: latitudeValue, longitude: longitudeValue });
    };

    if (latitude !== null && longitude !== null) {
      setMarker(longitude, latitude);
    }
    map.on("click", (event) => {
      setMarker(event.lngLat.lng, event.lngLat.lat);
    });
    map.on("error", () => {
      setMapError(
        "No se pudo cargar el mapa. Revisa la conexión o el estilo configurado.",
      );
    });
    requestAnimationFrame(() => map.resize());

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [initialLatitude, initialLongitude, open]);

  return (
    <Dialog
      aria-labelledby="coordinate-picker-title"
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      open={open}
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
            aria-label="Mapa para seleccionar coordenadas"
            ref={containerRef}
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
