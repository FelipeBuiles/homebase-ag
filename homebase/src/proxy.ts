import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = ["/login", "/setup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    publicPaths.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (optimistic check — real validation in server components)
  const sessionCookie = request.cookies.get("homebase_session");
  const isSetup = request.cookies.get("homebase_setup");

  if (!sessionCookie) {
    // If setup hasn't been completed yet, send to /setup
    if (!isSetup) {
      return NextResponse.redirect(new URL("/setup", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
