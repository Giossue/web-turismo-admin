"use client";

import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";

import { FlatSurface } from "@/components/ui/flat-surface";
import { useAdminAuth } from "@/lib/auth";
import { webTokens } from "@/theme/tokens";

export function AdminLogin() {
  const { error, login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      await login(email, password);
    } catch {
      // El proveedor ya expone el error en el formulario; evita un Runtime Error no controlado.
    } finally {
      setPending(false);
    }
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: webTokens.spacing.surfaceCompact,
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 440 }}>
        <Stack spacing={webTokens.spacing.inline} sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1">
            Acceso institucional
          </Typography>
          <Typography color="text.secondary">
            Gestiona fichas y revisiones publicadas para Turismo Vinculación.
          </Typography>
        </Stack>
        <FlatSurface padding="default">
          <Stack component="form" onSubmit={submit} spacing={webTokens.spacing.control}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField
              label="Correo institucional"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              slotProps={{ htmlInput: { minLength: 8 } }}
            />
            <Button type="submit" variant="contained" disabled={pending}>
              {pending ? "Validando…" : "Iniciar sesión"}
            </Button>
          </Stack>
        </FlatSurface>
      </Box>
    </Box>
  );
}
