declare module "@mui/material/styles" {
  interface TypeBackground {
    subtle: string;
  }
}

export const webTokens = {
  colors: {
    light: {
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
        subtle: "#e8f0ee",
      },
      status: {
        error: {
          main: "#d32f2f",
          dark: "#c62828",
          light: "#ef5350",
          contrastText: "#ffffff",
        },
        warning: {
          main: "#ed6c02",
          dark: "#e65100",
          light: "#ff9800",
          contrastText: "#1f2933",
        },
        info: {
          main: "#0288d1",
          dark: "#01579b",
          light: "#03a9f4",
          contrastText: "#ffffff",
        },
        success: {
          main: "#2e7d32",
          dark: "#1b5e20",
          light: "#4caf50",
          contrastText: "#ffffff",
        },
      },
    },
    dark: {
      primary: {
        main: "#55c7b8",
        dark: "#2da596",
        light: "#8be0d5",
        contrastText: "#102522",
      },
      secondary: {
        main: "#f0aa56",
        contrastText: "#2b1b0b",
      },
      background: {
        default: "#101817",
        paper: "#182321",
        subtle: "#20302c",
      },
      text: {
        primary: "#e8f1ef",
        secondary: "#afc2be",
      },
      divider: "rgba(232, 241, 239, 0.14)",
      status: {
        error: {
          main: "#f44336",
          dark: "#d32f2f",
          light: "#e57373",
          contrastText: "#ffffff",
        },
        warning: {
          main: "#ffa726",
          dark: "#f57c00",
          light: "#ffb74d",
          contrastText: "#1f2933",
        },
        info: {
          main: "#29b6f6",
          dark: "#0288d1",
          light: "#4fc3f7",
          contrastText: "#102522",
        },
        success: {
          main: "#66bb6a",
          dark: "#388e3c",
          light: "#81c784",
          contrastText: "#102522",
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
  shape: {
    radius: 10,
    navigation: 0,
    pill: 9999,
  },
  layout: {
    drawerWidth: 272,
    headerOffset: 8,
    contentMaxWidth: "lg",
  },
  form: {
    controlHeight: 56,
    inputPaddingTop: 25,
    inputPaddingBottom: 8,
  },
} as const;

export type WebTokens = typeof webTokens;
