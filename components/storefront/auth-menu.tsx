"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut, UserRound } from "lucide-react";
import { useStorefrontAuth } from "@/lib/hooks/use-storefront-auth";
import { createBrowserClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cart";

export function AuthMenu() {
  const router = useRouter();
  const { user, isLoading } = useStorefrontAuth();
  const clearCart = useCartStore((s) => s.clearCart);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    clearCart();
    closeDrawer();
    router.refresh();
    setIsSigningOut(false);
  }

  if (isLoading) {
    return (
      <span className="hidden h-4 w-14 animate-pulse rounded bg-neutral-200 sm:inline-block" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-950"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-lime-400 hover:text-neutral-950 sm:text-sm sm:px-3.5 sm:py-2"
        >
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden max-w-[10rem] truncate text-sm text-neutral-500 sm:inline">
        <UserRound className="mr-1 inline h-3.5 w-3.5" />
        {user.email}
      </span>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        disabled={isSigningOut}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-950 disabled:opacity-60"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">
          {isSigningOut ? "Signing out..." : "Sign out"}
        </span>
      </button>
    </div>
  );
}
