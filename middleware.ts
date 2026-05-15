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
  "/users",
  "/settings",
  "/audit-logs",
  "/search",
  "/projects",
] as const;

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

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
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
    "/users/:path*",
    "/settings/:path*",
    "/audit-logs/:path*",
    "/search/:path*",
    "/projects/:path*",
  ],
};
