"use client";

import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { FlatSurface } from "@/components/ui/flat-surface";
import { webTokens } from "@/theme/tokens";
import { registerAdminAccessTokenRefresh } from "./admin-api";

export type AdminRole = "ADMINISTRADOR" | "AGENTE_TURISTICO" | "TURISTA";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  roles: AdminRole[];
};

type AuthContextValue = {
  user: AdminUser | null;
  accessToken: string | null;
  ready: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const apiUrl = process.env.NEXT_PUBLIC_TURISMO_API_URL ?? "http://localhost:3000/api/v1";
type RefreshData = Awaited<ReturnType<typeof request>>;
let refreshPromise: Promise<RefreshData> | null = null;

async function request(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body == null) {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...init,
      credentials: "include",
      headers,
    });
  } catch {
    throw new Error(
      "No se pudo conectar con la API institucional. Verifica que el servicio esté iniciado y que NEXT_PUBLIC_TURISMO_API_URL sea correcto.",
    );
  }
  const body = (await response.json().catch(() => null)) as {
    data?: { accessToken?: string; user?: AdminUser };
    error?: { message?: string };
  } | null;
  if (!response.ok) {
    throw new Error(body?.error?.message ?? "No se pudo completar la operación.");
  }
  return body?.data;
}

function refreshSession() {
  if (refreshPromise) {
    return refreshPromise;
  }

  const refresh = () => request("/auth/refresh", { method: "POST" });
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  const operation: Promise<RefreshData> = locks
    ? (
        locks.request as <T>(
          name: string,
          callback: (lock: Lock | null) => T | PromiseLike<T>,
        ) => Promise<T>
      )("turismo-admin-auth-refresh", () => refresh())
    : refresh();
  refreshPromise = operation.finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshStarted = useRef(false);

  const refreshAccessToken = useMemo(
    () =>
      async (expiredToken: string): Promise<string | null> => {
        if (accessToken && accessToken !== expiredToken) {
          return accessToken;
        }

        try {
          const data = await refreshSession();
          if (!data?.accessToken || !data.user) {
            setAccessToken(null);
            setUser(null);
            return null;
          }
          setAccessToken(data.accessToken);
          setUser(data.user);
          return data.accessToken;
        } catch {
          setAccessToken(null);
          setUser(null);
          return null;
        }
      },
    [accessToken],
  );

  useEffect(
    () => registerAdminAccessTokenRefresh(refreshAccessToken),
    [refreshAccessToken],
  );

  useEffect(() => {
    if (refreshStarted.current) {
      return;
    }
    refreshStarted.current = true;

    void refreshSession()
      .then((data) => {
        if (data?.accessToken && data.user) {
          setAccessToken(data.accessToken);
          setUser(data.user);
        }
      })
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      ready,
      error,
      async login(email, password) {
        setError(null);
        try {
          const data = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password }),
          });
          if (!data?.accessToken || !data.user) {
            throw new Error("La API no devolvió una sesión válida.");
          }
          setAccessToken(data.accessToken);
          setUser(data.user);
        } catch (cause) {
          const message =
            cause instanceof Error ? cause.message : "No se pudo iniciar sesión.";
          setError(message);
          throw cause;
        }
      },
      async logout() {
        await request("/auth/logout", { method: "POST" }).catch(() => undefined);
        setAccessToken(null);
        setUser(null);
      },
    }),
    [accessToken, error, ready, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAdminAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAdminAuth debe usarse dentro de AdminAuthProvider.");
  }
  return value;
}

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
              inputProps={{ minLength: 8 }}
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
