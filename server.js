// Custom Next.js server (required to attach Socket.io for realtime updates).
// NOTE: because a custom server is used, production deploys must NOT use
// Next's `output: "standalone"` — see next.config.ts and Dockerfile.
// A operação é em horário de Brasília. Containers rodam em UTC por padrão, o que
// deslocaria em 3h os horários digitados e o limite de "hoje" — fixamos o fuso
// antes de qualquer uso de Date.
process.env.TZ = process.env.TZ || "America/Sao_Paulo";

const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const port = parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, { path: "/socket.io" });

  // Shared across the process so Server Actions / Route Handlers can
  // broadcast "data changed" events after a mutation (see src/lib/realtime.ts).
  global.io = io;

  io.on("connection", () => {
    // Clients only listen for broadcast events; nothing to handle inbound.
  });

  httpServer.listen(port, () => {
    console.log(
      `> CCO RCOND/REDETEL rodando em http://${hostname}:${port} (${
        dev ? "development" : process.env.NODE_ENV
      })`
    );
  });
});
