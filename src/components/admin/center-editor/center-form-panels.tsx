"use client";

import AccessibleRounded from "@mui/icons-material/AccessibleRounded";
import DirectionsWalkRounded from "@mui/icons-material/DirectionsWalkRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import MiscellaneousServicesRounded from "@mui/icons-material/MiscellaneousServicesRounded";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { useEditable } from "@/components/ui/form/editable-context";
import { RhfNumberField, RhfTextField } from "@/components/ui/form/rhf-text-field";
import { maxLen } from "@/components/ui/form/rules";
import {
  assistCenterDescription,
  type AdminCatalogs,
  type EditorialAssistance,
} from "@/lib/admin-api";
import { CENTER_DESCRIPTION_MAX_LENGTH, type CenterFormValues } from "@/lib/center-form";
import { activityOptionsFor } from "@/lib/center-form-mappers";
import type { CenterSectionCode } from "@/lib/center-sections/definitions";
import { errorMessage } from "@/lib/errors";

import { AdmissionPanel } from "./admission-panel";
import { CenterFormSection } from "./center-form-section";
import { IdentificationPanel } from "./identification-panel";
import { LocationPanel } from "./location-panel";
import { OptionGrid } from "./option-grid";

type PanelProps = {
  catalogs: AdminCatalogs | null;
  isNew: boolean;
  code: string | null;
  token: string;
  onCoordinatesPicked: () => void;
};

/**
 * Bloque del formulario principal que corresponde al paso activo. Los pasos
 * sin campos del formulario principal (solo contenido de sección) no
 * renderizan nada aquí.
 */
export function CenterFormPanel({
  sectionCode,
  catalogs,
  isNew,
  code,
  token,
  onCoordinatesPicked,
}: PanelProps & { sectionCode: CenterSectionCode }) {
  switch (sectionCode) {
    case "identificacion":
      return (
        <IdentificationPanel
          catalogs={catalogs}
          showCoordinates={isNew}
          onCoordinatesPicked={onCoordinatesPicked}
        />
      );
    case "ubicacion-admin":
      return <LocationPanel onCoordinatesPicked={onCoordinatesPicked} />;
    case "caracteristicas":
      return <AdmissionPanel catalogs={catalogs} />;
    case "descripcion":
      return <DescriptionPanel code={code} token={token} />;
    case "actividades":
      return <ActivitiesPanel catalogs={catalogs} />;
    case "accesibilidad":
      return (
        <CenterFormSection
          icon={<AccessibleRounded />}
          title="Accesibilidad"
          description="Registra las condiciones verificadas para orientar a turistas."
        >
          <OptionGrid
            name="accessibilityIds"
            options={catalogs?.accessibilityTypes ?? []}
          />
        </CenterFormSection>
      );
    case "planta":
      return <FacilitiesPanel catalogs={catalogs} />;
    default:
      return null;
  }
}

const DESCRIPTION_RULES = { maxLength: maxLen(CENTER_DESCRIPTION_MAX_LENGTH) };

