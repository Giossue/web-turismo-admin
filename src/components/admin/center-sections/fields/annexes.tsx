import { Grid, Stack } from "@mui/material";

import type { CatalogSelectOption } from "@/components/ui/catalog-select";
import { required } from "@/components/ui/form/rules";
import { SectionHeader } from "@/components/ui/section-header";
import type { AdminMediaItem } from "@/lib/admin-api";
import {
  emptyAnnexDocument,
  emptyAnnexResponsible,
} from "@/lib/center-sections/form-defaults";
import { ANNEX_VISIBILITY_OPTIONS } from "@/lib/center-sections/options";
import { webTokens } from "@/theme/tokens";

import { FieldGroup } from "../shared/field-group";
import { RepeatableFieldArray } from "../shared/repeatable-field-array";
import {
  SectionCatalogSelect,
  SectionDateField,
  SectionResponseSelect,
  SectionSelect,
  SectionTextField,
} from "../shared/section-fields";
import { OBSERVATION_RULES, textRules } from "../shared/section-rules";
import type { SectionFieldsProps } from "./types";

/** Tipos de archivo multimedia que pueden registrarse como anexo documental. */
const DOCUMENT_MEDIA_TYPES: ReadonlySet<AdminMediaItem["typeCode"]> = new Set([
  "MAPA",
  "PLAN_CONTINGENCIA",
  "OTRO",
]);

function documentFileOptions(
  mediaItems: readonly AdminMediaItem[],
): CatalogSelectOption[] {
  return mediaItems
    .filter((item) => DOCUMENT_MEDIA_TYPES.has(item.typeCode))
    .map((item) => ({
      id: item.id,
      name: `${item.typeName} · ${item.originalName}${
        item.state === "PENDIENTE" ? " (pendiente)" : ""
      }`,
    }));
}

export function AnnexesFields({ catalogs, mediaItems }: SectionFieldsProps) {
  const responsibilityTypes = catalogs?.responsibilityTypes ?? [];
  const fileOptions = documentFileOptions(mediaItems);
  return (
    <Stack spacing={webTokens.spacing.section}>
      <SectionHeader
        level="subsection"
        title="Anexos y responsabilidades"
        description="Los anexos conservan una visibilidad explícita. Los archivos binarios se gestionan en el módulo multimedia; aquí se registra su contexto institucional."
      />

      <RepeatableFieldArray
        name="annexDocuments"
        title="Anexos documentales"
        description="No mezcles documentos restringidos con material que pueda publicarse."
        addLabel="Añadir anexo"
        emptyLabel="No hay anexos registrados."
        createEmpty={emptyAnnexDocument}
        removeLabel="Eliminar anexo"
        renderRow={(index, removeButton) => (
          <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 5 }}>
              <SectionCatalogSelect
                name={`annexDocuments.${index}.fileId`}
                label="Archivo cargado"
                options={fileOptions}
                emptyLabel="Sin seleccionar"
                disabled={fileOptions.length === 0}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <SectionTextField
                name={`annexDocuments.${index}.type`}
                label="Tipo de anexo"
                rules={{ required: required("Indica el tipo"), ...textRules(180) }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <SectionTextField
                name={`annexDocuments.${index}.source`}
                label="Fuente"
                rules={textRules(180)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <SectionTextField
                name={`annexDocuments.${index}.author`}
                label="Autor"
                rules={textRules(180)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <SectionSelect
                name={`annexDocuments.${index}.visibility`}
                label="Visibilidad"
                options={ANNEX_VISIBILITY_OPTIONS}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 1 }}>{removeButton}</Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <SectionTextField
                name={`annexDocuments.${index}.description`}
                label="Descripción"
                rules={textRules(1_000)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <SectionTextField
                name={`annexDocuments.${index}.observation`}
                label="Observación"
                rules={OBSERVATION_RULES}
              />
            </Grid>
          </Grid>
        )}
      />

      <RepeatableFieldArray
        name="annexResponsibles"
        title="Responsables de la ficha"
        description="Estos contactos son administrativos y no se muestran en la ficha pública."
        addLabel="Añadir responsable"
        emptyLabel="No hay responsables registrados."
        createEmpty={emptyAnnexResponsible}
        removeLabel="Eliminar responsable"
        renderRow={(index, removeButton) => (
          <Grid container spacing={webTokens.spacing.control} alignItems="flex-start">
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <SectionCatalogSelect
                name={`annexResponsibles.${index}.typeId`}
                label="Responsabilidad"
                options={responsibilityTypes}
                emptyLabel="Sin seleccionar"
                disabled={responsibilityTypes.length === 0}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 3 }}>
              <SectionTextField
                name={`annexResponsibles.${index}.name`}
                label="Nombre"
                rules={{ required: required("Indica el nombre"), ...textRules(180) }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <SectionTextField
                name={`annexResponsibles.${index}.role`}
                label="Cargo"
                rules={textRules(180)}
              />
            </Grid>
            {/* Ocupa la fila completa en `sm` para que teléfono y correo queden juntos. */}
            <Grid size={{ xs: 12, md: 3 }}>
              <SectionTextField
                name={`annexResponsibles.${index}.institution`}
                label="Institución"
                rules={textRules(180)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 5, md: 2 }}>
              <SectionTextField
                name={`annexResponsibles.${index}.phone`}
                label="Teléfono"
                rules={textRules(180)}
              />
            </Grid>
            <Grid size={{ xs: 10, sm: 6, md: 1.5 }}>
              <SectionTextField
                name={`annexResponsibles.${index}.email`}
                label="Correo"
                type="email"
                rules={textRules(254)}
              />
            </Grid>
            <Grid size={{ xs: 2, sm: 1, md: 0.5 }}>{removeButton}</Grid>
            <Grid size={12}>
              <SectionTextField
                name={`annexResponsibles.${index}.observation`}
                label="Observación"
                rules={OBSERVATION_RULES}
              />
            </Grid>
          </Grid>
        )}
      />

      <FieldGroup title="Levantamiento de accesibilidad">
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionDateField name="accessibilitySurvey.date" label="Fecha" />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionTextField
            name="accessibilitySurvey.responsible"
            label="Responsable del levantamiento"
            rules={textRules(250)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionTextField
            name="accessibilitySurvey.scope"
            label="Ámbito"
            rules={textRules(250)}
          />
        </Grid>
        <Grid size={12}>
          <SectionTextField
            name="accessibilitySurvey.observation"
            label="Observación"
            rules={OBSERVATION_RULES}
          />
        </Grid>
      </FieldGroup>

      <FieldGroup
        title="Validación del GAD"
        description="Esta validación es institucional y permanece administrativa hasta una publicación aprobada."
      >
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionResponseSelect
            name="gadValidation.acceptance"
            label="¿Acepta publicación?"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionTextField
            name="gadValidation.name"
            label="Nombre del validador"
            rules={textRules(180)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionTextField
            name="gadValidation.institution"
            label="Institución"
            rules={textRules(180)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionTextField
            name="gadValidation.position"
            label="Cargo"
            rules={textRules(180)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionTextField
            name="gadValidation.phone"
            label="Teléfono"
            rules={textRules(180)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionTextField
            name="gadValidation.email"
            label="Correo"
            type="email"
            rules={textRules(254)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SectionDateField name="gadValidation.date" label="Fecha" />
        </Grid>
        <Grid size={{ xs: 12, sm: 8 }}>
          <SectionTextField
            name="gadValidation.observation"
            label="Observación"
            rules={OBSERVATION_RULES}
          />
        </Grid>
      </FieldGroup>
    </Stack>
  );
}
