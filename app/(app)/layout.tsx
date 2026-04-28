import { redirect } from "next/navigation";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import Sidebar from "@/components/ui/Sidebar";
import TopBar from "@/components/ui/TopBar";
import BottomNav from "@/components/ui/BottomNav";

/**
 * Authenticated app shell.
 *
 * Routes inside the `(app)` route group inherit this layout — sidebar on
 * desktop, top bar + bottom nav on mobile. Login and the auth callback live
 * outside the group, so they render with no shell.
 *
 * The proxy (`proxy.ts`) already gates these routes; the redirect here is a
 * defensive belt-and-braces in case the proxy is ever skipped.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const firstName =
    profile?.name?.split(" ")[0] ?? user.email?.split("@")[0] ?? null;

  return (
    <div className="relative z-[1] min-h-[100dvh] md:flex">
      <Sidebar profile={profile ?? null} email={user.email ?? null} />
      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
        <TopBar name={firstName} />
        <main className="flex-1 pb-24 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
