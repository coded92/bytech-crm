import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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
  const isDashboardRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/leads") ||
    pathname.startsWith("/quotations") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/notifications");
    pathname.startsWith("/deployments")
    pathname.startsWith("/support")
    pathname.startsWith("/users");

  if (!user && isDashboardRoute) {
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
    "/tasks/:path*",
    "/reports/:path*",
    "/payments/:path*",
    "/expenses/:path*",
    "/notifications/:path*",
    "/deployments/:path*",
    "/support/:path*",
    "/users/:path*",
  ],
};
