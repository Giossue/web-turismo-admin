export type MapCoordinate = Readonly<{ latitude: number; longitude: number }>;

type CoordinateInput = string | number | null | undefined;

function readCoordinate(value: CoordinateInput, limit: number): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;

  const coordinate = Number(value);
  return Number.isFinite(coordinate) && Math.abs(coordinate) <= limit ? coordinate : null;
}

/** Un punto inicial necesita ambas coordenadas explícitas y dentro de sus rangos. */
export function readMapCoordinate(
  latitude: CoordinateInput,
  longitude: CoordinateInput,
): MapCoordinate | null {
  const parsedLatitude = readCoordinate(latitude, 90);
  const parsedLongitude = readCoordinate(longitude, 180);
  return parsedLatitude !== null && parsedLongitude !== null
    ? { latitude: parsedLatitude, longitude: parsedLongitude }
    : null;
}
