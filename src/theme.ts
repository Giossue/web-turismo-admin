"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  cssVariables: true,
  palette: {
    primary: {
      main: "#00796b",
      dark: "#00574f",
      light: "#48a999",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#e28a2b",
      contrastText: "#1f2933",
    },
    background: {
      default: "#f5f8f7",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: "var(--font-roboto), Roboto, Arial, sans-serif",
    h1: { fontWeight: 700, letterSpacing: "-0.03em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: "none" },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 12, minHeight: 44 } },
    },
    MuiCard: {
      styleOverrides: { root: { border: "1px solid #e1ebe8" } },
    },
  },
});

export default theme;
