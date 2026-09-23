import {
  RhfCatalogSelect,
  RhfResponseSelect,
  RhfSelect,
} from "@/components/ui/form/rhf-select";
import {
  RhfDateField,
  RhfNumberField,
  RhfTextField,
} from "@/components/ui/form/rhf-text-field";
import type { SectionFormValues } from "@/lib/center-sections/form-types";

/**
 * Campos `Rhf*` tipados con las rutas de `SectionFormValues`: un `name` que no
 * existe en el formulario del apartado no compila. El `control` llega por el
 * `FormProvider` de la tarjeta del apartado.
 */
export const SectionTextField = RhfTextField<SectionFormValues>;
export const SectionNumberField = RhfNumberField<SectionFormValues>;
export const SectionDateField = RhfDateField<SectionFormValues>;
export const SectionSelect = RhfSelect<string, SectionFormValues>;
export const SectionCatalogSelect = RhfCatalogSelect<SectionFormValues>;
export const SectionResponseSelect = RhfResponseSelect<SectionFormValues>;
