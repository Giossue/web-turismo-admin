import { Stack, Typography } from "@mui/material";

import { DetailList, type DetailListItem } from "@/components/ui/detail-list";
import type { EstablishmentMinturData, MinturRegistryStatus } from "@/lib/admin-api";
import { formatDate } from "@/lib/format";

const STATUS_LABELS: Record<MinturRegistryStatus, string> = {
  RATIFICADO: "Ratificado",
  PENDIENTE_INSPECCION: "Pendiente de inspección",
  SUSPENSION_TEMPORAL: "Suspensión temporal",
  SUSPENSION_DEFINITIVA: "Suspensión definitiva",
  INACTIVO: "Inactivo",
};

export function minturStatusLabel(status: MinturRegistryStatus | null | undefined) {
  return status ? STATUS_LABELS[status] : "—";
}

function minturDetails(data: EstablishmentMinturData): DetailListItem[] {
  const items: Array<[string, string | number | null]> = [
    ["Estado en el MINTUR", minturStatusLabel(data.estadoRegistro)],
    // Fecha sin hora: a mediodía para que la zona horaria no cambie el día.
    [
      "Fecha de registro",
      data.fechaRegistro ? formatDate(`${data.fechaRegistro}T12:00:00`) : null,
    ],
    ["Código de establecimiento RUC", data.codigoEstablecimientoRuc],
    ["Referencia de dirección", data.referenciaDireccion],
    ["Teléfono secundario", data.telefonoSecundario],
    ["Correo", data.correo],
    ["Sitio web", data.sitioWeb],
    ["Trabajadores", data.totalTrabajadores],
    ["Habitaciones o tiendas", data.totalHabitaciones],
    ["Camas", data.totalCamas],
    ["Plazas", data.totalPlazas],
    ["Mesas", data.totalMesas],
    ["Capacidad (personas)", data.capacidadPersonas],
  ];
  // Las capacidades en cero no aplican a la actividad del establecimiento.
  return items
    .filter(([, value]) => value !== null && value !== "" && value !== 0)
    .map(([label, value]) => ({ label, value }));
}

/** Datos del catastro nacional MINTUR, de solo lectura. */
export function MinturRegistryDetails({ data }: { data: EstablishmentMinturData }) {
  if (!data.importadoAt) return null;
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" component="h3" fontWeight={700}>
        Datos del catastro MINTUR
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Importados el {formatDate(data.importadoAt)}. Se actualizan al importar de nuevo
        el consolidado.
      </Typography>
      <DetailList items={minturDetails(data)} />
    </Stack>
  );
}
