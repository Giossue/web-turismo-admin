"use client";

import LogoutRounded from "@mui/icons-material/LogoutRounded";
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

import { webTokens } from "@/theme/tokens";
import type { AdminNavigationItem, AdminSection } from "./sections";

export const drawerWidth = webTokens.layout.drawerWidth;

/** Papel del menú: el radio y la sombra vienen del tema (`MuiDrawer`). */
const drawerPaperSx = {
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    boxSizing: "border-box",
    overflowX: "hidden",
    bgcolor: "background.default",
    borderRight: 0,
  },
} as const;

type AdminNavigationProps = {
  items: readonly AdminNavigationItem[];
  selected: AdminSection;
  onSelect: (section: AdminSection) => void;
  onLogout: () => void;
  /** Menú temporal en pantallas pequeñas. */
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function AdminNavigation({
  mobileOpen,
  onMobileClose,
  ...contentProps
}: AdminNavigationProps) {
  const content = <NavigationContent {...contentProps} />;
  return (
    <Box component="nav" aria-label="Navegación administrativa">
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: "block", md: "none" }, ...drawerPaperSx }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{ display: { xs: "none", md: "block" }, ...drawerPaperSx }}
      >
        {content}
      </Drawer>
    </Box>
  );
}

function NavigationContent({
  items,
  selected,
  onSelect,
  onLogout,
}: Omit<AdminNavigationProps, "mobileOpen" | "onMobileClose">) {
  return (
    <Box
      sx={{
        width: drawerWidth,
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
      role="presentation"
    >
      <Stack spacing={webTokens.spacing.navBrand} sx={{ p: webTokens.spacing.surface }}>
        <Typography variant="h6" fontWeight={700}>
          Turismo Vinculación
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Panel institucional
        </Typography>
      </Stack>
      <List>
        {items.map(({ key, label, icon: Icon }) => (
          <ListItemButton
            key={key}
            selected={selected === key}
            onClick={() => onSelect(key)}
            aria-current={selected === key ? "page" : undefined}
          >
            <ListItemIcon>
              <Icon />
            </ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ flex: 1 }} />
      <Divider sx={{ mx: webTokens.spacing.surface, my: webTokens.spacing.control }} />
      <List>
        <ListItemButton onClick={onLogout}>
          <ListItemIcon>
            <LogoutRounded />
          </ListItemIcon>
          <ListItemText primary="Salir" />
        </ListItemButton>
      </List>
    </Box>
  );
}
