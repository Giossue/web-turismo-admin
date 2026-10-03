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
        main: "#166534",
        dark: "#14532d",
        light: "#22c55e",
        contrastText: "#ffffff",
      },
      secondary: {
        main: "#4b5563",
        contrastText: "#ffffff",
      },
      background: {
        default: "#f5f8f7",
        paper: "#ffffff",
        subtle: "#e8f0ee",
        sidebar: "#123b2a",
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
        main: "#22c55e",
        dark: "#15803d",
        light: "#4ade80",
        contrastText: "#06130a",
      },
      secondary: {
        main: "#b8b8b8",
        contrastText: "#0b0b0b",
      },
      background: {
        default: "#080808",
        paper: "#151515",
        subtle: "#202020",
        sidebar: "#0c2218",
      },
      text: {
        primary: "#f5f5f5",
        secondary: "#b3b3b3",
      },
      divider: "rgba(245, 245, 245, 0.12)",
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
  navigation: {
    text: "#f8faf9",
    secondaryText: "#c2d7cb",
    divider: "rgba(255, 255, 255, 0.14)",
    hover: "rgba(255, 255, 255, 0.08)",
    selected: "rgba(255, 255, 255, 0.12)",
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
    drawerWidth: 240,
    contentMaxWidth: "lg",
  },
  form: {
    controlHeight: 56,
    inputPaddingTop: 25,
    inputPaddingBottom: 8,
  },
} as const;
