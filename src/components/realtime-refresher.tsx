"use client";

import { useRouter } from "next/navigation";
import { useRealtime } from "@/lib/use-realtime";
import type { RealtimeEvent } from "@/lib/realtime";

/**
 * Drop into any Server Component page. Listens for the given realtime
 * events and calls `router.refresh()` so the server re-renders with fresh
 * data — used for the Dashboard, Chamados, Pendências, Retornos, Mapa and
 * the TV panel.
 */
export function RealtimeRefresher({ events }: { events: RealtimeEvent[] }) {
  const router = useRouter();
  useRealtime(events, () => router.refresh());
  return null;
}
