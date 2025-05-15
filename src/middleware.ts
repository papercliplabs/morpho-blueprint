import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // TODO: Implement auth, probably
  const { pathname } = request.nextUrl;

  if (pathname == "/") {
    return NextResponse.redirect(new URL("/earn", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|fonts|terms|privacy|favicon.ico|sitemap.xml|.*\\.mp4|.*\\.mov|.*\\.webm|.*\\.png).*)"],
};
