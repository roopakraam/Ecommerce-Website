import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  unitPrice: number;
  imageUrl: string | null;
  quantity: number;
  maxQuantity: number;
}

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isDrawerOpen: false,

      openDrawer: () => set({ isDrawerOpen: true }),
      closeDrawer: () => set({ isDrawerOpen: false }),

      addItem: (item) => {
        const quantity = item.quantity ?? 1;
        set((state) => {
          const existing = state.items.find(
            (cartItem) => cartItem.variantId === item.variantId
          );

          if (existing) {
            const nextQuantity = Math.min(
              existing.quantity + quantity,
              item.maxQuantity
            );

            return {
              isDrawerOpen: true,
              items: state.items.map((cartItem) =>
                cartItem.variantId === item.variantId
                  ? {
                      ...cartItem,
                      quantity: nextQuantity,
                      maxQuantity: item.maxQuantity,
                      unitPrice: item.unitPrice,
                    }
                  : cartItem
              ),
            };
          }

          return {
            isDrawerOpen: true,
            items: [
              ...state.items,
              {
                productId: item.productId,
                variantId: item.variantId,
                slug: item.slug,
                name: item.name,
                size: item.size,
                color: item.color,
                unitPrice: item.unitPrice,
                imageUrl: item.imageUrl,
                quantity: Math.min(quantity, item.maxQuantity),
                maxQuantity: item.maxQuantity,
              },
            ],
          };
        });
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
        }));
      },

      updateQuantity: (variantId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? {
                  ...item,
                  quantity: Math.min(Math.max(1, quantity), item.maxQuantity),
                }
              : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((total, item) => total + item.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (total, item) => total + item.unitPrice * item.quantity,
          0
        ),
    }),
    {
      name: "book-my-tees-cart-v2",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

/** True after persist rehydration — use to avoid SSR/client cart UI mismatches. */
export function useCartHasHydrated(): boolean {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(useCartStore.persist.hasHydrated());
    return useCartStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
  }, []);

  return hasHydrated;
}
