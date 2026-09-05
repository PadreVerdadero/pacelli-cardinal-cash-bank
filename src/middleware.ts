import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = req.auth?.user?.role;

  // Logged-in users should not stay on the login page.
  if (pathname === "/login" && req.auth) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Students cannot use staff tools.
  if (pathname.startsWith("/teacher") && role === "STUDENT") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/teacher",
    "/teacher/:path*",
    "/students/:path*",
    "/account",
    "/account/:path*",
    "/login",
  ],
};
