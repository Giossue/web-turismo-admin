"use client";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { registerAdminAccessTokenRefresh } from "./admin-api";
import {
  AdminSession,
  type AdminUser,
  type SessionData,
  type SessionSnapshot,
} from "./admin-session";
import {
  readSessionStatus,
  subscribeSessionChanges,
  withSessionLock,
  writeSessionStatus,
} from "./auth-browser";
import { apiEndpoint, sendApiRequest, toApiError } from "./http";
export type { AdminUser } from "./admin-session";
export function isAdministrator(user: AdminUser | null | undefined): boolean {
  return Boolean(user?.roles.includes("ADMINISTRADOR"));
}
export function canOperatePanel(user: AdminUser | null | undefined): boolean {
  return Boolean(
    user?.roles.some((role) => role === "ADMINISTRADOR" || role === "AGENTE_TURISTICO"),
  );
}
type AuthContextValue = SessionSnapshot & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);
async function request(path: string, init: RequestInit) {
  const result = await sendApiRequest<SessionData>(apiEndpoint(path), {
    ...init,
    credentials: "include",
    cache: "no-store",
  });
  if (!result.response.ok) throw toApiError(result, "No se pudo completar la operación.");
  return result.body?.data;
}
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [session] = useState(
    () =>
      new AdminSession({
        request,
        readStatus: readSessionStatus,
        writeStatus: writeSessionStatus,
        withLock: withSessionLock,
        clearPrivateCache: () => queryClient.clear(),
      }),
  );
  const snapshot = useSyncExternalStore(
    session.subscribe,
    session.getSnapshot,
    session.getServerSnapshot,
  );
  useEffect(
    () => registerAdminAccessTokenRefresh(session.refresh, session.getGeneration),
    [session],
  );
  useEffect(() => {
    const unsubscribe = subscribeSessionChanges(session.synchronize);
    const retryLogout = () => {
      if (readSessionStatus() === "logout-pending") void session.logout();
    };
    window.addEventListener("online", retryLogout);
    void session.start();
    return () => {
      unsubscribe();
      window.removeEventListener("online", retryLogout);
    };
  }, [session]);
  const value = useMemo(
    () => ({ ...snapshot, login: session.login, logout: session.logout }),
    [session, snapshot],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAdminAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAdminAuth debe usarse dentro de AdminAuthProvider.");
  return value;
}
