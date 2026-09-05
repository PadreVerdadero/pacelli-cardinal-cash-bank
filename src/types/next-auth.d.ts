import "next-auth";
import type { Role } from "@/lib/roles";

declare module "next-auth" {
  interface User {
    role?: Role;
    studentId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      studentId?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    studentId?: string | null;
  }
}
