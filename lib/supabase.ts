/**
 * Canonical Supabase entry point.
 *
 * For server components, route handlers, and server actions:
 *   `import { createServerSupabase } from "@/lib/supabase"`
 *
 * For client components and hooks, import the browser factory directly
 * (it lives in its own "use client" module so RSCs don't pull in client code):
 *   `import { createClient } from "@/lib/supabase/client"`
 *
 * All query helpers in `lib/{habits,trades,tasks,finances,daily}.ts` accept
 * a `SupabaseClient<Database>` so they work from either side.
 */
export { createClient as createServerSupabase } from "./supabase/server";
export type { Database } from "@/types";
