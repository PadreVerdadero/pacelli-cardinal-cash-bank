import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const staffPrefixes = ["/teacher"];

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const { pathname } = request.nextUrl;
  const isStaffRoute = staffPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!token) {
    if (pathname === "/login") return NextResponse.next();
    if (isStaffRoute || pathname.startsWith("/students/")) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  const role = String(token.role ?? "");

  if (isStaffRoute && role === "STUDENT") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/teacher/:path*", "/login", "/students/:path*"],
};