function DescriptionPanel({ code, token }: { code: string | null; token: string }) {
  const editable = useEditable();
  const { control, getValues, setValue } = useFormContext<CenterFormValues>();
  const description = useWatch({ control, name: "description" }) ?? "";
  const [proposal, setProposal] = useState<{
    source: string;
    mode: "rewrite" | "review";
    result: EditorialAssistance;
  } | null>(null);
  const assistance = useMutation({
    mutationFn: ({ source, mode }: { source: string; mode: "rewrite" | "review" }) =>
      assistCenterDescription(token, code as string, { description: source, mode }),
    onSuccess: (result, variables) =>
      setProposal({ source: variables.source, mode: variables.mode, result }),
  });
  const canAsk = editable && Boolean(code) && description.trim().length >= 20;
  const sourceChanged = proposal !== null && getValues("description") !== proposal.source;

  return (
    <CenterFormSection
      icon={<FactCheckRounded />}
      title="Descripción del atractivo"
      description="Redacta la descripción pública de la ficha, con un máximo de 500 caracteres."
    >
      <RhfTextField<CenterFormValues>
        name="description"
        label="Descripción"
        multiline
        minRows={6}
        rules={DESCRIPTION_RULES}
      />
      {editable ? (
        <Stack spacing={1}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              variant="outlined"
              disabled={!canAsk || assistance.isPending}
              onClick={() => assistance.mutate({ source: description, mode: "rewrite" })}
            >
              Mejorar redacción
            </Button>
            <Button
              variant="outlined"
              disabled={!canAsk || assistance.isPending}
              onClick={() => assistance.mutate({ source: description, mode: "review" })}
            >
              Revisar descripción
            </Button>
          </Stack>
          {!code ? (
            <Typography variant="body2" color="text.secondary">
              Guarda la ficha para usar la ayuda de redacción.
            </Typography>
          ) : description.trim().length < 20 ? (
            <Typography variant="body2" color="text.secondary">
              Escribe al menos 20 caracteres para solicitar una propuesta.
            </Typography>
          ) : null}
          {assistance.isPending ? (
            <CircularProgress size={22} aria-label="Generando propuesta" />
          ) : null}
          {assistance.isError ? (
            <Alert severity="error">
              {errorMessage(
                assistance.error,
                "No se pudo consultar la ayuda de redacción.",
              )}
            </Alert>
          ) : null}
        </Stack>
      ) : null}
      <Dialog
        open={proposal !== null}
        onClose={() => setProposal(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {proposal?.mode === "review"
            ? "Revisión de la descripción"
            : "Propuesta de redacción"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Revisa la propuesta antes de aplicarla. La IA no aprueba ni publica la
              ficha.
            </Typography>
            {proposal?.result.suggestion ? (
              <Typography sx={{ whiteSpace: "pre-wrap" }}>
                {proposal.result.suggestion}
              </Typography>
            ) : null}
            {proposal?.result.observations.map((observation, index) => (
              <Alert key={`${index}-${observation}`} severity="info">
                {observation}
              </Alert>
            ))}
            {proposal &&
            !proposal.result.suggestion &&
            proposal.result.observations.length === 0 ? (
              <Typography>No se encontraron observaciones.</Typography>
            ) : null}
            {sourceChanged ? (
              <Alert severity="warning">
                La descripción cambió desde que pediste la propuesta. Solicita otra para
                evitar sobrescribirla.
              </Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProposal(null)}>Cerrar</Button>
          {proposal?.result.suggestion ? (
            <Button
              variant="contained"
              disabled={sourceChanged || !editable}
              onClick={() => {
                if (!proposal || getValues("description") !== proposal.source) return;
                setValue("description", proposal.result.suggestion ?? "", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
                setProposal(null);
              }}
            >
              Aplicar en formulario
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </CenterFormSection>
  );
}

function ActivitiesPanel({ catalogs }: { catalogs: AdminCatalogs | null }) {
  const categoryId = useWatch<CenterFormValues, "categoryId">({ name: "categoryId" });
  const options = useMemo(
    () => activityOptionsFor(catalogs, categoryId),
    [catalogs, categoryId],
  );
  return (
    <CenterFormSection
      icon={<DirectionsWalkRounded />}
      title="Actividades"
      description="Selecciona únicamente las actividades que se practican en el atractivo."
    >
      <OptionGrid name="activityIds" options={options} disabled={!categoryId} />
    </CenterFormSection>
  );
}

function FacilitiesPanel({ catalogs }: { catalogs: AdminCatalogs | null }) {
  return (
    <CenterFormSection
      icon={<MiscellaneousServicesRounded />}
      title="Facilidades"
      description="Indica los servicios y elementos disponibles en el entorno."
    >
      <OptionGrid
        name="facilityIds"
        options={catalogs?.facilities ?? []}
        renderSelected={(option) => (
          <Stack spacing={1} sx={{ pl: 4, pr: 1, pb: 1 }}>
            <RhfNumberField<CenterFormValues>
              name={`facilityQuantities.${option.id}`}
              label="Cantidad"
              size="small"
              integer
              min={0}
            />
            <RhfTextField<CenterFormValues>
              name={`facilityObservations.${option.id}`}
              label="Observación de la facilidad"
              size="small"
            />
          </Stack>
        )}
      />
    </CenterFormSection>
  );
}
