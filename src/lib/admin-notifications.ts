import {
  notificationSections,
  type AdminNavigationSummary,
  type NotificationSection,
} from "./admin-api";

export type NavigationReadMarkers = Partial<Record<NotificationSection, number>>;

export function parseNavigationReadMarkers(raw: string): NavigationReadMarkers {
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return {};
    const markers: NavigationReadMarkers = {};
    for (const section of notificationSections) {
      const timestamp = (value as Record<string, unknown>)[section];
      if (typeof timestamp === "number" && Number.isFinite(timestamp) && timestamp >= 0) {
        markers[section] = timestamp;
      }
    }
    return markers;
  } catch {
    return {};
  }
}

export function navigationNotificationFlags(
  summary: AdminNavigationSummary | undefined,
  seen: NavigationReadMarkers,
): Partial<Record<NotificationSection, boolean>> {
  if (!summary) return {};
  return Object.fromEntries(
    notificationSections.map((section) => {
      const signal = summary[section];
      const changedAt = signal?.latestChange ? Date.parse(signal.latestChange) : NaN;
      return [section, (signal?.pending ?? 0) > 0 || changedAt > (seen[section] ?? 0)];
    }),
  );
}

/** Only read timestamps are persisted; session credentials remain in memory/HttpOnly. */
const memorySnapshots = new Map<string, string>();
const readEvent = "turismo-admin-navigation-read";
const emptySnapshot = "{}";

export function createNavigationReadStore(userId: number) {
  const key = `turismo-admin:sidebar-seen:v1:${userId}`;
  const readStorage = () => {
    try {
      return window.localStorage.getItem(key) ?? emptySnapshot;
    } catch {
      return emptySnapshot;
    }
  };
  const getSnapshot = () => {
    if (!memorySnapshots.has(key)) memorySnapshots.set(key, readStorage());
    return memorySnapshots.get(key)!;
  };

  return {
    getSnapshot,
    getServerSnapshot: () => emptySnapshot,
    subscribe(listener: () => void) {
      const onStorage = (event: StorageEvent) => {
        if (event.key !== key && event.key !== null) return;
        memorySnapshots.set(key, readStorage());
        listener();
      };
      const onRead = (event: Event) => {
        if ((event as CustomEvent<string>).detail === key) listener();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(readEvent, onRead);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(readEvent, onRead);
      };
    },
    markSeen(section: NotificationSection, latestChange: string | null) {
      if (!latestChange) return;
      const changedAt = Date.parse(latestChange);
      const seen = parseNavigationReadMarkers(getSnapshot());
      if (!(changedAt > (seen[section] ?? 0))) return;
      const snapshot = JSON.stringify({ ...seen, [section]: changedAt });
      memorySnapshots.set(key, snapshot);
      try {
        window.localStorage.setItem(key, snapshot);
      } catch {
        // Private mode or full storage still keeps the read mark for this session.
      }
      window.dispatchEvent(new CustomEvent(readEvent, { detail: key }));
    },
  };
}
