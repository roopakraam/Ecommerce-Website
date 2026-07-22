"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useStorefrontAuth } from "@/lib/hooks/use-storefront-auth";
import { useCartHasHydrated, useCartStore } from "@/lib/store/cart";

export function CartButton() {
  const pathname = usePathname();
  const { isLoggedIn, isLoading } = useStorefrontAuth();
  const hasHydrated = useCartHasHydrated();
  const totalItems = useCartStore((s) => s.totalItems());
  const openDrawer = useCartStore((s) => s.openDrawer);
  const showCount = isLoggedIn && hasHydrated && totalItems > 0;
  const loginHref = `/login?next=${encodeURIComponent(pathname || "/products")}`;

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-400">
        <ShoppingBag className="h-4 w-4" />
        <span className="hidden sm:inline">Cart</span>
      </span>
    );
  }

  if (!isLoggedIn) {
    return (
      <Link
        href={loginHref}
        className="relative inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-950"
        aria-label="Sign in to open cart"
      >
        <ShoppingBag className="h-4 w-4" />
        <span className="hidden sm:inline">Cart</span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="relative inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-950"
      aria-label="Open cart"
    >
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      {showCount && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-400 px-1.5 text-xs font-bold text-neutral-950">
          {totalItems}
        </span>
      )}
    </button>
  );
}
