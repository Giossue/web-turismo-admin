"use client";

import AccountCircleRounded from "@mui/icons-material/AccountCircleRounded";
import { Chip, Stack } from "@mui/material";

import { DetailList } from "@/components/ui/detail-list";
import { FlatSurface } from "@/components/ui/flat-surface";
import { SectionHeader } from "@/components/ui/section-header";
import type { AdminUser } from "@/lib/auth";
import { webTokens } from "@/theme/tokens";

export function SettingsSection({ user }: { user: AdminUser }) {
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
        </Stack>
      </FlatSurface>
    </Stack>
  );
}
