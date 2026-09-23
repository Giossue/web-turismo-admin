import { Stack } from "@mui/material";

import { FlatSurface } from "@/components/ui/flat-surface";
import { SectionHeader } from "@/components/ui/section-header";
import { webTokens } from "@/theme/tokens";

/** Superficie con encabezado de un bloque del formulario principal de la ficha. */
export function CenterFormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <FlatSurface padding="default">
      <Stack spacing={webTokens.spacing.section}>
        <SectionHeader icon={icon} title={title} description={description} />
        {children}
      </Stack>
    </FlatSurface>
  );
}
