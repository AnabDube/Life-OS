import { NextResponse, type NextRequest } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { seedDefaultHabits } from "@/lib/seed";

/**
 * Magic-link callback. Supabase emails a link of the form
 *   `<origin>/auth/callback?code=<code>&next=<path>`
 *
 * We exchange the code for a session, seed default habits if it's the user's
 * first sign-in, then forward to `next` (defaulting to /today).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") ? nextParam : "/today";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?error=exchange_failed", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    try {
      await seedDefaultHabits(supabase, user.id);
    } catch {
      // Don't block sign-in if seeding fails — the Deen module can re-run it.
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
