import type { Server as IOServer } from "socket.io";

// The Socket.io server instance is created once in server.js (the custom
// Node server) and attached to `global`. Because this app always runs as a
// single long-lived Node process (never as serverless functions), any
// Server Action or Route Handler running in the same process can reach it
// here to broadcast a "something changed, please refresh" event.
const globalForIO = globalThis as unknown as { io?: IOServer };

/** Canonical set of events the dashboards/TV panel listen for. */
export type RealtimeEvent =
  | "chamados:changed"
  | "colaboradores:changed"
  | "viaturas:changed"
  | "pendencias:changed"
  | "retornos:changed";

export function emitRealtime(event: RealtimeEvent) {
  globalForIO.io?.emit(event);
}
