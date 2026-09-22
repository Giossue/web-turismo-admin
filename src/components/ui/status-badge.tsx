import { Chip } from "@mui/material";

import type { StatusTone } from "@/lib/admin-labels";

/**
 * Etiqueta de estado. El tono se obtiene con las funciones por dominio de
 * `@/lib/admin-labels` (por ejemplo `opinionStatusTone`).
 */
export function StatusBadge({
  label,
  tone = "default",
}: {
  label: string;
  tone?: StatusTone;
}) {
  return <Chip label={label} size="small" color={tone} />;
}
