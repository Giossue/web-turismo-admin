"use client";

import { useQuery } from "@tanstack/react-query";

import { getPlatformSettings, type PlatformSettings } from "@/lib/admin-api";
import { adminKeys } from "@/lib/admin-queries";

const NONE: PlatformSettings = {
  directPublishCatastros: false,
  directPublishFichas: false,
};

/** Interruptores del administrador; mientras cargan se asume que hay revisión. */
export function usePlatformSettings(token: string) {
  const query = useQuery({
    queryKey: adminKeys.platformSettings(),
    queryFn: ({ signal }) => getPlatformSettings(token, signal),
    enabled: Boolean(token),
    staleTime: 30_000,
  });
  return query.data ?? NONE;
}
