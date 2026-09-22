"use client";

import { createTheme } from "@mui/material/styles";

import { webTokens } from "@/theme/tokens";

const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data" },
  colorSchemes: {
    light: {
      palette: {
        ...webTokens.colors.light,
        error: webTokens.colors.light.status.error,
        warning: webTokens.colors.light.status.warning,
        info: webTokens.colors.light.status.info,
        success: webTokens.colors.light.status.success,
      },
    },
    dark: {
      palette: {
        ...webTokens.colors.dark,
        error: webTokens.colors.dark.status.error,
        warning: webTokens.colors.dark.status.warning,
        info: webTokens.colors.dark.status.info,
        success: webTokens.colors.dark.status.success,
      },
    },
  },
  typography: {
    fontFamily: "var(--font-roboto), Roboto, Arial, sans-serif",
    h1: { fontWeight: 700, letterSpacing: "-0.03em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: "none" },
  },
  shape: { borderRadius: webTokens.shape.radius },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: webTokens.border,
          borderRadius: webTokens.shape.radius,
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: webTokens.shape.radius,
          minHeight: 44,
          boxShadow: "none",
        },
        outlined: {
          border: 0,
          backgroundColor: "var(--mui-palette-action-hover)",
        },
        contained: { border: 0 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: webTokens.border,
          boxShadow: "none",
          borderRadius: webTokens.shape.radius,
        },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          boxShadow: "none",
          border: 0,
          borderBottom: webTokens.border,
          borderRadius: webTokens.shape.navigation,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          boxShadow: "none",
          border: 0,
          borderRight: webTokens.border,
          borderRadius: webTokens.shape.navigation,
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
    },
    MuiSelect: {
      defaultProps: { variant: "outlined" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: webTokens.shape.radius,
          minHeight: webTokens.form.controlHeight,
          backgroundColor: "var(--mui-palette-action-hover)",
          "& .MuiOutlinedInput-notchedOutline": {
            border: webTokens.border,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--mui-palette-text-secondary)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--mui-palette-primary-main)",
            borderWidth: 1,
          },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: webTokens.shape.radius,
          minHeight: webTokens.form.controlHeight,
          backgroundColor: "var(--mui-palette-action-hover)",
          border: webTokens.border,
          "&:before, &:after": { display: "none" },
          "& input.MuiFilledInput-input": {
            paddingTop: webTokens.form.inputPaddingTop,
            paddingBottom: webTokens.form.inputPaddingBottom,
          },
          "&:hover": { backgroundColor: "var(--mui-palette-action-selected)" },
          "&.Mui-focused": {
            backgroundColor: "var(--mui-palette-action-hover)",
            borderColor: "var(--mui-palette-primary-main)",
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { border: 0, backgroundColor: "var(--mui-palette-divider)" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          border: webTokens.border,
          borderRadius: webTokens.shape.pill,
          fontWeight: 600,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottom: webTokens.border },
        head: {
          fontWeight: 700,
          backgroundColor: "var(--mui-palette-action-hover)",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: { borderRadius: webTokens.shape.radius, margin: "2px 12px" },
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
  },
});

export default theme;
