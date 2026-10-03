"use client";

import LandscapeRounded from "@mui/icons-material/LandscapeRounded";
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

import type { AdminUser } from "@/lib/auth";
import { webTokens } from "@/theme/tokens";
import { AdminProfilePopover } from "./admin-profile-popover";
import type { AdminNavigationItem, AdminSection } from "./sections";

export const drawerWidth = webTokens.layout.drawerWidth;

const drawerPaperSx = {
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    boxSizing: "border-box",
    overflowX: "hidden",
    bgcolor: "background.sidebar",
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
  notifications?: Partial<Record<AdminSection, boolean>>;
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
  notifications,
  onSelect,
  onLogout,
}: Omit<AdminNavigationProps, "mobileOpen" | "onMobileClose">) {
  const primaryItems = items.filter((item) => item.key !== "settings");
  const renderItem = ({ key, label, icon: Icon }: AdminNavigationItem) => (
    <ListItemButton
      key={key}
      selected={selected === key}
      onClick={() => onSelect(key)}
      aria-current={selected === key ? "page" : undefined}
      aria-label={
        notifications?.[key] ? `${label}, con novedades o pendientes` : undefined
      }
      sx={{
        minHeight: 36,
        px: 1,
        py: 0.5,
        borderRadius: 1,
        gap: 1,
        "&.Mui-selected": {
          bgcolor: "background.paper",
          color: "primary.main",
          "&:hover": { bgcolor: "background.paper" },
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
      {notifications?.[key] ? (
        <Box
          aria-hidden="true"
          sx={{
            width: 8,
            height: 8,
            flexShrink: 0,
            borderRadius: "50%",
            bgcolor: "error.main",
          }}
        />
      ) : null}
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
      <Divider />
      <AdminProfilePopover
        user={user}
        onOpenSettings={() => onSelect("settings")}
        onLogout={onLogout}
      />
    </Box>
  );
}
