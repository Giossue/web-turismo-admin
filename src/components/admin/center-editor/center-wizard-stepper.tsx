"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import {
  Box,
  Button,
  ButtonBase,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { ReactNode } from "react";

import { FlatSurface } from "@/components/ui/flat-surface";
import { webTokens } from "@/theme/tokens";

type WizardStep = { key: string; title: string };

function stepStatus(completed: boolean, selected: boolean): string {
  if (completed) return "Completada";
  return selected ? "Actual" : "Pendiente";
}

/** Lista numerada de los apartados de la ficha; todos son navegables. */
export function CenterWizardStepper({
  steps,
  activeStep,
  onSelect,
}: {
  steps: readonly WizardStep[];
  activeStep: number;
  onSelect: (step: number) => void;
}) {
  const isSummary = activeStep >= steps.length;
  const currentIndex = Math.min(activeStep, steps.length - 1);
  const progress = isSummary
    ? 100
    : Math.round((activeStep / Math.max(steps.length, 1)) * 100);
  return (
    <FlatSurface padding="compact">
      <Box component="nav" aria-label="Secciones de la ficha turística">
        {/* Móvil: cabecera compacta con progreso y selector, sin la cuadrícula. */}
        <Stack gap={1.25} sx={{ display: { xs: "flex", sm: "none" } }}>
          <Stack
            direction="row"
            alignItems="baseline"
            justifyContent="space-between"
            gap={1}
          >
            <Typography variant="caption" color="text.secondary">
              {isSummary ? "Revisión final" : `Paso ${activeStep + 1} de ${steps.length}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {progress}% completado
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            aria-label="Avance de la ficha"
            sx={{ borderRadius: 999, height: 6 }}
          />
          <TextField
            select
            size="small"
            label="Sección"
            value={String(currentIndex)}
            onChange={(event) => onSelect(Number(event.target.value))}
            slotProps={{ select: { native: true } }}
          >
            {steps.map((step, index) => (
              <option key={step.key} value={index}>
                {index + 1}. {step.title}
              </option>
            ))}
          </TextField>
        </Stack>
        <Box
          component="ol"
          sx={{
            display: { xs: "none", sm: "grid" },
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(4, minmax(0, 1fr))",
              md: "repeat(7, minmax(0, 1fr))",
            },
            gap: { xs: 1, sm: 1.25 },
            listStyle: "none",
            m: 0,
            p: 0,
          }}
        >
          {steps.map((step, index) => {
            const completed = isSummary || index < activeStep;
            const selected = !isSummary && index === activeStep;
            const status = stepStatus(completed, selected);
            return (
              <Box component="li" key={step.key} sx={{ display: "flex", minWidth: 0 }}>
                <ButtonBase
                  type="button"
                  aria-label={`Sección ${index + 1}: ${step.title} (${status.toLocaleLowerCase()})`}
                  aria-current={selected ? "step" : undefined}

                  onClick={() => onSelect(index)}
                  title={step.title}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    justifyContent: "flex-start",
                    width: "100%",
                    minWidth: 0,
                    minHeight: { xs: 64, sm: 78 },
                    p: { xs: 1, sm: 1.25 },
                    border: 1,
                    borderColor: selected ? "primary.main" : "divider",
                    borderRadius: `${webTokens.shape.radius}px`,
                    bgcolor: selected ? "action.selected" : "transparent",
                    textAlign: "left",
                    transition: "border-color 120ms ease, background-color 120ms ease",
                    "&:hover": {
                      borderColor: selected ? "primary.main" : "text.secondary",
                      bgcolor: selected ? "action.selected" : "action.hover",
                    },
                    "&.Mui-disabled": {
                      opacity: 0.55,
                    },
                  }}
                >
                  <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
                    <Box
                      component="span"
                      sx={{
                        display: "grid",
                        placeItems: "center",
                        flex: "0 0 auto",
                        width: { xs: 24, sm: 28 },
                        height: { xs: 24, sm: 28 },
                        borderRadius: "50%",
                        bgcolor:
                          selected || completed
                            ? "primary.main"
                            : "action.disabledBackground",
                        color:
                          selected || completed
                            ? "primary.contrastText"
                            : "text.secondary",
                        fontSize: { xs: "0.72rem", sm: "0.78rem" },
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ minWidth: 0, textOverflow: "ellipsis", overflow: "hidden" }}
                    >
                      {status}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.75,
                      minWidth: 0,
                      fontWeight: selected ? 700 : 500,
                      lineHeight: 1.2,
                      display: "-webkit-box",
                      overflow: "hidden",
                      overflowWrap: "anywhere",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 2,
                    }}
                  >
                    {step.title}
                  </Typography>
                </ButtonBase>
              </Box>
            );
          })}
        </Box>
      </Box>
    </FlatSurface>
  );
}

export function CenterWizardNavigation({
  activeStep,
  lastStep,
  working,
  onPrevious,
  onNext,
  finalAction,
}: {
  activeStep: number;
  lastStep: number;
  working: boolean;
  onPrevious: () => void;
  onNext: () => void;
  /** Acción principal del último paso (guardar o enviar a revisión). */
  finalAction?: ReactNode;
}) {
  return (
    <Stack
      direction={{ xs: "column-reverse", sm: "row" }}
      alignItems={{ sm: "center" }}
      justifyContent="space-between"
      gap={webTokens.spacing.control}
    >
      <Button
        type="button"
        variant="outlined"
        onClick={onPrevious}
        disabled={activeStep === 0 || working}
        startIcon={<ArrowBackRounded />}
      >
        Anterior
      </Button>
      {activeStep < lastStep ? (
        <Button
          type="button"
          variant="contained"
          onClick={onNext}
          disabled={working}
          endIcon={<ArrowForwardRounded />}
        >
          Siguiente
        </Button>
      ) : (
        (finalAction ?? (
          <Typography variant="body2" color="text.secondary">
            Revisión final de la ficha
          </Typography>
        ))
      )}
    </Stack>
  );
}
