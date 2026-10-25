"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRounded from "@mui/icons-material/ArrowForwardRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
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

/**
 * Lista numerada de los apartados de la ficha; todos son navegables. Un paso
 * está «Completado» solo si la ficha guardada tiene información en él (la
 * misma regla que el resumen final), no por haberlo visitado.
 */
export function CenterWizardStepper({
  steps,
  activeStep,
  completedKeys,
  onSelect,
}: {
  steps: readonly WizardStep[];
  activeStep: number;
  completedKeys: ReadonlySet<string>;
  onSelect: (step: number) => void;
}) {
  const currentIndex = Math.min(activeStep, steps.length - 1);
  const completedCount = steps.filter((step) => completedKeys.has(step.key)).length;
  const progress = Math.round((completedCount / Math.max(steps.length, 1)) * 100);
  return (
    <FlatSurface padding="default">
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
              Paso {activeStep + 1} de {steps.length}
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
        {/* Escritorio: cabecera de progreso y lista de apartados sin recuadros. */}
        <Stack gap={2} sx={{ display: { xs: "none", sm: "flex" } }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={2}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Paso {currentIndex + 1} de {steps.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {completedCount} de {steps.length} secciones con información
              </Typography>
            </Box>
            <Stack direction="row" alignItems="center" gap={1.5} sx={{ flexShrink: 0 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                aria-label="Avance de la ficha"
                sx={{ width: { sm: 120, md: 200 }, height: 6, borderRadius: 999 }}
              />
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, minWidth: 40, textAlign: "right" }}
              >
                {progress}%
              </Typography>
            </Stack>
          </Stack>
          <Box
            component="ol"
            sx={{
              display: "grid",
              gridTemplateColumns: {
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(5, minmax(0, 1fr))",
              },
              columnGap: 1,
              rowGap: 0.5,
              listStyle: "none",
              m: 0,
              pt: 1.5,
              px: 0,
              pb: 0,
              borderTop: webTokens.border,
            }}
          >
            {steps.map((step, index) => {
              const completed = completedKeys.has(step.key);
              const selected = index === currentIndex;
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
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 1.25,
                      width: "100%",
                      minWidth: 0,
                      minHeight: 48,
                      px: 1,
                      py: 0.75,
                      borderRadius: 1,
                      textAlign: "left",
                      bgcolor: selected
                        ? "rgba(var(--mui-palette-primary-mainChannel) / 0.08)"
                        : "transparent",
                      transition: "background-color 120ms ease",
                      "&:hover": {
                        bgcolor: selected
                          ? "rgba(var(--mui-palette-primary-mainChannel) / 0.12)"
                          : "action.hover",
                      },
                    }}
                  >
                    <Box
                      component="span"
                      aria-hidden="true"
                      sx={{
                        display: "grid",
                        placeItems: "center",
                        flex: "0 0 auto",
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        border: "1.5px solid",
                        borderColor: selected || completed ? "primary.main" : "divider",
                        bgcolor: completed || selected ? "primary.main" : "transparent",
                        color:
                          completed || selected
                            ? "primary.contrastText"
                            : "text.secondary",
                        boxShadow: selected
                          ? "0 0 0 3px rgba(var(--mui-palette-primary-mainChannel) / 0.18)"
                          : "none",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                      }}
                    >
                      {completed && !selected ? (
                        <CheckRounded sx={{ fontSize: 16 }} />
                      ) : (
                        index + 1
                      )}
                    </Box>
                    <Typography
                      variant="body2"
                      component="span"
                      sx={{
                        minWidth: 0,
                        fontWeight: selected ? 600 : 500,
                        color: selected
                          ? "primary.main"
                          : completed
                            ? "text.primary"
                            : "text.secondary",
                        lineHeight: 1.25,
                        display: "-webkit-box",
                        overflow: "hidden",
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
        </Stack>
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
