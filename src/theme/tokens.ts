import { brand, gray } from "./primitives";

declare module "@mui/material/styles" {
  interface TypeBackground {
    subtle: string;
  }
}

export const webTokens = {
  colors: {
    light: {
      primary: {
        main: brand[400],
        dark: brand[700],
        light: brand[200],
        contrastText: "#ffffff",
      },
      secondary: {
        main: brand[500],
        dark: brand[700],
        light: brand[300],
        contrastText: "#ffffff",
      },
      grey: gray,
      background: {
        default: gray[50],
        paper: "#ffffff",
        subtle: gray[100],
      },
      text: {
        primary: gray[800],
        secondary: gray[600],
      },
      divider: "hsla(220, 20%, 80%, 0.5)",
      action: {
        hover: "hsla(220, 20%, 88%, 0.3)",
        selected: "hsla(220, 20%, 88%, 0.5)",
      },
      status: {
        error: {
          main: "#b91c1c",
          dark: "#991b1b",
          light: "#ef4444",
          contrastText: "#ffffff",
        },
        warning: {
          main: "#b45309",
          dark: "#92400e",
          light: "#d97706",
          contrastText: "#ffffff",
        },
        info: {
          main: brand[700],
          dark: brand[800],
          light: brand[300],
          contrastText: "#ffffff",
        },
        success: {
          main: "#15803d",
          dark: "#166534",
          light: "#22c55e",
          contrastText: "#ffffff",
        },
      },
    },
    dark: {
      primary: {
        main: brand[400],
        dark: brand[700],
        light: brand[300],
        contrastText: "#ffffff",
      },
      secondary: {
        main: brand[300],
        dark: brand[500],
        light: brand[200],
        contrastText: gray[900],
      },
      grey: gray,
      background: {
        default: gray[900],
        paper: "hsl(220, 30%, 7%)",
        subtle: gray[800],
      },
      text: {
        primary: "#ffffff",
        secondary: gray[400],
      },
      divider: "hsla(220, 20%, 25%, 0.7)",
      action: {
        hover: "hsla(220, 20%, 35%, 0.2)",
        selected: "hsla(220, 20%, 35%, 0.3)",
      },
      status: {
        error: {
          main: "#ef7373",
          dark: "#d32f2f",
          light: "#e57373",
          contrastText: gray[900],
        },
        warning: {
          main: "#ffb74d",
          dark: "#f57c00",
          light: "#ffcc80",
          contrastText: gray[900],
        },
        info: {
          main: brand[300],
          dark: brand[500],
          light: brand[200],
          contrastText: gray[900],
        },
        success: {
          main: "#4ade80",
          dark: "#16a34a",
          light: "#86efac",
          contrastText: gray[900],
        },
      },
    },
  },
  spacing: {
    page: { xs: 2, md: 4 },
    surface: { xs: 2, md: 3 },
    surfaceCompact: 2,
    section: 3,
    control: 2,
    inline: 1,
    tableFooter: 1.5,
    actionGroup: 1.5,
    brand: 1.25,
    navBrand: 0.5,
    state: 6,
    stateInset: 1,
    publicHeading: 5,
    publicCard: 3,
    publicHeroCard: { xs: 3, md: 4 },
    publicHeroGrid: { xs: 5, md: 9 },
    publicGrid: 2.5,
    footer: 4,
    hero: { xs: 7, md: 11 },
    publicSection: { xs: 8, md: 11 },
  },
  /** Borde fino estándar de superficies, tablas y controles. */
  border: "1px solid var(--mui-palette-divider)",
  shape: {
    radius: 8,
    navigation: 0,
    pill: 9999,
  },
  layout: {
    drawerWidth: 240,
    headerOffset: 8,
    contentMaxWidth: "lg",
  },
  form: {
    controlHeight: 56,
    inputPaddingTop: 25,
    inputPaddingBottom: 8,
  },
} as const;
