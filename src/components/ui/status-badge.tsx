import { Chip } from "@mui/material";

const statusColors = {
  ACTIVA: "success",
  EN_REVISION: "warning",
  BORRADOR: "default",
  APROBADO: "success",
  PUBLICADO: "success",
  PENDIENTE: "warning",
  RECHAZADO: "error",
  INACTIVA: "default",
  INACTIVO: "default",
} as const;

export function StatusBadge({ code, label }: { code: string; label: string }) {
  const color = statusColors[code as keyof typeof statusColors] ?? "default";
  return <Chip label={label} size="small" color={color} />;
}
