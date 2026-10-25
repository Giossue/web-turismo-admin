"use client";

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
import {
  NAVIGATION_GROUPS,
  type AdminNavigationItem,
  type AdminSection,
} from "./sections";

export const drawerWidth = webTokens.layout.drawerWidth;

const drawerPaperSx = {
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    boxSizing: "border-box",
    overflowX: "hidden",
    bgcolor: "background.sidebar",
    color: webTokens.navigation.text,
    borderRight: 0,
    borderRadius: 0,
    boxShadow: "none",
    "& .MuiDivider-root": { borderColor: webTokens.navigation.divider },
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
        position: "relative",
        minHeight: 40,
        m: 0,
        px: 1.5,
        py: 0.75,
        borderRadius: 1,
        gap: 1.5,
        color: webTokens.navigation.secondaryText,
        transition: "background-color 120ms ease, color 120ms ease",
        "&:hover": {
          bgcolor: webTokens.navigation.hover,
          color: webTokens.navigation.text,
        },
        "&.Mui-focusVisible": {
          outline: "2px solid",
          outlineColor: webTokens.navigation.text,
          outlineOffset: 2,
        },
        "&.Mui-selected": {
          bgcolor: webTokens.navigation.selected,
          color: webTokens.navigation.text,
          "&:hover": { bgcolor: webTokens.navigation.selected },
          "& .MuiListItemIcon-root": { color: webTokens.navigation.indicator },
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 8,
            bottom: 8,
            width: 3,
            borderRadius: 3,
            bgcolor: webTokens.navigation.indicator,
          },
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 0, color: "inherit" }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primary={label}
        slotProps={{
          primary: {
            variant: "body2",
            fontWeight: selected === key ? 600 : 500,
            noWrap: true,
          },
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
            bgcolor: webTokens.navigation.notification,
          }}
        />
      ) : null}
    </ListItemButton>
  );

  return (
    <Box
      sx={{
        width: drawerWidth,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
      role="presentation"
    >
      <Stack
        direction="row"
        spacing={1.5}
        sx={{ px: 2.5, py: 2.5, alignItems: "center" }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            borderRadius: 1.5,
            bgcolor: "#ffffff",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
          }}
        >
          <Box
            component="img"
            src="/brand/wasi-travel-logo.png"
            alt=""
            width={34}
            height={34}
            sx={{ display: "block" }}
          />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            component="p"
            sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }}
          >
            Wasi Travel
          </Typography>
          <Typography variant="caption" color={webTokens.navigation.secondaryText}>
            Panel administrativo
          </Typography>
        </Box>
      </Stack>
      <Divider />
      <Box sx={{ flex: 1, overflowY: "auto", px: 1.5, py: 1 }}>
        {NAVIGATION_GROUPS.map((group) => {
          const groupItems = primaryItems.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;
          const labelId = `admin-nav-group-${group}`;
          return (
            <Box key={group} sx={{ pt: 1.5 }}>
              <Typography
                id={labelId}
                variant="caption"
                component="p"
                sx={{
                  px: 1.5,
                  pb: 0.75,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontSize: "0.6875rem",
                  color: webTokens.navigation.groupLabel,
                }}
              >
                {group}
              </Typography>
              <List aria-labelledby={labelId} sx={{ p: 0, display: "grid", gap: 0.25 }}>
                {groupItems.map(renderItem)}
              </List>
            </Box>
          );
        })}
      </Box>
      <Divider />
      <AdminProfilePopover
        user={user}
        onOpenSettings={() => onSelect("settings")}
        onLogout={onLogout}
      />
    </Box>
  );
}
