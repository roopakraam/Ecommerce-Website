import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
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
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
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
            (cartItem) => cartItem.productId === item.productId
          );

          if (existing) {
            const nextQuantity = Math.min(
              existing.quantity + quantity,
              item.maxQuantity
            );

            return {
              isDrawerOpen: true,
              items: state.items.map((cartItem) =>
                cartItem.productId === item.productId
                  ? { ...cartItem, quantity: nextQuantity }
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
                slug: item.slug,
                name: item.name,
                unitPrice: item.unitPrice,
                imageUrl: item.imageUrl,
                quantity: Math.min(quantity, item.maxQuantity),
                maxQuantity: item.maxQuantity,
              },
            ],
          };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
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
      name: "book-my-tees-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
