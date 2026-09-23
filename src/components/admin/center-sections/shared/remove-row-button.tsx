import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import { Box, IconButton, Tooltip } from "@mui/material";

import { useEditable } from "@/components/ui/form/editable-context";

/**
 * Botón para quitar una fila de un bloque repetible. `label` es a la vez el
 * nombre accesible y el texto del tooltip; se deshabilita fuera de edición.
 */
export function RemoveRowButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  const editable = useEditable();
  return (
    <Tooltip title={label}>
      {/* El `span` permite mostrar el tooltip aunque el botón esté deshabilitado. */}
      <Box component="span" sx={{ display: "inline-flex", mt: { md: 1 } }}>
        <IconButton
          type="button"
          aria-label={label}
          disabled={!editable}
          onClick={onClick}
        >
          <DeleteOutlineRounded />
        </IconButton>
      </Box>
    </Tooltip>
  );
}
