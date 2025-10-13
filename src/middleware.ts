import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  // Check if accessing the sign-up page
  if (request.nextUrl.pathname === "/sign-up") {
    // Check for authentication cookie
    const authToken = request.cookies.get("signup-auth");

    if (!authToken || authToken.value !== "authenticated") {
      // Redirect to home page if not authenticated
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/sign-up",
};
