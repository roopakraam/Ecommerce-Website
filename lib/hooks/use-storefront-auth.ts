"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export interface StorefrontAuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
}

function toAuthUser(
  authUser: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null | undefined
): StorefrontAuthUser | null {
  if (!authUser) return null;
  return {
    id: authUser.id,
    email: authUser.email ?? null,
    fullName: (authUser.user_metadata?.full_name as string | undefined) ?? null,
  };
}

export function useStorefrontAuth() {
  const [user, setUser] = useState<StorefrontAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    let cancelled = false;

    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (cancelled) {
        return;
      }

      setUser(toAuthUser(authUser));
      setIsLoading(false);
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toAuthUser(session?.user));
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading, isLoggedIn: Boolean(user) };
}
