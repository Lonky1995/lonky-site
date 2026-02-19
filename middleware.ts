import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALE_COOKIE = "locale";

export function middleware(request: NextRequest) {
  const localeCookie = request.cookies.get(LOCALE_COOKIE);
  if (localeCookie) return NextResponse.next();

  const acceptLang = request.headers.get("accept-language") || "";
  const locale = /zh/i.test(acceptLang) ? "zh" : "en";

  const response = NextResponse.next();
  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|data).*)",
  ],
};
