"use client";

import AccessibleRounded from "@mui/icons-material/AccessibleRounded";
import DirectionsWalkRounded from "@mui/icons-material/DirectionsWalkRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import MiscellaneousServicesRounded from "@mui/icons-material/MiscellaneousServicesRounded";
import { Stack } from "@mui/material";
import { useMemo } from "react";
import { useWatch } from "react-hook-form";

import { RhfNumberField, RhfTextField } from "@/components/ui/form/rhf-text-field";
import { maxLen } from "@/components/ui/form/rules";
import type { AdminCatalogs } from "@/lib/admin-api";
import { CENTER_DESCRIPTION_MAX_LENGTH, type CenterFormValues } from "@/lib/center-form";
import { activityOptionsFor } from "@/lib/center-form-mappers";
import type { CenterSectionCode } from "@/lib/center-sections/definitions";

import { AdmissionPanel } from "./admission-panel";
import { CenterFormSection } from "./center-form-section";
import { IdentificationPanel } from "./identification-panel";
import { LocationPanel } from "./location-panel";
import { OptionGrid } from "./option-grid";

type PanelProps = {
  catalogs: AdminCatalogs | null;
  isNew: boolean;
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
      return <DescriptionPanel />;
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

function DescriptionPanel() {
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
