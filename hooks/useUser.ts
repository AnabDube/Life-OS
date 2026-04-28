"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";

export interface UseUserResult {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

const INITIAL: UseUserResult = { user: null, profile: null, loading: true };

/**
 * Subscribes to Supabase auth state and exposes the typed user + profile.
 * Re-runs on sign-in / sign-out events. Safe to use in any client component.
 */
export function useUser(): UseUserResult {
  const [state, setState] = useState<UseUserResult>(INITIAL);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function loadProfile(user: User | null) {
      if (!user) {
        if (!cancelled) setState({ user: null, profile: null, loading: false });
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setState({
        user,
        profile: error ? null : (data ?? null),
        loading: false,
      });
    }

    supabase.auth.getUser().then(({ data }) => {
      void loadProfile(data.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
