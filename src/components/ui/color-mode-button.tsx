"use client";

import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import { IconButton, Tooltip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

/** Alterna entre tema claro y oscuro; MUI conserva la preferencia en el navegador. */
export function ColorModeButton() {
  const { mode, setMode } = useColorScheme();
  const dark = mode === "dark";
  return (
    <Tooltip title={dark ? "Tema claro" : "Tema oscuro"}>
      <span>
        <IconButton
          onClick={() => setMode(dark ? "light" : "dark")}
          disabled={mode === undefined}
          aria-label={dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        >
          {dark ? <LightModeRounded /> : <DarkModeRounded />}
        </IconButton>
      </span>
    </Tooltip>
  );
}
