"use server";

import { headers } from "next/headers";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

/** Result of a magic-link send attempt; consumed by `useActionState` in LoginForm. */
export interface MagicLinkState {
  ok: boolean;
  error: string | null;
  email: string | null;
}

/**
 * Server action: send a passwordless magic link to the submitted email.
 * The link redirects to `/auth/callback`, which exchanges the code, seeds
 * default habits on first login, and forwards to `/today`.
 */
export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const next = formData.get("next");
  const nextPath = typeof next === "string" && next.startsWith("/") ? next : null;

  if (!email || !email.includes("@") || email.length > 254) {
    return { ok: false, error: "Please enter a valid email address.", email };
  }

  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;

  const supabase = await createServerSupabase();
  const callback = nextPath
    ? `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
    : `${origin}/auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: callback },
  });

  if (error) {
    return { ok: false, error: error.message, email };
  }
  return { ok: true, error: null, email };
}
