"use client";

import { useEffect } from "react";
import { getSocket } from "./socket-client";
import type { RealtimeEvent } from "./realtime";

/**
 * Subscribes to one or more realtime events broadcast by the server
 * (see src/lib/realtime.ts) and runs `onEvent` whenever any of them fire.
 * Typical usage: refetch the page's data to keep dashboards live.
 */
export function useRealtime(events: RealtimeEvent[], onEvent: () => void) {
  useEffect(() => {
    const socket = getSocket();
    const handler = () => onEvent();
    for (const event of events) socket.on(event, handler);
    return () => {
      for (const event of events) socket.off(event, handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.join(",")]);
}
