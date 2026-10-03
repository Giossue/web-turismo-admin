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

  return navigationNotificationFlags(query.data, seen);
}
