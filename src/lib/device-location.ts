import { readMapCoordinate, type MapCoordinate } from "./map-coordinates";

const maximumDeviceLocationAccuracyMeters = 100;
const locationRequestTimeoutMs = 20_000;
const maximumLocationAgeMs = 10_000;

const approximateLocationMessage =
  "No se obtuvo una ubicación con precisión de 100 m o menos. Selecciona el punto en el mapa.";
const unavailableLocationMessage =
  "No se pudo obtener la ubicación del dispositivo. Activa su ubicación o selecciona el punto en el mapa.";
const timeoutMessage =
  "No se obtuvo una ubicación precisa a tiempo. Vuelve a intentarlo o selecciona el punto en el mapa.";

/** Espera una lectura precisa y reciente; la primera respuesta puede ser aproximada. */
export function requestPreciseDeviceLocation(
  geolocation: Pick<Geolocation, "watchPosition" | "clearWatch">,
  onSuccess: (coordinate: MapCoordinate) => void,
  onError: (message: string) => void,
): () => void {
  const requestedAt = Date.now();
  let finished = false;
  let receivedApproximateLocation = false;
  let watchId: number | undefined;

  const stop = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    if (watchId !== undefined) geolocation.clearWatch(watchId);
  };
  const fail = (message: string) => {
    if (finished) return;
    stop();
    onError(message);
  };
  const failTimeout = () =>
    fail(receivedApproximateLocation ? approximateLocationMessage : timeoutMessage);

  const timer = setTimeout(failTimeout, locationRequestTimeoutMs);
  try {
    watchId = geolocation.watchPosition(
      (position) => {
        if (finished) return;
        const { latitude, longitude, accuracy } = position.coords;
        if (
          !Number.isFinite(accuracy) ||
          accuracy < 0 ||
          accuracy > maximumDeviceLocationAccuracyMeters
        ) {
          receivedApproximateLocation = true;
          return;
        }
        const age = Date.now() - position.timestamp;
        if (
          !Number.isFinite(age) ||
          position.timestamp < requestedAt ||
          age < 0 ||
          age > maximumLocationAgeMs
        )
          return;
        const coordinate = readMapCoordinate(latitude, longitude);
        if (!coordinate) return;
        stop();
        onSuccess(coordinate);
      },
      (error) => {
        if (error.code === 1) {
          fail(
            "No se permitió acceder a la ubicación. Habilita el permiso en el navegador o selecciona el punto en el mapa.",
          );
        } else if (error.code === 3) {
          failTimeout();
        } else {
          fail(unavailableLocationMessage);
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: locationRequestTimeoutMs },
    );
    // También cubre proveedores que llaman al callback antes de devolver el ID.
    if (finished) geolocation.clearWatch(watchId);
  } catch {
    fail(unavailableLocationMessage);
  }
  return stop;
}
