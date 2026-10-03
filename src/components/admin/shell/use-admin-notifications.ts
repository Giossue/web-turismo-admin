"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useSyncExternalStore } from "react";

import { notificationSections, type NotificationSection } from "@/lib/admin-api";
import {
  createNavigationReadStore,
  navigationNotificationFlags,
  parseNavigationReadMarkers,
} from "@/lib/admin-notifications";
import { navigationSummaryQueryOptions } from "@/lib/admin-queries";
import type { AdminSection } from "./sections";

/** Solo estas secciones muestran el aviso en el sidebar. */
const BADGE_SECTIONS: NotificationSection[] = ["review", "opinions"];

export function useAdminNotifications(
  token: string,
  userId: number,
  section: AdminSection,
) {
  const query = useQuery(navigationSummaryQueryOptions(token, userId));
  const store = useMemo(() => createNavigationReadStore(userId), [userId]);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const seen = useMemo(() => parseNavigationReadMarkers(snapshot), [snapshot]);

  useEffect(() => {
    if (
      !query.isSuccess ||
      !notificationSections.includes(section as NotificationSection)
    ) {
      return;
    }
    const key = section as NotificationSection;
    store.markSeen(key, query.data[key]?.latestChange ?? null);
  }, [query.data, query.isSuccess, section, store]);

  const flags = navigationNotificationFlags(query.data, seen);
  return Object.fromEntries(
    BADGE_SECTIONS.map((key) => [key, flags[key] ?? false]),
  ) as Partial<Record<NotificationSection, boolean>>;
}
