"use client";

import { useEffect, useRef } from "react";
import { clearServerCart } from "@/lib/hooks/use-cart-sync";
import { useCartStore } from "@/lib/store/cart";

export function ClearCartOnMount() {
  const clearCart = useCartStore((s) => s.clearCart);
  const cleared = useRef(false);

  useEffect(() => {
    if (!cleared.current) {
      cleared.current = true;
      clearCart();
      void clearServerCart();
    }
  }, [clearCart]);

  return null;
}
