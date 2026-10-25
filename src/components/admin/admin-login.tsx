"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  FormControl,
  FormLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type FormEvent, useRef, useState } from "react";

import { useAdminAuth } from "@/lib/auth";
import { webTokens } from "@/theme/tokens";

export function AdminLogin() {
  const { error, login, logout, loggingOut, logoutPending } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    try {
      await login(email, password);
    } catch {
      // El proveedor ya expone el error en el formulario; evita un Runtime Error no controlado.
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        px: { xs: 2, sm: 4 },
        py: { xs: 10, sm: 8 },
        backgroundImage:
          "radial-gradient(ellipse at 50% 0%, var(--mui-palette-background-subtle), var(--mui-palette-background-default) 70%)",
      }}
    >
      <Card
        variant="outlined"
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: 450,
          p: { xs: 3, sm: 4 },
          gap: 2,
          boxShadow:
            "rgba(0, 0, 0, 0.05) 0px 5px 15px 0px, rgba(0, 0, 0, 0.05) 0px 15px 35px -5px",
          ...theme.applyStyles("dark", {
            boxShadow:
              "rgba(0, 0, 0, 0.5) 0px 5px 15px 0px, rgba(0, 0, 0, 0.08) 0px 15px 35px -5px",
          }),
        })}
      >
        <Stack spacing={1} sx={{ alignItems: "center", mb: 1 }}>
          {/* Mosaico blanco: el trazo azul marino del logo se pierde en el tema oscuro. */}
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 80,
              height: 80,
              borderRadius: 2,
              bgcolor: "#ffffff",
              border: webTokens.border,
            }}
          >
            <Box
              component="img"
              src="/brand/wasi-travel-logo.png"
              alt=""
              width={64}
              height={64}
              sx={{ display: "block" }}
            />
          </Box>
          <Typography
            variant="subtitle1"
            component="p"
            sx={{ fontWeight: 700, letterSpacing: "-0.01em", color: "primary.main" }}
          >
            Wasi Travel
          </Typography>
        </Stack>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontSize: "clamp(1.5rem, 7vw, 1.875rem)", textAlign: "center" }}
        >
          Iniciar sesión
        </Typography>
        <Typography
          id="login-description"
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: "center" }}
        >
          Ingresa con tu cuenta institucional para gestionar fichas y revisiones.
        </Typography>
        <Stack
          component="form"
          onSubmit={submit}
          spacing={2}
          aria-describedby="login-description"
        >
          {error ? <Alert severity="error">{error}</Alert> : null}
          {logoutPending ? (
            <Button onClick={() => void logout()} disabled={loggingOut}>
              {loggingOut ? "Cerrando sesión…" : "Reintentar cierre de sesión"}
            </Button>
          ) : null}
          <FormControl fullWidth>
            <FormLabel htmlFor="email" sx={{ mb: 1 }}>
              Correo institucional
            </FormLabel>
            <TextField
              id="email"
              name="email"
              type="email"
              placeholder="nombre@institucion.edu.ec"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              fullWidth
              required
            />
          </FormControl>
          <FormControl fullWidth>
            <FormLabel htmlFor="password" sx={{ mb: 1 }}>
              Contraseña
            </FormLabel>
            <TextField
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              fullWidth
              required
              slotProps={{ htmlInput: { minLength: 8 } }}
            />
          </FormControl>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={pending || logoutPending || loggingOut}
          >
            {pending ? "Validando…" : "Iniciar sesión"}
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
