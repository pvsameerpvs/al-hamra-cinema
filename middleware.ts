import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/auth";

const protectedRoutes = ["/dashboard"];
const publicOnlyRoutes = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect anything under /dashboard
  const isProtected = protectedRoutes.some((p) => pathname.startsWith(p));
  const isPublicOnly = publicOnlyRoutes.some((p) => pathname.startsWith(p));

  const cookie = request.cookies.get("ah_session")?.value;
  const session = cookie ? await decrypt(cookie) : null;

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Prevent non-admins from accessing /dashboard/shows specifically
  if (pathname.startsWith("/dashboard/shows") && session?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect to dashboard if logged in and trying to access /login
  if (isPublicOnly && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
