"use client";

import { useId, useState } from "react";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import KeyboardArrowUpRounded from "@mui/icons-material/KeyboardArrowUpRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import {
  Avatar,
  Box,
  Button,
  ButtonBase,
  Divider,
  Popover,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

import type { AdminUser } from "@/lib/auth";

type AdminProfilePopoverProps = {
  user: AdminUser;
  onOpenSettings: () => void;
  onLogout: () => void;
};

export function AdminProfilePopover({
  user,
  onOpenSettings,
  onLogout,
}: AdminProfilePopoverProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { mode, systemMode, setMode } = useColorScheme();
  const popoverId = useId();
  const titleId = useId();
  const open = Boolean(anchorEl);
  const currentMode = mode === "system" ? systemMode : mode;

  const closePopover = () => setAnchorEl(null);

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchorEl(event.currentTarget)}
        aria-label="Abrir perfil"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        sx={{
          width: "100%",
          p: 2,
          gap: 1,
          justifyContent: "flex-start",
          textAlign: "left",
          "&:hover": { bgcolor: "action.hover" },
          "&.Mui-focusVisible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: -2,
          },
        }}
      >
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
        <KeyboardArrowUpRounded
          fontSize="small"
          sx={{ color: "text.secondary", flexShrink: 0 }}
        />
      </ButtonBase>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={closePopover}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        marginThreshold={16}
        slotProps={{
          paper: {
            id: popoverId,
            role: "dialog",
            "aria-labelledby": titleId,
            sx: { width: 300, maxWidth: "calc(100vw - 32px)" },
          },
        }}
      >
        <Stack spacing={2} sx={{ p: 2 }}>
          <Box>
            <Typography component="h2" variant="subtitle1" id={titleId}>
              Mi perfil
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, overflowWrap: "anywhere" }}>
              {user.name}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ overflowWrap: "anywhere" }}
            >
              {user.email}
            </Typography>
          </Box>
          <Divider />
          <Stack spacing={1}>
            <Typography variant="body2" fontWeight={500}>
              Tema
            </Typography>
            <ToggleButtonGroup
              value={currentMode ?? null}
              exclusive
              fullWidth
              size="small"
              color="primary"
              disabled={currentMode === undefined}
              aria-label="Tema"
              onChange={(_, nextMode: string | null) => {
                if (nextMode === "light" || nextMode === "dark") {
                  setMode(nextMode);
                }
              }}
            >
              <ToggleButton value="light" aria-label="Tema claro" sx={{ gap: 1 }}>
                <LightModeRounded fontSize="small" />
                Claro
              </ToggleButton>
              <ToggleButton value="dark" aria-label="Tema oscuro" sx={{ gap: 1 }}>
                <DarkModeRounded fontSize="small" />
                Oscuro
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Divider />
          <Button
            color="inherit"
            fullWidth
            startIcon={<SettingsRounded />}
            onClick={() => {
              closePopover();
              onOpenSettings();
            }}
          >
            Configuración
          </Button>
          <Button
            color="inherit"
            fullWidth
            startIcon={<LogoutRounded />}
            onClick={() => {
              closePopover();
              onLogout();
            }}
          >
            Cerrar sesión
          </Button>
        </Stack>
      </Popover>
    </>
  );
}
