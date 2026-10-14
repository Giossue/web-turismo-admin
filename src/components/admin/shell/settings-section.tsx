"use client";

import AccountCircleRounded from "@mui/icons-material/AccountCircleRounded";
import PublishRounded from "@mui/icons-material/PublishRounded";
import { Chip, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { DetailList } from "@/components/ui/detail-list";
import { FlatSurface } from "@/components/ui/flat-surface";
import { SectionHeader } from "@/components/ui/section-header";
import { updatePlatformSettings, type PlatformSettings } from "@/lib/admin-api";
import { adminKeys } from "@/lib/admin-queries";
import { isAdministrator, type AdminUser } from "@/lib/auth";
import { errorMessage } from "@/lib/errors";
import { usePlatformSettings } from "@/lib/use-platform-settings";
import { webTokens } from "@/theme/tokens";

export function SettingsSection({
  user,
  token,
  onNotice,
  onError,
}: {
  user: AdminUser;
  token: string;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}) {
  return (
    <Stack spacing={webTokens.spacing.control}>
      {isAdministrator(user) ? (
        <DirectPublishSettings token={token} onNotice={onNotice} onError={onError} />
      ) : null}
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

function DirectPublishSettings({
  token,
  onNotice,
  onError,
}: {
  token: string;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
}) {
  const queryClient = useQueryClient();
  const settings = usePlatformSettings(token);
  const update = useMutation({
    mutationFn: (input: Partial<PlatformSettings>) =>
      updatePlatformSettings(token, input),
    onSuccess: async (saved) => {
      queryClient.setQueryData(adminKeys.platformSettings(), saved);
      onNotice("La configuración se guardó.");
    },
    onError: (cause) =>
      onError(errorMessage(cause, "No se pudo guardar la configuración.")),
  });
  const toggle = (key: keyof PlatformSettings, label: string, description: string) => (
    <Stack spacing={0.5}>
      <FormControlLabel
        control={
          <Switch
            checked={settings[key]}
            disabled={update.isPending}
            onChange={(event) => update.mutate({ [key]: event.target.checked })}
          />
        }
        label={label}
      />
      <Typography variant="body2" color="text.secondary" sx={{ pl: 6 }}>
        {description}
      </Typography>
    </Stack>
  );
  return (
    <FlatSurface padding="default">
      <Stack spacing={webTokens.spacing.control}>
        <SectionHeader
          icon={<PublishRounded />}
          title="Publicación sin revisión"
          description="Con el paso libre, lo que envía un agente turístico se publica al instante, sin esperar tu aprobación."
        />
        {toggle(
          "directPublishCatastros",
          "Catastros de los agentes",
          "Al enviar un catastro, queda publicado en la app de inmediato.",
        )}
        {toggle(
          "directPublishFichas",
          "Fichas de los agentes",
          "Al enviar una ficha de centro turístico, queda publicada de inmediato.",
        )}
      </Stack>
    </FlatSurface>
  );
}
