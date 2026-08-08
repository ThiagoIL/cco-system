"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | undefined;

/** Lazily creates a single shared socket.io connection for the whole tab. */
export function getSocket(): Socket {
  if (!socket) {
    socket = io({ path: "/socket.io", transports: ["websocket", "polling"] });
  }
  return socket;
}
