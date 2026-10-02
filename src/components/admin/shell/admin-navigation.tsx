"use client";

import LogoutRounded from "@mui/icons-material/LogoutRounded";
import LandscapeRounded from "@mui/icons-material/LandscapeRounded";
import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import type { AdminUser } from "@/lib/auth";
import { webTokens } from "@/theme/tokens";
import type { AdminNavigationItem, AdminSection } from "./sections";

export const drawerWidth = webTokens.layout.drawerWidth;

const drawerPaperSx = {
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    boxSizing: "border-box",
    overflowX: "hidden",
    bgcolor: "background.paper",
    borderRight: "1px solid",
    borderColor: "divider",
    borderRadius: 0,
    boxShadow: "none",
  },
} as const;

type AdminNavigationProps = {
  user: AdminUser;
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
  user,
  items,
  selected,
  onSelect,
  onLogout,
}: Omit<AdminNavigationProps, "mobileOpen" | "onMobileClose">) {
  const primaryItems = items.filter((item) => item.key !== "settings");
  const settingsItems = items.filter((item) => item.key === "settings");
  const renderItem = ({ key, label, icon: Icon }: AdminNavigationItem) => (
    <ListItemButton
      key={key}
      selected={selected === key}
      onClick={() => onSelect(key)}
      aria-current={selected === key ? "page" : undefined}
      sx={{
        minHeight: 36,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        gap: 1,
        "&.Mui-selected": {
          bgcolor: "action.selected",
          color: "text.primary",
          "&:hover": { bgcolor: "action.selected" },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 0, color: "inherit" }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={label}
        slotProps={{
          primary: { variant: "body2", fontWeight: selected === key ? 600 : 500 },
        }}
      />
    </ListItemButton>
  );

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
      <Stack direction="row" spacing={1.25} sx={{ p: 2, alignItems: "center" }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            bgcolor: "background.default",
            color: "primary.main",
          }}
        >
          <LandscapeRounded fontSize="small" />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={600}>
            Turismo Vinculación
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Panel institucional
          </Typography>
        </Box>
      </Stack>
      <Divider />
      <List sx={{ p: 1.5, display: "grid", gap: 0.5 }}>
        {primaryItems.map(renderItem)}
      </List>
      <Box sx={{ flex: 1 }} />
      <List sx={{ p: 1.5 }}>{settingsItems.map(renderItem)}</List>
      <Divider />
      <Stack direction="row" spacing={1} sx={{ p: 2, alignItems: "center" }}>
        <Avatar
          alt={user.name}
          sx={{
            width: 32,
            height: 32,
            fontSize: "0.875rem",
            bgcolor: "background.subtle",
            color: "text.primary",
          }}
        >
          {user.name.trim().charAt(0).toLocaleUpperCase("es")}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={500} noWrap title={user.name}>
            {user.name}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            component="p"
            noWrap
            title={user.email}
          >
            {user.email}
          </Typography>
        </Box>
        <Tooltip title="Salir">
          <IconButton size="small" onClick={onLogout} aria-label="Salir">
            <LogoutRounded fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
