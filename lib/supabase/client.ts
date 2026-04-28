"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types";

/**
 * Supabase client for use inside `"use client"` components and hooks.
 * Reads/writes are gated by RLS — the anon key is safe to ship.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
