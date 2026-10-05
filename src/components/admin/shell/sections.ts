import AssessmentRounded from "@mui/icons-material/AssessmentRounded";
import CategoryRounded from "@mui/icons-material/CategoryRounded";
import EditNoteRounded from "@mui/icons-material/EditNoteRounded";
import FactCheckRounded from "@mui/icons-material/FactCheckRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import PlaceRounded from "@mui/icons-material/PlaceRounded";
import RateReviewRounded from "@mui/icons-material/RateReviewRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import PeopleAltRounded from "@mui/icons-material/PeopleAltRounded";
import type { SvgIconComponent } from "@mui/icons-material";

const ADMIN_SECTIONS = [
  "summary",
  "review",
  "opinions",
  "centers",
  "establishments",
  "catalogs",
  "users",
  "activity",
  "editor",
  "settings",
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];

type AdminSectionConfig = {
  title: string;
  description: string;
  /** Etiqueta del menú lateral; el editor no aparece en el menú. */
  navLabel: string;
  /** Etiqueta del menú para agentes turísticos, si difiere. */
  agentNavLabel?: string;
  icon: SvgIconComponent;
  /** Solo administradores; un agente turístico es redirigido a "centers". */
  adminOnly: boolean;
  inNavigation: boolean;
};

/** Configuración única de los apartados del panel (encabezado, menú y permisos). */
export const adminSectionConfig: Record<AdminSection, AdminSectionConfig> = {
  summary: {
    title: "Resumen",
    description: "Una vista rápida del inventario y su estado de publicación.",
    navLabel: "Resumen",
    icon: AssessmentRounded,
    adminOnly: true,
    inNavigation: true,
  },
  review: {
    title: "Revisión de fichas",
    description:
      "Revisa propuestas y conserva visibles las fichas que ya fueron aprobadas.",
    navLabel: "Revisión de fichas",
    icon: FactCheckRounded,
    adminOnly: true,
    inNavigation: true,
  },
  opinions: {
    title: "Opiniones",
    description:
      "Modera las opiniones de visitantes y conserva la versión publicada mientras una edición está pendiente.",
    navLabel: "Opiniones",
    icon: RateReviewRounded,
    adminOnly: true,
    inNavigation: true,
  },
  activity: {
    title: "Actividad reciente",
    description: "Consulta los cambios y revisiones registrados en el panel.",
    navLabel: "Actividad",
    icon: HistoryRounded,
    adminOnly: true,
    inNavigation: true,
  },
  centers: {
    title: "Centros turísticos",
    description: "Consulta el inventario institucional por estado y búsqueda.",
    navLabel: "Centros turísticos",
    agentNavLabel: "Mis centros turísticos",
    icon: PlaceRounded,
    adminOnly: false,
    inNavigation: true,
  },
  establishments: {
    title: "Catastro por localidad",
    description:
      "Administra establecimientos que el turista puede encontrar cerca de una localidad.",
    navLabel: "Catastro",
    agentNavLabel: "Mi catastro",
    icon: StorefrontRounded,
    adminOnly: false,
    inNavigation: true,
  },
  catalogs: {
    title: "Catálogos",
    description: "Administra las opciones disponibles para fichas y establecimientos.",
    navLabel: "Catálogos",
    icon: CategoryRounded,
    adminOnly: true,
    inNavigation: true,
  },
  users: {
    title: "Usuarios",
    description: "Consulta las cuentas registradas, sus roles y su estado.",
    navLabel: "Usuarios",
    icon: PeopleAltRounded,
    adminOnly: true,
    inNavigation: true,
  },
  editor: {
    title: "Ficha turística",
    description: "Captura y publica información institucional validada.",
    navLabel: "Ficha turística",
    icon: EditNoteRounded,
    adminOnly: false,
    inNavigation: false,
  },
  settings: {
    title: "Configuración",
    description: "Administra tu sesión y las preferencias de este panel.",
    navLabel: "Configuración",
    icon: SettingsRounded,
    adminOnly: false,
    inNavigation: true,
  },
};

export function isAdminSection(value: string | null | undefined): value is AdminSection {
  return (ADMIN_SECTIONS as readonly string[]).includes(value ?? "");
}

/** Apartado que puede ver el usuario: los exclusivos de administración pasan a "centers". */
export function resolveSection(section: AdminSection, isAdmin: boolean): AdminSection {
  return !isAdmin && adminSectionConfig[section].adminOnly ? "centers" : section;
}

export type AdminNavigationItem = {
  key: AdminSection;
  label: string;
  icon: SvgIconComponent;
};

/** Entradas del menú lateral según el rol, en el orden de `ADMIN_SECTIONS`. */
export function navigationItems(isAdmin: boolean): AdminNavigationItem[] {
  return ADMIN_SECTIONS.filter((key) => {
    const config = adminSectionConfig[key];
    return config.inNavigation && (isAdmin || !config.adminOnly);
  }).map((key) => {
    const config = adminSectionConfig[key];
    return {
      key,
      label: isAdmin ? config.navLabel : (config.agentNavLabel ?? config.navLabel),
      icon: config.icon,
    };
  });
}
