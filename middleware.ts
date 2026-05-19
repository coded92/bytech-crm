import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/leads",
  "/quotations",
  "/customers",
  "/tasks",
  "/reports",
  "/payments",
  "/expenses",
  "/notifications",
  "/deployments",
  "/support",
  "/assets",
  "/field-jobs",
  "/inventory",
  "/suppliers",
  "/restocking",
  "/team",
  "/team-management",
  "/users",
  "/settings",
  "/audit-logs",
  "/search",
  "/projects",
] as const;

const BYTECH_SESSION_COOKIE = "bytech_session_id";

const landingPageRoutes: Record<string, string> = {
  dashboard: "/dashboard",
  leads: "/leads",
  customers: "/customers",
  projects: "/projects",
  "field-jobs": "/field-jobs",
  support: "/support",
  inventory: "/inventory",
  payments: "/payments",
  reports: "/reports",
};

const landingPageModules: Record<string, string[]> = {
  leads: ["leads"],
  customers: ["customers"],
  projects: ["projects"],
  "field-jobs": ["field_jobs", "field-jobs"],
  support: ["support"],
  inventory: ["inventory"],
  payments: ["payments", "invoices"],
  reports: ["reports"],
};

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname.startsWith("/login");
  const isProtectedRoute = protectedPrefixes.some((path) =>
    pathname.startsWith(path)
  );

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isProtectedRoute) {
    const sessionCookie = request.cookies.get(BYTECH_SESSION_COOKIE)?.value;

    if (sessionCookie) {
      const sessionIdentifier = await hashSessionIdentifier(sessionCookie);
      const { data: activeSession, error: activeSessionError } = await supabase
        .from("user_active_sessions" as any)
        .select("status")
        .eq("user_id", user.id)
        .eq("session_identifier", sessionIdentifier)
        .maybeSingle();

      if (
        !activeSessionError &&
        activeSession &&
        ["revoked", "signed_out", "expired"].includes(
          String((activeSession as { status?: string }).status)
        )
      ) {
        await supabase.auth.signOut();

        const url = request.nextUrl.clone();
        url.pathname = "/login";

        const redirectResponse = NextResponse.redirect(url);
        redirectResponse.cookies.delete(BYTECH_SESSION_COOKIE);

        return redirectResponse;
      }
    }
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    const [{ data: profile }, { data: preferences }] = await Promise.all([
      supabase
        .from("profiles")
        .select("role, allowed_modules")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_preferences")
        .select("default_landing_page")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const landingPage =
      typeof preferences?.default_landing_page === "string"
        ? preferences.default_landing_page
        : "dashboard";
    const candidatePath = landingPageRoutes[landingPage] ?? "/dashboard";
    const requiredModules = landingPageModules[landingPage] ?? [];
    const allowedModules = Array.isArray(profile?.allowed_modules)
      ? profile.allowed_modules
      : [];
    const canAccess =
      profile?.role === "admin" ||
      landingPage === "dashboard" ||
      requiredModules.some((moduleName) => allowedModules.includes(moduleName));

    url.pathname = canAccess ? candidatePath : "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

async function hashSessionIdentifier(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 48);
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/leads/:path*",
    "/quotations/:path*",
    "/customers/:path*",
    "/customers/new",
    "/tasks/:path*",
    "/reports/:path*",
    "/payments/:path*",
    "/expenses/:path*",
    "/notifications/:path*",
    "/deployments/:path*",
    "/support/:path*",
    "/assets/:path*",
    "/field-jobs/:path*",
    "/inventory/:path*",
    "/suppliers/:path*",
    "/restocking/:path*",
    "/team/:path*",
    "/team-management/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/audit-logs/:path*",
    "/search/:path*",
    "/projects/:path*",
  ],
};
