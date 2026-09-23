import type { AdminCatalogs, AdminMediaItem } from "@/lib/admin-api";
import type { SugerenciasSecciones } from "@/lib/ficha/sugerencias-secciones";

/**
 * Props comunes de los campos propios de cada apartado. El formulario llega
 * por `FormProvider` y el permiso de edición por `EditableContext`.
 */
export type SectionFieldsProps = {
  catalogs: AdminCatalogs | null;
  mediaItems: readonly AdminMediaItem[];
  /** Sugerencias del importador de fichas; nunca se aplican solas. */
  sugerencias?: SugerenciasSecciones | null;
};
