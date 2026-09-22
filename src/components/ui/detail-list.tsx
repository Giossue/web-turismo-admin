import { Box, Typography } from "@mui/material";

export type DetailListItem = { label: string; value: React.ReactNode };

/**
 * Lista de pares "Etiqueta: valor" como `<dl>`. Cada par ocupa una línea y
 * el valor fluye a continuación de la etiqueta.
 */
export function DetailList({
  items,
  spacing = 1,
}: {
  items: readonly DetailListItem[];
  /** Separación vertical entre pares (unidades de espaciado de MUI). */
  spacing?: number;
}) {
  return (
    <Box component="dl" sx={{ m: 0, display: "grid", gap: spacing }}>
      {items.map((item) => (
        <div key={item.label}>
          <Typography component="dt" fontWeight={700} sx={{ display: "inline" }}>
            {item.label}:
          </Typography>{" "}
          <Typography component="dd" sx={{ display: "inline", m: 0 }}>
            {item.value}
          </Typography>
        </div>
      ))}
    </Box>
  );
}
