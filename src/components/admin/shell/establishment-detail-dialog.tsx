"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import { DetailList, type DetailListItem } from "@/components/ui/detail-list";
import type { AdminEstablishment } from "@/lib/admin-api";
import { establishmentReviewStatusLabel } from "@/lib/admin-labels";
import { formatDate } from "@/lib/format";

function establishmentDetails(detail: AdminEstablishment): DetailListItem[] {
  const categoryValue =
    detail.valorCategoria !== null && detail.valorCategoria !== undefined
      ? ` · valor ${detail.valorCategoria}`
      : "";
  return [
    { label: "Razón social", value: detail.razonSocial ?? "—" },
    { label: "Actividad", value: detail.actividad },
    { label: "Clasificación", value: detail.clasificacion ?? "—" },
    { label: "Categoría", value: detail.categoriaEtiqueta ?? detail.categoria ?? "—" },
    { label: "Semántica", value: `${detail.esquemaCategoria ?? "—"}${categoryValue}` },
    { label: "Localidad", value: `${detail.localityName} · ${detail.localityType}` },
    {
      label: "Cantón / provincia",
      value: `${detail.cantonName} · ${detail.provinceName}`,
    },
    { label: "Registro", value: detail.numeroRegistro ?? "—" },
    { label: "RUC", value: detail.ruc ?? "—" },
    { label: "Dirección", value: detail.direccion ?? "—" },
    { label: "Teléfono", value: detail.telefono ?? "—" },
    { label: "Coordenadas", value: `${detail.latitude}, ${detail.longitude}` },
    { label: "Enviado por", value: detail.requestedBy ?? "—" },
    { label: "Estado", value: establishmentReviewStatusLabel(detail.reviewStatus) },
    { label: "Fecha de envío", value: formatDate(detail.requestedAt) },
    { label: "Fecha de revisión", value: formatDate(detail.reviewedAt) },
    { label: "Observación", value: detail.reviewObservation ?? "—" },
  ];
}

/** Detalle completo de un catastro enviado a revisión (solo lectura). */
export function EstablishmentDetailDialog({
  establishment,
  open,
  onClose,
}: {
  establishment: AdminEstablishment | null;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Detalle completo del catastro</DialogTitle>
      <DialogContent>
        {establishment ? (
          <Stack spacing={1.25} sx={{ pt: 1 }}>
            <Typography variant="h6" component="h3">
              {establishment.nombreComercial}
            </Typography>
            <DetailList items={establishmentDetails(establishment)} spacing={1.25} />
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
