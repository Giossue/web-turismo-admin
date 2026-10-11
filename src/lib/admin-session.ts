export type AdminRole = "ADMINISTRADOR" | "AGENTE_TURISTICO" | "TURISTA";
export type AdminUser = { id: number; name: string; email: string; roles: AdminRole[] };
export type SessionData = { accessToken?: string; user?: AdminUser };
export type SessionStatus = "active" | "logged-out" | "logout-pending";
export type SessionSnapshot = {
  user: AdminUser | null;
  accessToken: string | null;
  ready: boolean;
  error: string | null;
  loggingOut: boolean;
  logoutPending: boolean;
};
type SessionDependencies = {
  request: (path: string, init: RequestInit) => Promise<SessionData | undefined>;
  readStatus: () => SessionStatus | null;
  writeStatus: (status: SessionStatus) => void;
  withLock: <T>(signal: AbortSignal, operation: () => Promise<T>) => Promise<T>;
  clearPrivateCache: () => void;
};
const initialSnapshot: SessionSnapshot = {
  user: null,
  accessToken: null,
  ready: false,
  error: null,
  loggingOut: false,
  logoutPending: false,
};
const logoutError =
  "Se cerró el acceso en este navegador, pero no se pudo revocar la sesión. Reintenta el cierre antes de iniciar sesión.";
function validSession(
  data: SessionData | undefined,
): data is { accessToken: string; user: AdminUser } {
  return Boolean(
    data &&
    typeof data.accessToken === "string" &&
    data.accessToken.length > 0 &&
    data.accessToken.length <= 16_384 &&
    data.user &&
    Number.isSafeInteger(data.user.id) &&
    data.user.id > 0 &&
    typeof data.user.name === "string" &&
    typeof data.user.email === "string" &&
    Array.isArray(data.user.roles) &&
    data.user.roles.every((r) =>
      ["ADMINISTRADOR", "AGENTE_TURISTICO", "TURISTA"].includes(r),
    ),
  );
}

/** Cada login/cierre invalida las respuestas de la sesión anterior. */
export class AdminSession {
  private snapshot: SessionSnapshot = initialSnapshot;
  private listeners = new Set<() => void>();
  private generation = 0;
  private started = false;
  private requests = new Set<AbortController>();
  private refreshPromise: Promise<string | null> | null = null;
  private logoutPromise: Promise<void> | null = null;
  constructor(private readonly dependencies: SessionDependencies) {}
  getSnapshot = () => this.snapshot;
  getServerSnapshot = () => initialSnapshot;
  getGeneration = () => this.generation;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private update(patch: Partial<SessionSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }
  private invalidate() {
    this.generation++;
    for (const request of this.requests) request.abort();
    this.requests.clear();
    this.refreshPromise = null;
    this.dependencies.clearPrivateCache();
    this.update({ user: null, accessToken: null });
  }
  private apply(data: SessionData | undefined) {
    if (!validSession(data)) {
      if (this.snapshot.user || this.snapshot.accessToken) this.generation++;
      this.dependencies.clearPrivateCache();
      this.update({ user: null, accessToken: null });
      return null;
    }
    if (
      this.snapshot.user &&
      (this.snapshot.user.id !== data.user.id ||
        this.snapshot.user.roles.join() !== data.user.roles.join())
    ) {
      this.generation++;
      this.dependencies.clearPrivateCache();
    }
    this.update({ user: data.user, accessToken: data.accessToken, error: null });
    return data.accessToken;
  }
  private blocked() {
    const status = this.dependencies.readStatus();
    return status === "logged-out" || status === "logout-pending";
  }
  private async operation<T>(run: (signal: AbortSignal) => Promise<T>) {
    const controller = new AbortController();
    this.requests.add(controller);
    const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(20_000)]);
    try {
      return await this.dependencies.withLock(signal, () => run(signal));
    } finally {
      this.requests.delete(controller);
    }
  }
  start = async () => {
    if (this.started) return;
    this.started = true;
    if (this.dependencies.readStatus() === "logout-pending") await this.logout();
    else if (this.blocked()) this.update({ ready: true });
    else await this.refresh();
  };
  refresh = (expiredToken?: string): Promise<string | null> => {
    if (this.blocked()) return Promise.resolve(null);
    if (expiredToken && this.snapshot.accessToken !== expiredToken)
      return Promise.resolve(this.snapshot.accessToken);
    if (this.refreshPromise) return this.refreshPromise;
    const generation = this.generation;
    const operation = this.operation(async (signal) => {
      // El cierre en otra pestaña puede ocurrir mientras se espera el Web Lock.
      if (this.blocked() || generation !== this.generation) return null;
      const data = await this.dependencies.request("/auth/refresh", {
        method: "POST",
        signal,
      });
      if (this.blocked() || generation !== this.generation) return null;
      return this.apply(data);
    })
      .catch(() => {
        if (generation === this.generation) this.apply(undefined);
        return null;
      })
      .finally(() => {
        if (this.refreshPromise === operation) this.refreshPromise = null;
        if (generation === this.generation) this.update({ ready: true });
      });
    this.refreshPromise = operation;
    return operation;
  };
  login = async (email: string, password: string) => {
    if (
      this.snapshot.loggingOut ||
      this.snapshot.logoutPending ||
      this.dependencies.readStatus() === "logout-pending"
    )
      throw new Error(logoutError);
    this.invalidate();
    this.update({ error: null, ready: true });
    const generation = this.generation;
    try {
      await this.operation(async (signal) => {
        if (generation !== this.generation) return;
        if (this.dependencies.readStatus() === "logout-pending")
          throw new Error(logoutError);
        const data = await this.dependencies.request("/auth/login", {
          method: "POST",
          signal,
          body: JSON.stringify({ email, password }),
        });
        if (generation !== this.generation) return;
        if (this.dependencies.readStatus() === "logout-pending")
          throw new Error(logoutError);
        if (!validSession(data)) throw new Error("La API no devolvió una sesión válida.");
        this.dependencies.writeStatus("active");
        this.apply(data);
      });
    } catch (cause) {
      if (generation === this.generation)
        this.update({
          error: cause instanceof Error ? cause.message : "No se pudo iniciar sesión.",
        });
      throw cause;
    }
  };
  logout = (): Promise<void> => {
    if (this.logoutPromise) return this.logoutPromise;
    this.invalidate();
    this.dependencies.writeStatus("logout-pending");
    this.update({ ready: true, error: null, loggingOut: true, logoutPending: true });
    const generation = this.generation;
    const operation = this.operation(async (signal) => {
      await this.dependencies.request("/auth/logout", { method: "POST", signal });
      if (generation !== this.generation) return;
      this.dependencies.writeStatus("logged-out");
      this.update({ error: null, logoutPending: false });
    })
      .catch(() => {
        if (generation === this.generation) this.update({ error: logoutError });
      })
      .finally(() => {
        if (this.logoutPromise === operation) this.logoutPromise = null;
        if (generation === this.generation) this.update({ loggingOut: false });
      });
    this.logoutPromise = operation;
    return operation;
  };
  /** Evento de cierre o cambio de cuenta recibido de otra pestaña. */
  synchronize = () => {
    const status = this.dependencies.readStatus();
    if (status === "logout-pending" && this.snapshot.loggingOut) return;
    this.invalidate();
    this.update({
      ready: status !== "active",
      loggingOut: false,
      logoutPending: status === "logout-pending",
      error: status === "logout-pending" ? logoutError : null,
    });
    if (status === "active") void this.refresh();
  };
}
