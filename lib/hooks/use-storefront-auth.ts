"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

export interface StorefrontAuthUser {
  id: string;
  email: string | null;
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

      setUser(
        authUser
          ? { id: authUser.id, email: authUser.email ?? null }
          : null
      );
      setIsLoading(false);
    }

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(
        session?.user
          ? { id: session.user.id, email: session.user.email ?? null }
          : null
      );
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading, isLoggedIn: Boolean(user) };
}
