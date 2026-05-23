import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  // Skip: auth API, Next.js internals, files with extensions (public assets), auth pages
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register|.*\\..*).*)",
  ],
};
