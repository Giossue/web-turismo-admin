import type { SessionStatus } from "./admin-session";
export const SESSION_STATUS_KEY = "turismo-admin-session-status";
const CHANNEL_NAME = "turismo-admin-session";
const sourceId = crypto.randomUUID();
let memoryStatus: SessionStatus | null = null;
function validStatus(value: unknown): value is SessionStatus {
  return value === "active" || value === "logged-out" || value === "logout-pending";
}
/** Solo se persiste la intención de cierre; nunca identidad, tokens ni contenido. */
export function readSessionStatus(): SessionStatus | null {
  if (typeof window === "undefined") return null;
  try {
    const status = window.localStorage.getItem(SESSION_STATUS_KEY);
    memoryStatus = validStatus(status) ? status : null;
  } catch {
    // Sin persistencia, una recarga exige un login explícito: no puede restaurar un cierre fallido.
    return memoryStatus ?? "logged-out";
  }
  return memoryStatus;
}
export function writeSessionStatus(status: SessionStatus) {
  memoryStatus = status;
  try {
    window.localStorage.setItem(SESSION_STATUS_KEY, status);
  } catch {}
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ status, source: sourceId });
    channel.close();
  }
}
export async function withSessionLock<T>(
  signal: AbortSignal,
  operation: () => Promise<T>,
): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  signal.throwIfAborted();
  if (!locks) return operation();
  return locks.request(CHANNEL_NAME, { signal }, () => {
    signal.throwIfAborted();
    return operation();
  });
}
export function subscribeSessionChanges(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_STATUS_KEY) onChange();
  };
  const channel =
    typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANNEL_NAME) : null;
  if (!channel) window.addEventListener("storage", onStorage);
  if (channel)
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const data = event.data;
      if (!data || typeof data !== "object" || !("status" in data) || !("source" in data))
        return;
      if (data.source === sourceId || !validStatus(data.status)) return;
      memoryStatus = data.status;
      onChange();
    };
  return () => {
    window.removeEventListener("storage", onStorage);
    channel?.close();
  };
}
