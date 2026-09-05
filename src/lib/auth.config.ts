import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/roles";

/**
 * Edge-safe Auth.js config (no Prisma). Used by middleware so session
 * cookies are read correctly on HTTPS custom domains.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected =
        pathname.startsWith("/teacher") ||
        pathname.startsWith("/students") ||
        pathname.startsWith("/account");

      if (!isProtected) return true;
      return !!auth?.user;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.studentId = user.studentId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as Role) ?? "STUDENT";
        session.user.studentId = (token.studentId as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
