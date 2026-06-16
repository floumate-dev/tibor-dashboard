import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Single-tenant deployments (e.g. Tibor's own Vercel project) set
  // TENANT_HOME_REDIRECT so the bare domain lands straight on that tenant's
  // dashboard with a clean edge 307, instead of the multi-tenant login.
  const tenantHome = process.env.TENANT_HOME_REDIRECT;
  if (tenantHome && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = tenantHome;
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow webhook + webinar funnel endpoints without auth (webinar dashboard is
  // PIN-gated client-side, same model as /sales).
  if (
    request.nextUrl.pathname.startsWith("/api/webhooks") ||
    request.nextUrl.pathname.startsWith("/api/webinar")
  ) {
    return supabaseResponse;
  }

  // Sales dashboards are PIN-gated (client-side), not Supabase-authed
  if (request.nextUrl.pathname.startsWith("/sales")) {
    return supabaseResponse;
  }

  // Redirect unauthenticated users to login
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    request.nextUrl.pathname !== "/"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
