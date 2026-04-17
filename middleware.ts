import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = (req.nextauth.token as any)?.role as string | undefined;

    // Admin route: ADMIN role only
    if (pathname.startsWith("/secure-admin-portal-9x7k2") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Vendor dashboard: VENDOR role only (login/register are public — handled by authorized below)
    if (
      pathname.startsWith("/vendor") &&
      !pathname.startsWith("/vendor/login") &&
      !pathname.startsWith("/vendor/register") &&
      role !== "VENDOR"
    ) {
      return NextResponse.redirect(new URL("/vendor/login", req.url));
    }

    // Admin API: ADMIN role only
    if (pathname.startsWith("/api/admin") && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Vendor API: VENDOR role only
    if (pathname.startsWith("/api/vendor") && role !== "VENDOR") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;
        // These paths are always publicly accessible
        if (
          pathname.startsWith("/vendor/login") ||
          pathname.startsWith("/vendor/register")
        ) {
          return true;
        }
        // All other matched paths require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/secure-admin-portal-9x7k2/:path*",
    "/checkout/:path*",
    "/user/:path*",
    "/vendor/:path*",
    "/api/admin/:path*",
    "/api/vendor/:path*",
  ],
};
