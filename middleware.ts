import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Redirect authenticated users away from auth pages
    if (token && (pathname === "/login" || pathname === "/")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;

        // Public routes
        if (
          pathname === "/" ||
          pathname === "/login" ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/webhooks")
        ) {
          return true;
        }

        // Protected routes require auth
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts|images).*)",
  ],
};
