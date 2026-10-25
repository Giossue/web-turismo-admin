declare module "@mui/material/styles" {
  interface TypeBackground {
    subtle: string;
    sidebar: string;
  }
}

export const webTokens = {
  colors: {
    light: {
      primary: {
        main: "#212a53",
        dark: "#161c3a",
        light: "#3a4680",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#2f8f93",
        dark: "#23706f",
        light: "#52b4b8",
        contrastText: "#ffffff",
      },
      background: {
        default: "#f5f7fb",
        paper: "#ffffff",
        subtle: "#eceff6",
        sidebar: "#1a2147",
      },
      text: {
        primary: "#161b33",
        secondary: "#5a6180",
      },
      divider: "rgba(33, 42, 83, 0.12)",
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
          main: "#0369a1",
          dark: "#075985",
          light: "#0284c7",
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
        main: "#6fc6c9",
        dark: "#52b4b8",
        light: "#9adadc",
        contrastText: "#0b1230",
      },
      secondary: {
        main: "#efc400",
        dark: "#c6aa3d",
        light: "#f5d84d",
        contrastText: "#1a1a00",
      },
      background: {
        default: "#0b0e1c",
        paper: "#131830",
        subtle: "#1b2140",
        sidebar: "#0e1229",
      },
      text: {
        primary: "#eef0f8",
        secondary: "#a9afc9",
      },
      divider: "rgba(238, 240, 248, 0.12)",
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
          main: "#4ade80",
          dark: "#16a34a",
          light: "#86efac",
          contrastText: "#07130a",
        },
      },
    },
  },
  /** Colores de marca Wasi Travel tomados del logotipo. */
  brand: {
    navy: "#212a53",
    teal: "#52b4b8",
    sun: "#efc400",
    ochre: "#c6aa3d",
  },
  navigation: {
    text: "#f5f7fc",
    secondaryText: "#a9b1d3",
    groupLabel: "#7f88b3",
    divider: "rgba(255, 255, 255, 0.1)",
    hover: "rgba(255, 255, 255, 0.06)",
    selected: "rgba(82, 180, 184, 0.16)",
    indicator: "#52b4b8",
    notification: "#f87171",
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
    drawerWidth: 264,
    contentMaxWidth: "lg",
  },
  form: {
    controlHeight: 56,
    inputPaddingTop: 25,
    inputPaddingBottom: 8,
  },
} as const;
