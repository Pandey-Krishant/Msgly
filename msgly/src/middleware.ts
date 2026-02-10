// src/middleware.ts
import { NextResponse } from "next/server"
import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { nextUrl } = req

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  const isPublicRoute = ["/", "/login", "/register", "/unauth"].includes(nextUrl.pathname)

  // Default welcome page for unauthenticated users
  if (!isLoggedIn && !isPublicRoute && !isApiAuthRoute) {
    return NextResponse.redirect(new URL("/unauth", nextUrl))
  }

  return NextResponse.next()
})

// Ye define karta hai ki middleware kin paths par chalega
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
