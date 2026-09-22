"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { registerAdminAccessTokenRefresh } from "./admin-api";
import { errorMessage } from "./errors";
import { apiEndpoint, sendApiRequest, toApiError } from "./http";

export type AdminRole = "ADMINISTRADOR" | "AGENTE_TURISTICO" | "TURISTA";

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  roles: AdminRole[];
};

/** Administración: revisión, opiniones, catálogos y resumen. */
export function isAdministrator(user: AdminUser | null | undefined): boolean {
  return Boolean(user?.roles.includes("ADMINISTRADOR"));
}

/** Cuentas que pueden entrar al panel: administradores y agentes turísticos. */
export function canOperatePanel(user: AdminUser | null | undefined): boolean {
  return Boolean(
    user?.roles.some((role) => role === "ADMINISTRADOR" || role === "AGENTE_TURISTICO"),
  );
}

type AuthContextValue = {
  user: AdminUser | null;
  accessToken: string | null;
  ready: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
type SessionData = { accessToken?: string; user?: AdminUser };
type RefreshData = Awaited<ReturnType<typeof request>>;
let refreshPromise: Promise<RefreshData> | null = null;

async function request(path: string, init?: RequestInit) {
  const result = await sendApiRequest<SessionData>(apiEndpoint(path), {
    ...init,
    credentials: "include",
  });
  if (!result.response.ok) {
    throw toApiError(result, "No se pudo completar la operación.");
  }
  return result.body?.data;
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

/**
 * Sesión institucional. Debe montarse dentro de `QueryClientProvider`: al
 * cerrar sesión, perderla o cambiar de cuenta vacía la caché de TanStack Query
 * para que la siguiente cuenta no vea datos de la anterior.
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshStarted = useRef(false);
  const sessionUserId = useRef<number | null>(null);

  /** Aplica la sesión recibida de la API (o su ausencia) y devuelve el token. */
  const applySession = useCallback(
    (data: SessionData | null | undefined): string | null => {
      const next = data?.accessToken && data.user ? data : null;
      const nextUserId = next?.user?.id ?? null;
      if (sessionUserId.current !== null && sessionUserId.current !== nextUserId) {
        // Se vacía antes de renderizar con la nueva sesión: ningún componente
        // de la cuenta siguiente llega a leer datos en caché de la anterior.
        queryClient.clear();
      }
      sessionUserId.current = nextUserId;
      setAccessToken(next?.accessToken ?? null);
      setUser(next?.user ?? null);
      return next?.accessToken ?? null;
    },
    [queryClient],
  );

  const refreshAccessToken = useCallback(
    async (expiredToken: string): Promise<string | null> => {
      if (accessToken && accessToken !== expiredToken) {
        return accessToken;
      }
      try {
        return applySession(await refreshSession());
      } catch {
        return applySession(null);
      }
    },
    [accessToken, applySession],
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
      .then((data) => applySession(data))
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, [applySession]);

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
          applySession(data);
        } catch (cause) {
          setError(errorMessage(cause, "No se pudo iniciar sesión."));
          throw cause;
        }
      },
      async logout() {
        await request("/auth/logout", { method: "POST" }).catch(() => undefined);
        applySession(null);
      },
    }),
    [accessToken, applySession, error, ready, user],
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
