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

import { ColorModeButton } from "@/components/ui/color-mode-button";
import { useAdminAuth } from "@/lib/auth";

export function AdminLogin() {
  const { error, login } = useAdminAuth();
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
          "radial-gradient(ellipse at 50% 50%, var(--mui-palette-background-subtle), var(--mui-palette-background-default))",
      }}
    >
      <Box sx={{ position: "fixed", top: 16, right: 16, zIndex: 1 }}>
        <ColorModeButton />
      </Box>
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
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontSize: "clamp(1.75rem, 8vw, 2.15rem)" }}
        >
          Iniciar sesión
        </Typography>
        <Typography id="login-description" variant="body2" color="text.secondary">
          Ingresa con tu cuenta institucional para gestionar fichas y revisiones.
        </Typography>
        <Stack
          component="form"
          onSubmit={submit}
          spacing={2}
          aria-describedby="login-description"
        >
          {error ? <Alert severity="error">{error}</Alert> : null}
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
          <Button type="submit" variant="contained" fullWidth disabled={pending}>
            {pending ? "Validando…" : "Iniciar sesión"}
          </Button>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
          Acceso exclusivo para personal autorizado.
        </Typography>
      </Card>
    </Box>
  );
}
