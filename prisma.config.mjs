import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // O valor padrão só existe para permitir `prisma generate` sem banco (ex.: durante o build).
  datasource: { url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/cco" },
});
