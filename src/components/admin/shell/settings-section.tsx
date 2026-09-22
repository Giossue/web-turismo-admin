"use client";

import AccountCircleRounded from "@mui/icons-material/AccountCircleRounded";
import LogoutRounded from "@mui/icons-material/LogoutRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import { Box, Button, Chip, Stack } from "@mui/material";

import { ColorModeButton } from "@/components/ui/color-mode-button";
import { DetailList } from "@/components/ui/detail-list";
import { FlatSurface } from "@/components/ui/flat-surface";
import { SectionHeader } from "@/components/ui/section-header";
import type { AdminUser } from "@/lib/auth";
import { webTokens } from "@/theme/tokens";

export function SettingsSection({
  user,
  onLogout,
}: {
  user: AdminUser;
  onLogout: () => void;
}) {
  return (
    <Stack spacing={webTokens.spacing.control}>
      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.control}>
          <SectionHeader
            icon={<AccountCircleRounded />}
            title="Cuenta institucional"
            description="La sesión usa una cookie de renovación protegida y un token de acceso en memoria."
          />
          <DetailList
            spacing={webTokens.spacing.inline}
            items={[
              { label: "Nombre", value: user.name || "Sin nombre" },
              { label: "Correo", value: user.email },
              {
                label: "Roles",
                value: (
                  <Stack
                    direction="row"
                    spacing={webTokens.spacing.inline}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ display: "inline-flex", verticalAlign: "middle" }}
                  >
                    {user.roles.map((role) => (
                      <Chip key={role} label={role} size="small" />
                    ))}
                  </Stack>
                ),
              },
            ]}
          />
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutRounded />}
            onClick={onLogout}
            sx={{ alignSelf: "flex-start" }}
          >
            Cerrar sesión
          </Button>
        </Stack>
      </FlatSurface>
      <FlatSurface padding="default">
        <Stack spacing={webTokens.spacing.inline}>
          <SectionHeader
            icon={<SettingsRounded />}
            title="Preferencias"
            description="Elige el tema con el botón de la barra superior. MUI conserva esta preferencia localmente sin guardar credenciales."
          />
          <Box>
            <ColorModeButton />
          </Box>
        </Stack>
      </FlatSurface>
    </Stack>
  );
}
