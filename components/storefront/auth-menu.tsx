"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { LogOut, Package, UserRound } from "lucide-react";
import { useStorefrontAuth } from "@/lib/hooks/use-storefront-auth";
import { createBrowserClient } from "@/lib/supabase/client";
import { useCartStore } from "@/lib/store/cart";
import { useAuthModalStore } from "@/lib/store/auth-modal";

export function AuthMenu({ variant = "light" }: { variant?: "light" | "dark" }) {
  const router = useRouter();
  const { user, isLoading } = useStorefrontAuth();
  const clearCart = useCartStore((s) => s.clearCart);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const openAuthModal = useAuthModalStore((s) => s.open);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDark = variant === "dark";
  const textColor = isDark ? "text-bone" : "text-ink";
  const pulseColor = isDark ? "bg-bone/10" : "bg-ink/10";

  function openMenu() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setIsMenuOpen(true);
  }

  function scheduleCloseMenu() {
    closeTimer.current = setTimeout(() => setIsMenuOpen(false), 150);
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    clearCart();
    closeDrawer();
    setIsMenuOpen(false);
    router.refresh();
    setIsSigningOut(false);
  }

  if (isLoading) {
    return (
      <span className={`hidden h-5 w-5 animate-pulse rounded-full sm:inline-block ${pulseColor}`} />
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => openAuthModal("login")}
        className={`transition hover:opacity-60 ${textColor}`}
        aria-label="Sign in"
      >
        <UserRound className="h-5 w-5" />
      </button>
    );
  }

  const displayName = user.fullName?.trim() || user.email || "Your account";

  return (
    <DropdownMenuPrimitive.Root open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
      <span
        onMouseEnter={openMenu}
        onMouseLeave={scheduleCloseMenu}
        className="inline-flex"
      >
        <DropdownMenuPrimitive.Trigger asChild>
          <button
            type="button"
            className={`flex items-center transition hover:opacity-60 ${textColor}`}
            aria-label="Account menu"
          >
            <UserRound className="h-5 w-5" />
          </button>
        </DropdownMenuPrimitive.Trigger>

        <DropdownMenuPrimitive.Portal>
          <DropdownMenuPrimitive.Content
            align="end"
            sideOffset={12}
            onMouseEnter={openMenu}
            onMouseLeave={scheduleCloseMenu}
            onCloseAutoFocus={(event) => event.preventDefault()}
            className="z-[100] w-64 overflow-hidden rounded-2xl border border-bone/10 bg-surface shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          >
            <div className="border-b border-bone/10 px-4 py-3.5">
              <p className="truncate text-sm font-semibold text-bone">{displayName}</p>
              {user.email && (
                <p className="mt-0.5 truncate font-mono text-xs text-dust">{user.email}</p>
              )}
            </div>

            <div className="py-1.5">
              <DropdownMenuPrimitive.Item asChild>
                <Link
                  href="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-bone/80 outline-none transition hover:bg-surface2 hover:text-bone focus:bg-surface2 focus:text-bone"
                >
                  <UserRound className="h-4 w-4 text-dust" />
                  Account
                </Link>
              </DropdownMenuPrimitive.Item>
              <DropdownMenuPrimitive.Item asChild>
                <Link
                  href="/account/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-bone/80 outline-none transition hover:bg-surface2 hover:text-bone focus:bg-surface2 focus:text-bone"
                >
                  <Package className="h-4 w-4 text-dust" />
                  Orders
                </Link>
              </DropdownMenuPrimitive.Item>
              <DropdownMenuPrimitive.Item
                onSelect={() => void handleSignOut()}
                disabled={isSigningOut}
                className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm text-bone/80 outline-none transition hover:bg-surface2 hover:text-bone focus:bg-surface2 focus:text-bone data-[disabled]:opacity-50"
              >
                <LogOut className="h-4 w-4 text-dust" />
                {isSigningOut ? "Signing out…" : "Logout"}
              </DropdownMenuPrimitive.Item>
            </div>
          </DropdownMenuPrimitive.Content>
        </DropdownMenuPrimitive.Portal>
      </span>
    </DropdownMenuPrimitive.Root>
  );
}
