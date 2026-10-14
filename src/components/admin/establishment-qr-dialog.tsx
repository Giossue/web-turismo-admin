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
    const name = establishment?.nombreComercial ?? "";
    QRCode.toDataURL(url, { width: QR_SIZE, margin: 2, errorCorrectionLevel: "M" })
      .then((data) => withName(data, name))
      .then((data) => current && setImage(data))
      .catch(() => current && setImage(null));
    return () => {
      current = false;
      setImage(null);
    };
  }, [open, url, establishment?.nombreComercial]);

  const fileName = `qr-establecimiento-${establishment?.id ?? ""}.png`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Código QR</DialogTitle>
      <DialogContent>
        <Stack spacing={2} alignItems="center" sx={{ pt: 1 }}>
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
              width={280}
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

/** Dibuja el nombre del establecimiento bajo el QR para que viaje en la imagen. */
async function withName(qr: string, name: string): Promise<string> {
  const img = new Image();
  img.src = qr;
  await img.decode();
  const font = `600 ${Math.round(QR_SIZE / 16)}px sans-serif`;
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return qr;
  probe.font = font;
  const maxWidth = QR_SIZE - 80;
  const lines: string[] = [];
  let line = "";
  for (const word of name.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && probe.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  const lineHeight = Math.round(QR_SIZE / 14);
  const canvas = document.createElement("canvas");
  canvas.width = QR_SIZE;
  canvas.height = QR_SIZE + lines.length * lineHeight + 40;
  const ctx = canvas.getContext("2d");
  if (!ctx) return qr;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  ctx.fillStyle = "#17231d";
  ctx.font = font;
  ctx.textAlign = "center";
  lines.forEach((text, index) =>
    ctx.fillText(text, QR_SIZE / 2, QR_SIZE + lineHeight * (index + 1)),
  );
  return canvas.toDataURL("image/png");
}

function printQr(image: string, name: string) {
  const win = window.open("", "_blank", "width=480,height=640");
  if (!win) return;
  win.document.title = name;
  const img = document.createElement("img");
  img.src = image;
  img.width = 360;
  img.onload = () => win.print();
  win.document.body.style.cssText =
    "font-family:sans-serif;text-align:center;padding:24px";
  win.document.body.append(img);
}
