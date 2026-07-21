"use client";

import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";

export function CartButton() {
  const totalItems = useCartStore((s) => s.totalItems());
  const openDrawer = useCartStore((s) => s.openDrawer);

  return (
    <button
      type="button"
      onClick={openDrawer}
      className="relative inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-950"
      aria-label="Open cart"
    >
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      {totalItems > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-lime-400 px-1.5 text-xs font-bold text-neutral-950">
          {totalItems}
        </span>
      )}
    </button>
  );
}
