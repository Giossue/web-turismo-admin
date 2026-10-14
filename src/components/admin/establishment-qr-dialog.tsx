"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

import { establishmentQrUrl } from "@/lib/config";

const QR_SIZE = 640;

/** Código QR del establecimiento: lleva a su ficha pública en la web y la app. */
export function EstablishmentQrDialog({
  establishment,
  open,
  onClose,
}: {
  establishment: { id: number; nombreComercial: string } | null;
  open: boolean;
  onClose: () => void;
}) {
  const url = establishment ? establishmentQrUrl(establishment.id) : null;
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    if (!open || !url) return;
    QRCode.toDataURL(url, { width: QR_SIZE, margin: 2, errorCorrectionLevel: "M" })
      .then((data) => current && setImage(data))
      .catch(() => current && setImage(null));
    return () => {
      current = false;
      setImage(null);
    };
  }, [open, url]);

  const fileName = `qr-establecimiento-${establishment?.id ?? ""}.png`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Código QR</DialogTitle>
      <DialogContent>
        <Stack spacing={2} alignItems="center" sx={{ pt: 1 }}>
          <Typography variant="subtitle1" align="center">
            {establishment?.nombreComercial}
          </Typography>
          {!url ? (
            <Alert severity="warning">
              Falta configurar la dirección pública del sitio (
              <code>NEXT_PUBLIC_TURISMO_WEB_URL</code>) para generar el QR.
            </Alert>
          ) : image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={`Código QR de ${establishment?.nombreComercial ?? "establecimiento"}`}
              width={260}
              height={260}
            />
          ) : (
            <Typography color="text.secondary">Generando…</Typography>
          )}
          {url ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ wordBreak: "break-all" }}
            >
              {url}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        {image ? (
          <>
            <Button component="a" href={image} download={fileName}>
              Descargar PNG
            </Button>
            <Button
              variant="contained"
              onClick={() => printQr(image, establishment?.nombreComercial ?? "")}
            >
              Imprimir
            </Button>
          </>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

function printQr(image: string, name: string) {
  const win = window.open("", "_blank", "width=480,height=640");
  if (!win) return;
  const title = document.createElement("h2");
  title.textContent = name;
  const img = document.createElement("img");
  img.src = image;
  img.width = 360;
  img.onload = () => win.print();
  win.document.body.style.cssText =
    "font-family:sans-serif;text-align:center;padding:24px";
  win.document.body.append(title, img);
}
