"use client";

import CloseRounded from "@mui/icons-material/CloseRounded";
import MyLocationRounded from "@mui/icons-material/MyLocationRounded";
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
import { useEffect, useRef, useState } from "react";

import { LoadingSpinner } from "@/components/ui/loading-state";
import { requestPreciseDeviceLocation } from "@/lib/device-location";
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
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const cancelLocationRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stopRequest = () => {
      cancelLocationRef.current?.();
      cancelLocationRef.current = null;
    };
    const stopWhenHidden = () => {
      if (!document.hidden) return;
      stopRequest();
      setLocating(false);
    };
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", stopWhenHidden);
      stopRequest();
    };
  }, []);

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
    mapRef.current = map;
    map.on("click", (event) => {
      cancelLocationRef.current?.();
      cancelLocationRef.current = null;
      setLocating(false);
      setLocationError(null);
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
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [container, initialCoordinate]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !coordinate) return;
    const marker = new maplibregl.Marker({ color: markerColor })
      .setLngLat([coordinate.longitude, coordinate.latitude])
      .addTo(map);
    markerRef.current = marker;
    return () => {
      marker.remove();
      if (markerRef.current === marker) markerRef.current = null;
    };
  }, [container, coordinate, markerColor]);

  function close() {
    cancelLocationRef.current?.();
    cancelLocationRef.current = null;
    onClose();
  }

  function locateDevice() {
    if (cancelLocationRef.current) return;
    setLocationError(null);
    if (!window.isSecureContext) {
      setLocationError(
        "Abre el panel con una conexión HTTPS para solicitar la ubicación del dispositivo.",
      );
      return;
    }
    if (!navigator.geolocation) {
      setLocationError(
        "Este navegador no permite solicitar la ubicación. Selecciona el punto en el mapa.",
      );
      return;
    }
    setLocating(true);
    let completed = false;
    const cancel = requestPreciseDeviceLocation(
      navigator.geolocation,
      (nextCoordinate) => {
        completed = true;
        cancelLocationRef.current = null;
        setLocating(false);
        setCoordinate(nextCoordinate);
        mapRef.current?.jumpTo({
          center: [nextCoordinate.longitude, nextCoordinate.latitude],
          zoom: 16,
        });
      },
      (message) => {
        completed = true;
        cancelLocationRef.current = null;
        setLocating(false);
        setLocationError(message);
      },
    );
    if (!completed) cancelLocationRef.current = cancel;
  }

  return (
    <Dialog
      aria-labelledby="coordinate-picker-title"
      fullWidth
      maxWidth="lg"
      onClose={close}
      open
    >
      <DialogTitle id="coordinate-picker-title" sx={{ pr: 7 }}>
        Seleccionar ubicación
        <IconButton
          aria-label="Cerrar selector de ubicación"
          onClick={close}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            gap={2}
          >
            <Typography color="text.secondary" variant="body2" sx={{ flex: 1 }}>
              Marca un punto en el mapa o solicita la ubicación actual del dispositivo.
              Solo se guardarán la latitud y la longitud al confirmar.
            </Typography>
            <Button
              type="button"
              variant="outlined"
              onClick={locateDevice}
              disabled={locating || !container}
              aria-busy={locating}
              startIcon={
                locating ? (
                  <LoadingSpinner label="Buscando ubicación" size={18} color="inherit" />
                ) : (
                  <MyLocationRounded />
                )
              }
              sx={{ flexShrink: 0 }}
            >
              {locating ? "Buscando ubicación…" : "Ubicación del dispositivo"}
            </Button>
          </Stack>
          {locationError ? <Alert severity="warning">{locationError}</Alert> : null}
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
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancelar</Button>
        <Button
          disabled={!coordinate || locating}
          onClick={() => coordinate && onConfirm(coordinate)}
          variant="contained"
        >
          Usar esta ubicación
        </Button>
      </DialogActions>
    </Dialog>
  );
}
