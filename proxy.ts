import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types";

/**
 * Routes that should be reachable without an active session.
 * Anything else triggers a redirect to /login.
 */
const PUBLIC_ROUTES = ["/login", "/auth/callback"];

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/**
 * Next 16 renamed `middleware.ts` → `proxy.ts` and the exported function from
 * `middleware` → `proxy`. We use it for two things:
 *   1. Refresh Supabase auth cookies on every request (required by @supabase/ssr).
 *   2. Gate access — unauthenticated users are bounced to /login; authenticated
 *      users hitting /login are sent to /today.
 *
 * IMPORTANT (per @supabase/ssr): do not run code between `createServerClient`
 * and `supabase.auth.getUser()` — token refresh happens during getUser and the
 * Set-Cookie headers must reach the browser via the response we return.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const publicRoute = isPublic(pathname);

  if (!user && !publicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    const todayUrl = request.nextUrl.clone();
    todayUrl.pathname = "/today";
    todayUrl.search = "";
    return NextResponse.redirect(todayUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on every route except internal Next assets and static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|woff|woff2|ttf)$).*)",
  ],
};
