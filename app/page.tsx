import { redirect } from "next/navigation";

/**
 * Root entry point. Authenticated users are sent to /today; unauthenticated
 * users never reach this — `proxy.ts` redirects them to /login first.
 */
export default function Home() {
  redirect("/today");
}
