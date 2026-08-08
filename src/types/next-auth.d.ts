import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role: "ADMIN" | "SUPERVISOR" | "TECNICO";
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "SUPERVISOR" | "TECNICO";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "SUPERVISOR" | "TECNICO";
  }
}
