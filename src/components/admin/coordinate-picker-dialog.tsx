"use client";

import CloseRounded from "@mui/icons-material/CloseRounded";
import MyLocationRounded from "@mui/icons-material/MyLocationRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import * as maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";

import { SearchInputAdornment } from "@/components/ui/search-field";
import { LoadingSpinner } from "@/components/ui/loading-state";
import { requestPreciseDeviceLocation } from "@/lib/device-location";
import { searchPlaces, type PlaceResult } from "@/lib/place-search";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { readMapCoordinate, type MapCoordinate } from "@/lib/map-coordinates";
import { DEFAULT_MAP_STYLE_URL } from "@/lib/security-headers";

const mapStyleUrl = process.env.NEXT_PUBLIC_TILESERVER_STYLE_URL || DEFAULT_MAP_STYLE_URL;
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
  const [placeText, setPlaceText] = useState("");
  const [placeSearch, setPlaceSearch] = useState<{
    query: string;
    places: PlaceResult[];
    error: string | null;
  } | null>(null);
  const placeQuery = useDebouncedValue(placeText.trim(), 400);
  const searchCurrent = placeQuery.length >= 2 && placeSearch?.query === placeQuery;
  const places = searchCurrent ? placeSearch.places : [];
  const placeError = searchCurrent ? placeSearch.error : null;
  const searchingPlaces = placeQuery.length >= 2 && !searchCurrent;
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
    if (placeQuery.length < 2) return;
    const controller = new AbortController();
    searchPlaces(placeQuery, controller.signal)
      .then((results) =>
        setPlaceSearch({ query: placeQuery, places: results, error: null }),
      )
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setPlaceSearch({
          query: placeQuery,
          places: [],
          error:
            cause instanceof Error
              ? cause.message
              : "No se pudo buscar el lugar. Selecciona el punto en el mapa.",
        });
      });
    return () => controller.abort();
  }, [placeQuery]);

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

  function choosePlace(place: PlaceResult | null) {
    if (!place) return;
    cancelLocationRef.current?.();
    cancelLocationRef.current = null;
    setLocating(false);
    setLocationError(null);
    setCoordinate({ latitude: place.latitude, longitude: place.longitude });
    mapRef.current?.jumpTo({ center: [place.longitude, place.latitude], zoom: 16 });
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
              Busca un lugar, marca un punto en el mapa o solicita la ubicación actual del
              dispositivo. Solo se guardarán la latitud y la longitud al confirmar.
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
          <Autocomplete
            fullWidth
            options={places}
            value={null}
            inputValue={placeText}
            loading={searchingPlaces}
            filterOptions={(options) => options}
            getOptionLabel={(option) => option.title}
            getOptionKey={(option) =>
              `${option.title}:${option.latitude}:${option.longitude}`
            }
            onInputChange={(_, value, reason) => {
              if (reason !== "reset") setPlaceText(value);
            }}
            onChange={(_, place) => choosePlace(place)}
            clearText="Limpiar búsqueda"
            loadingText="Buscando lugares…"
            noOptionsText={
              placeText.trim().length < 2
                ? "Escribe al menos dos letras"
                : "No se encontraron lugares"
            }
            renderOption={({ key, ...props }, option) => (
              <li key={key} {...props}>
                <Stack>
                  <Typography variant="body2">{option.title}</Typography>
                  {option.subtitle ? (
                    <Typography variant="caption" color="text.secondary">
                      {option.subtitle}
                    </Typography>
                  ) : null}
                </Stack>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                id={params.id}
                disabled={params.disabled}
                fullWidth={params.fullWidth}
                size={params.size}
                label="Buscar lugar en Ecuador"
                placeholder="Ciudad, calle o referencia"
                slotProps={{
                  inputLabel: params.InputLabelProps,
                  htmlInput: params.inputProps,
                  input: {
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <SearchInputAdornment />
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
          {placeError ? <Alert severity="warning">{placeError}</Alert> : null}
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
