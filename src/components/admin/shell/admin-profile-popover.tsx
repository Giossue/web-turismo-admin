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
import { webTokens } from "@/theme/tokens";

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
          color: webTokens.navigation.text,
          "&:hover": { bgcolor: webTokens.navigation.hover },
          "&.Mui-focusVisible": {
            outline: "2px solid",
            outlineColor: webTokens.navigation.text,
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
            bgcolor: webTokens.navigation.selected,
            color: webTokens.navigation.text,
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
            color={webTokens.navigation.secondaryText}
            component="p"
            noWrap
            title={user.email}
          >
            {user.email}
          </Typography>
        </Box>
        <KeyboardArrowUpRounded
          fontSize="small"
          sx={{ color: webTokens.navigation.secondaryText, flexShrink: 0 }}
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
            sx: { width: 264, maxWidth: "calc(100vw - 32px)" },
          },
        }}
      >
        <Stack spacing={1.25} sx={{ p: 1.5 }}>
          <Box>
            <Typography component="h2" variant="subtitle1" id={titleId}>
              Mi perfil
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
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
          <Stack spacing={0.75}>
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
              sx={{ "& .MuiToggleButton-root": { minHeight: 32, py: 0.5, gap: 0.75 } }}
              onChange={(_, nextMode: string | null) => {
                if (nextMode === "light" || nextMode === "dark") {
                  setMode(nextMode);
                }
              }}
            >
              <ToggleButton value="light" aria-label="Tema claro">
                <LightModeRounded fontSize="small" />
                Claro
              </ToggleButton>
              <ToggleButton value="dark" aria-label="Tema oscuro">
                <DarkModeRounded fontSize="small" />
                Oscuro
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <Divider />
          <Stack spacing={0.5}>
            <Button
              color="inherit"
              size="small"
              fullWidth
              sx={{ justifyContent: "flex-start" }}
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
              size="small"
              fullWidth
              sx={{ justifyContent: "flex-start" }}
              startIcon={<LogoutRounded />}
              onClick={() => {
                closePopover();
                onLogout();
              }}
            >
              Cerrar sesión
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}
