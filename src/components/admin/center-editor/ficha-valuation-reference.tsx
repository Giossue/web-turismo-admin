"use client";

import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import type { FichaResumenValoracion } from "@/lib/ficha/tipos";

const CRITERIA_NAMES: Record<string, string> = {
  A: "Acceso y conectividad",
  B: "Servicios turísticos",
  C: "Conservación del lugar y su entorno",
  D: "Higiene y seguridad",
  E: "Políticas y regulaciones",
  F: "Actividades turísticas",
  G: "Difusión y promoción",
  H: "Registro de visitantes",
  I: "Personal y formación",
};

function format(value: number): string {
  return value.toLocaleString("es", { maximumFractionDigits: 2 });
}

/** Referencia del archivo; no asigna una valoración ni jerarquía al registro. */
export function FichaValuationReference({
  summary,
}: {
  summary: FichaResumenValoracion;
}) {
  if (summary.totalInformativo === null) return null;
  const maximum = summary.criterios.reduce(
    (total, item) => total + item.puntajeMaximo,
    0,
  );
  return (
    <Accordion disableGutters elevation={0} variant="outlined">
      <AccordionSummary expandIcon={<ExpandMoreRounded />}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" component="span">
            Evaluación turística del Excel: {format(summary.totalInformativo)}
            {maximum > 0 ? ` de ${format(maximum)}` : ""} puntos
          </Typography>
          <Typography variant="body2" color="text.secondary" component="span">
            Valora las condiciones y servicios del atractivo. Abre el desglose para ver
            cómo se suman los puntos.
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            MINTUR combina estos criterios técnicos para clasificar el desarrollo
            turístico del lugar. Los valores siguientes proceden de «Resultados de la
            evaluación técnica» de tu Excel.
          </Typography>
          <TableContainer>
            <Table size="small" aria-label="Desglose de la evaluación técnica del Excel">
              <TableHead>
                <TableRow>
                  <TableCell>Criterio</TableCell>
                  <TableCell align="right">Puntos del Excel</TableCell>
                  <TableCell align="right">Máximo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.criterios.map((item) => (
                  <TableRow key={item.codigo}>
                    <TableCell component="th" scope="row">
                      {CRITERIA_NAMES[item.codigo] ?? item.nombre}
                    </TableCell>
                    <TableCell align="right">
                      {item.resultado === null ? "Sin dato" : format(item.resultado)}
                    </TableCell>
                    <TableCell align="right">{format(item.puntajeMaximo)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell component="th" scope="row">
                    Total
                  </TableCell>
                  <TableCell align="right">{format(summary.totalInformativo)}</TableCell>
                  <TableCell align="right">{format(maximum)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" color="text.secondary">
            Las hojas ocultas del Excel suman puntos según las casillas marcadas. En
            Promoción, un Sí aporta 2 puntos por el plan, 2 por la inclusión y 3 por el
            paquete. Una respuesta Sin confirmar se conserva como tal y aporta cero
            puntos. Esta referencia muestra el resultado guardado en el archivo; la
            valoración de la ficha se calcula con sus datos guardados.
          </Typography>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
