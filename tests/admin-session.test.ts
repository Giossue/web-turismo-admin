import { describe, expect, mock, test } from "bun:test";
import { AdminSession, type SessionData, type SessionStatus } from "@/lib/admin-session";

const sessionData = (id = 1, token = "token-a"): SessionData => ({
  accessToken: token,
  user: {
    id,
    name: `Cuenta ${id}`,
    email: "cuenta@example.test",
    roles: ["ADMINISTRADOR"],
  },
});
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((r, j) => {
    resolve = r;
    reject = j;
  });
  return { promise, resolve, reject };
}
function harness(
  request: (path: string, init: RequestInit) => Promise<SessionData | undefined>,
  initial: SessionStatus | null = null,
) {
  let status = initial;
  const clear = mock(() => undefined);
  const dependencies = {
    request,
    readStatus: () => status,
    writeStatus: (value: SessionStatus) => {
      status = value;
    },
    withLock: async <T>(_signal: AbortSignal, run: () => Promise<T>) => run(),
    clearPrivateCache: clear,
  };
  return {
    session: new AdminSession(dependencies),
    dependencies,
    clear,
    status: () => status,
    change: (value: SessionStatus) => {
      status = value;
    },
  };
}

describe("sesión institucional", () => {
  test("una renovación tardía no restaura una sesión cerrada", async () => {
    const late = deferred<SessionData>();
    const h = harness(async (path) =>
      path === "/auth/refresh" ? late.promise : sessionData(),
    );
    await h.session.login("cuenta@example.test", "contraseña");
    const refresh = h.session.refresh("token-a");
    await h.session.logout();
    late.resolve(sessionData(1, "token-tardio"));
    expect(await refresh).toBeNull();
    expect(h.session.getSnapshot().user).toBeNull();
    expect(h.session.getSnapshot().accessToken).toBeNull();
    expect(h.status()).toBe("logged-out");
  });
  test("deduplica renovaciones concurrentes y usa el token que ya se renovó", async () => {
    const next = deferred<SessionData>();
    const request = mock(async () => next.promise);
    const h = harness(request);
    const a = h.session.refresh(),
      b = h.session.refresh();
    expect(a).toBe(b);
    next.resolve(sessionData(1, "token-nuevo"));
    expect(await a).toBe("token-nuevo");
    expect(await h.session.refresh("token-viejo")).toBe("token-nuevo");
    expect(request).toHaveBeenCalledTimes(1);
  });
  test("un login tardío tampoco reaplica la cuenta después del cierre", async () => {
    const late = deferred<SessionData>();
    const h = harness(async (path) =>
      path === "/auth/login" ? late.promise : undefined,
    );
    const login = h.session.login("cuenta@example.test", "contraseña");
    await h.session.logout();
    late.resolve(sessionData());
    await login;
    expect(h.session.getSnapshot().user).toBeNull();
    expect(h.status()).toBe("logged-out");
  });
  test("un cierre fallido queda visible y bloquea login y renovación", async () => {
    let fail = true;
    const request = mock(async (path: string) => {
      if (path === "/auth/logout" && fail) throw new Error("Sin conexión");
      return sessionData();
    });
    const h = harness(request);
    await h.session.login("cuenta@example.test", "contraseña");
    await h.session.logout();
    expect(h.session.getSnapshot()).toMatchObject({
      user: null,
      accessToken: null,
      logoutPending: true,
      loggingOut: false,
    });
    expect(h.session.getSnapshot().error).toContain("no se pudo revocar");
    expect(h.status()).toBe("logout-pending");
    expect(await h.session.refresh()).toBeNull();
    await expect(h.session.login("cuenta@example.test", "contraseña")).rejects.toThrow(
      "Reintenta",
    );
    fail = false;
    await h.session.logout();
    expect(h.status()).toBe("logged-out");
    expect(h.session.getSnapshot().logoutPending).toBe(false);
  });
  test("recargar tras un cierre fallido reintenta la revocación sin renovar", async () => {
    const request = mock<(path: string) => Promise<undefined>>(async () => undefined);
    const h = harness(request, "logout-pending");
    await h.session.start();
    expect(request.mock.calls[0]?.[0]).toBe("/auth/logout");
    expect(request).toHaveBeenCalledTimes(1);
    expect(h.session.getSnapshot()).toMatchObject({ ready: true, user: null });
    expect(h.status()).toBe("logged-out");
  });
  test("un cierre previo persiste después de recargar y de montar dos veces", async () => {
    const request = mock(async () => sessionData());
    const h = harness(request, "logged-out");
    await Promise.all([h.session.start(), h.session.start()]);
    expect(request).not.toHaveBeenCalled();
    expect(h.session.getSnapshot().ready).toBe(true);
  });
  test("otra pestaña invalida datos y respuestas pendientes al cerrar", async () => {
    const late = deferred<SessionData>();
    const h = harness(async (path) =>
      path === "/auth/refresh" ? late.promise : sessionData(),
    );
    await h.session.login("cuenta@example.test", "contraseña");
    const before = h.session.getGeneration();
    const refresh = h.session.refresh();
    h.change("logged-out");
    h.session.synchronize();
    late.resolve(sessionData());
    await refresh;
    expect(h.session.getSnapshot().user).toBeNull();
    expect(h.session.getGeneration()).toBeGreaterThan(before);
    expect(h.clear).toHaveBeenCalled();
  });
  test("renovar con otra cuenta o permisos invalida los datos anteriores", async () => {
    let data = sessionData();
    const h = harness(async () => data);
    await h.session.start();
    const before = h.session.getGeneration();
    data = sessionData(2, "token-b");
    await h.session.refresh();
    expect(h.session.getSnapshot().user?.id).toBe(2);
    expect(h.session.getGeneration()).toBeGreaterThan(before);
    expect(h.clear).toHaveBeenCalled();
  });
  test("una sesión expirada invalida respuestas privadas todavía pendientes", async () => {
    let valid = true;
    const h = harness(async () => {
      if (!valid) throw new Error("401");
      return sessionData();
    });
    await h.session.start();
    const before = h.session.getGeneration();
    valid = false;
    await h.session.refresh();
    expect(h.session.getSnapshot().user).toBeNull();
    expect(h.session.getGeneration()).toBeGreaterThan(before);
  });
  test("rechaza sesiones con identidad o roles malformados", async () => {
    const h = harness(
      async () =>
        ({
          accessToken: "token",
          user: { id: 1, name: "Cuenta", email: "a@b.test", roles: null },
        }) as unknown as SessionData,
    );
    await expect(h.session.login("cuenta@example.test", "contraseña")).rejects.toThrow(
      "sesión válida",
    );
    expect(h.session.getSnapshot().user).toBeNull();
  });
});
