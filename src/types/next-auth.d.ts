import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: "teacher" | "admin_officer";
    } & DefaultSession["user"];
  }

  interface User {
    role?: "teacher" | "admin_officer";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "teacher" | "admin_officer";
  }
}
