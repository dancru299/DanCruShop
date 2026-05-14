import type { JwtPayload } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

function getRedirectResponse(url: URL, sessionResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);

  sessionResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    redirectResponse.cookies.set(name, value, options);
  });

  return redirectResponse;
}

function getLoginUrl(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("next", nextPath);

  return loginUrl;
}

function hasAdminRole(claims: JwtPayload | null) {
  if (!claims) {
    return false;
  }

  const appRole = claims.app_metadata?.role;
  const appRoles = claims.app_metadata?.roles;
  const userRole = claims.user_metadata?.role;

  return (
    claims.role === "admin" ||
    appRole === "admin" ||
    userRole === "admin" ||
    (Array.isArray(appRoles) && appRoles.includes("admin"))
  );
}

export async function middleware(request: NextRequest) {
  const { claims, response } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(claims?.sub);

  if (pathname.startsWith("/dashboard") && !isAuthenticated) {
    return getRedirectResponse(getLoginUrl(request), response);
  }

  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      return getRedirectResponse(getLoginUrl(request), response);
    }

    if (!hasAdminRole(claims)) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";

      return getRedirectResponse(homeUrl, response);
    }
  }

  if (pathname === "/login" && isAuthenticated) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";

    return getRedirectResponse(dashboardUrl, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)",
  ],
};
