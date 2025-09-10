import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const isAuthPage = req.nextUrl.pathname.startsWith("/club-login") ||
                     req.nextUrl.pathname.startsWith("/club-register")

  const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard") ||
                          req.nextUrl.pathname.startsWith("/profile") ||
                          req.nextUrl.pathname.startsWith("/club-dashboard")

  // Redirect to login if accessing protected route without token
  if (isProtectedRoute && !token) {
  return NextResponse.redirect(new URL("/club-login", req.url))
  }

  // Redirect to dashboard if accessing auth pages with token
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/club-login",
    "/club-register",
    "/dashboard/:path*",
    "/profile/:path*",
    "/club-dashboard/:path*",
  ],
}