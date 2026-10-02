"use client";

import { alpha, createTheme } from "@mui/material/styles";

import { gray } from "@/theme/primitives";
import { webTokens } from "@/theme/tokens";

function paletteFor(mode: "light" | "dark") {
  const { status, ...palette } = webTokens.colors[mode];
  return { ...palette, ...status };
}

// Tema compartido adaptado de Dashboard y Sign-in de Material UI v7.
// Atribución y licencia: docs/third-party-notices/mui-templates.md.
const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data" },
  colorSchemes: {
    light: { palette: paletteFor("light") },
    dark: { palette: paletteFor("dark") },
  },
  typography: {
    fontFamily: "var(--font-inter), Inter, system-ui, Arial, sans-serif",
    h1: { fontSize: "3rem", fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.03em" },
    h2: { fontSize: "2.25rem", fontWeight: 600, lineHeight: 1.2 },
    h3: { fontSize: "1.875rem", fontWeight: 600, lineHeight: 1.2 },
    h4: { fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.5 },
    h5: { fontSize: "1.25rem", fontWeight: 600 },
    h6: { fontSize: "1.125rem", fontWeight: 600 },
    subtitle1: { fontSize: "1rem", fontWeight: 500 },
    subtitle2: { fontSize: "0.875rem", fontWeight: 500 },
    body1: { fontSize: "0.875rem" },
    body2: { fontSize: "0.875rem" },
    caption: { fontSize: "0.75rem" },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: { borderRadius: webTokens.shape.radius },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&.Mui-focusVisible": {
            outline: `3px solid ${alpha(theme.palette.primary.main, 0.5)}`,
            outlineOffset: 2,
          },
        }),
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: webTokens.border,
          borderRadius: webTokens.shape.radius,
        },
      },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          border: webTokens.border,
          borderRadius: webTokens.shape.radius,
          backgroundColor: "var(--mui-palette-background-paper)",
          boxShadow: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: webTokens.shape.radius,
          minHeight: 40,
          padding: "8px 16px",
          boxShadow: "none",
          variants: [
            {
              props: { size: "small" },
              style: { minHeight: 36, padding: "6px 12px" },
            },
            {
              props: { size: "large" },
              style: { minHeight: 48 },
            },
            {
              props: { variant: "contained", color: "primary" },
              style: {
                color: "#ffffff",
                backgroundColor: gray[900],
                backgroundImage: `linear-gradient(to bottom, ${gray[700]}, ${gray[800]})`,
                border: `1px solid ${gray[700]}`,
                boxShadow: `inset 0 1px 0 ${gray[600]}, inset 0 -1px 0 1px ${gray[900]}`,
                "&:hover": {
                  backgroundColor: gray[700],
                  backgroundImage: "none",
                  boxShadow: "none",
                },
                "&.Mui-disabled": {
                  color: "var(--mui-palette-action-disabled)",
                  backgroundColor: "var(--mui-palette-action-disabledBackground)",
                  backgroundImage: "none",
                  borderColor: "transparent",
                  boxShadow: "none",
                },
                ...theme.applyStyles("dark", {
                  color: gray[900],
                  backgroundColor: gray[50],
                  backgroundImage: `linear-gradient(to bottom, ${gray[100]}, ${gray[50]})`,
                  borderColor: gray[50],
                  boxShadow: `inset 0 -1px 0 ${gray[300]}`,
                  "&:hover": {
                    backgroundColor: gray[300],
                    backgroundImage: "none",
                    boxShadow: "none",
                  },
                  "&.Mui-disabled": {
                    color: "var(--mui-palette-action-disabled)",
                    backgroundColor: "var(--mui-palette-action-disabledBackground)",
                    backgroundImage: "none",
                    borderColor: "transparent",
                    boxShadow: "none",
                  },
                }),
              },
            },
          ],
        }),
        outlined: {
          borderColor: "var(--mui-palette-divider)",
          color: "var(--mui-palette-text-primary)",
          backgroundColor: "var(--mui-palette-background-paper)",
          "&:hover": {
            borderColor: "var(--mui-palette-text-secondary)",
            backgroundColor: "var(--mui-palette-action-hover)",
          },
          "&.Mui-disabled": {
            borderColor: "var(--mui-palette-action-disabledBackground)",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          border: webTokens.border,
          borderRadius: webTokens.shape.radius,
          color: "var(--mui-palette-text-primary)",
          backgroundColor: "var(--mui-palette-background-paper)",
          "&:hover": { backgroundColor: "var(--mui-palette-action-hover)" },
          "&.Mui-disabled": {
            color: "var(--mui-palette-action-disabled)",
            backgroundColor: "var(--mui-palette-action-disabledBackground)",
          },
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          border: 0,
          borderBottom: webTokens.border,
          borderRadius: webTokens.shape.navigation,
          boxShadow: "none",
          backgroundImage: "none",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          border: 0,
          borderRight: webTokens.border,
          borderRadius: webTokens.shape.navigation,
          boxShadow: "none",
          backgroundImage: "none",
        },
      },
    },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiSelect: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: webTokens.shape.radius,
          backgroundColor: "var(--mui-palette-background-paper)",
          ...(!ownerState.multiline && {
            minHeight: ownerState.size === "small" ? 40 : webTokens.form.controlHeight,
          }),
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--mui-palette-divider)",
          },
          "&:hover:not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--mui-palette-text-secondary)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--mui-palette-primary-main)",
            borderWidth: 2,
          },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--mui-palette-error-main)",
          },
          "&.Mui-disabled": {
            backgroundColor: "var(--mui-palette-action-disabledBackground)",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--mui-palette-action-disabledBackground)",
            },
          },
        }),
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          borderRadius: webTokens.shape.radius,
          ...(!ownerState.multiline && {
            minHeight: ownerState.size === "small" ? 40 : webTokens.form.controlHeight,
          }),
          backgroundColor: "var(--mui-palette-action-hover)",
          border: webTokens.border,
          "&:before, &:after": { display: "none" },
          "&:hover": { backgroundColor: "var(--mui-palette-action-selected)" },
          "&.Mui-focused": { borderColor: "var(--mui-palette-primary-main)" },
          "&.Mui-error": { borderColor: "var(--mui-palette-error-main)" },
          "&.Mui-disabled": {
            backgroundColor: "var(--mui-palette-action-disabledBackground)",
          },
        }),
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: { fontWeight: 500, fontSize: "0.875rem" },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: "var(--mui-palette-divider)" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          border: webTokens.border,
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: webTokens.border, padding: "12px 16px" },
        head: {
          fontWeight: 600,
          color: "var(--mui-palette-text-secondary)",
          backgroundColor: "var(--mui-palette-background-subtle)",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td, &:last-child th": { borderBottom: 0 },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          minHeight: 40,
          margin: "2px 12px",
          "&.Mui-selected": {
            backgroundColor: "var(--mui-palette-action-selected)",
            "&:hover": { backgroundColor: "var(--mui-palette-action-selected)" },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { minWidth: 32, color: "var(--mui-palette-text-secondary)" },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { marginTop: 4, border: webTokens.border },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { minHeight: 36, borderRadius: 6, margin: "2px 6px" },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          border: "1px solid currentColor",
          borderRadius: webTokens.shape.radius,
          boxShadow: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: webTokens.border,
          boxShadow: "0 16px 48px hsla(220, 30%, 5%, 0.2)",
        },
      },
    },
  },
});

export default theme;
