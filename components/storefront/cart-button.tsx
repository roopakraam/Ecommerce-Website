"use client";

import { ShoppingBag } from "lucide-react";
import { useCartHasHydrated, useCartStore } from "@/lib/store/cart";

export function CartButton({ variant = "light" }: { variant?: "light" | "dark" }) {
  const hasHydrated = useCartHasHydrated();
  const totalItems = useCartStore((s) => s.totalItems());
  const openDrawer = useCartStore((s) => s.openDrawer);
  const showCount = hasHydrated && totalItems > 0;

  const isDark = variant === "dark";
  const textColor = isDark ? "text-bone" : "text-ink";

  return (
    <button
      type="button"
      onClick={openDrawer}
      className={`relative inline-flex transition hover:opacity-60 ${textColor}`}
      aria-label="Open cart"
    >
      <ShoppingBag className="h-5 w-5" />
      {showCount && (
        <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-neon font-mono text-[10px] font-bold text-ink">
          {totalItems}
        </span>
      )}
    </button>
  );
}
