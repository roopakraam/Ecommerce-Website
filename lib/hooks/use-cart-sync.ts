"use client";

import { useEffect, useRef } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useCartHasHydrated, useCartStore, type CartItem } from "@/lib/store/cart";

const SYNC_DEBOUNCE_MS = 500;
/** Shared across tabs — in-memory alone cannot prevent cross-tab re-merge. */
const SYNC_FLAG_KEY = "book-my-tees-cart-synced-uid";

let memorySyncedUserId: string | null = null;
let syncInFlight: Promise<void> | null = null;

function readSyncedUserId(): string | null {
  try {
    // localStorage is cross-tab source of truth (null = cleared / never set).
    return localStorage.getItem(SYNC_FLAG_KEY);
  } catch {
    return memorySyncedUserId;
  }
}

function writeSyncedUserId(userId: string | null) {
  memorySyncedUserId = userId;
  try {
    if (userId) {
      localStorage.setItem(SYNC_FLAG_KEY, userId);
    } else {
      localStorage.removeItem(SYNC_FLAG_KEY);
    }
  } catch {
    // ignore quota / private mode
  }
}

function toSyncPayload(items: CartItem[]) {
  return items.map((item) => ({
    variantId: item.variantId,
    quantity: item.quantity,
  }));
}

async function fetchServerCart(): Promise<CartItem[] | null> {
  const response = await fetch("/api/cart");
  if (!response.ok) {
    console.error("Cart fetch failed:", await response.text());
    return null;
  }
  const data = (await response.json()) as { items?: CartItem[] };
  return data.items ?? null;
}

async function mergeCartOnLogin(localItems: CartItem[]): Promise<CartItem[] | null> {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: toSyncPayload(localItems) }),
  });

  if (!response.ok) {
    console.error("Cart merge failed:", await response.text());
    return null;
  }

  const data = (await response.json()) as { items?: CartItem[] };
  return data.items ?? null;
}

async function replaceServerCart(items: CartItem[]): Promise<CartItem[] | null> {
  const response = await fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: toSyncPayload(items) }),
  });

  if (!response.ok) {
    console.error("Cart sync failed:", await response.text());
    return null;
  }

  const data = (await response.json()) as { items?: CartItem[] };
  return data.items ?? null;
}

/** Clear persisted server cart after successful payment (authenticated only). */
export async function clearServerCart(): Promise<void> {
  try {
    const response = await fetch("/api/cart", { method: "DELETE" });
    if (!response.ok && response.status !== 401) {
      console.error("Failed to clear server cart:", await response.text());
    }
  } catch (error) {
    console.error("Failed to clear server cart:", error);
  }
}

/**
 * Guest cart stays in localStorage.
 * - First login for a user (no shared sync flag): merge local → server once
 * - Already synced (flag in localStorage, including other tabs): LOAD server only
 * - Never re-merge on tab focus / new tab / token refresh
 */
export function useCartSync() {
  const hasHydrated = useCartHasHydrated();
  const setItems = useCartStore((s) => s.setItems);
  const items = useCartStore((s) => s.items);

  const isLoggedIn = useRef(false);
  const readyForSync = useRef(false);
  const skipNextSync = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasHydrated) return;

    const supabase = createBrowserClient();
    let cancelled = false;

    async function applyFromServer(nextItems: CartItem[] | null) {
      if (cancelled || nextItems == null) return;
      skipNextSync.current = true;
      setItems(nextItems);
    }

    async function loadServerCartOnly(userId: string) {
      const serverItems = await fetchServerCart();
      if (cancelled) return;
      if (serverItems == null) {
        // Do not mark synced on failure — avoids wiping server with stale local PUT
        readyForSync.current = false;
        return;
      }
      await applyFromServer(serverItems);
      writeSyncedUserId(userId);
      readyForSync.current = true;
    }

    async function mergeOnceFromGuest(userId: string) {
      const localItems = useCartStore.getState().items;
      const merged = await mergeCartOnLogin(localItems);
      if (cancelled) return;
      if (merged == null) {
        readyForSync.current = false;
        return;
      }
      await applyFromServer(merged);
      writeSyncedUserId(userId);
      readyForSync.current = true;
    }

    async function handleSession(event: string, userId: string) {
      isLoggedIn.current = true;
      const alreadySynced = readSyncedUserId() === userId;

      if (alreadySynced) {
        // Same tab already warm — don't refetch on every token refresh.
        if (memorySyncedUserId === userId && readyForSync.current) {
          return;
        }
        // New tab (or cold remount): load server, never merge.
        memorySyncedUserId = userId;
        await loadServerCartOnly(userId);
        return;
      }

      // First sync for this user in this browser: merge guest local into server.
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        await mergeOnceFromGuest(userId);
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      void (async () => {
        if (cancelled) return;

        if (!session?.user) {
          isLoggedIn.current = false;
          readyForSync.current = false;
          writeSyncedUserId(null);
          return;
        }

        if (event !== "SIGNED_IN" && event !== "INITIAL_SESSION") {
          return;
        }

        const userId = session.user.id;
        const run = async () => {
          await handleSession(event, userId);
        };

        // Serialize concurrent SIGNED_IN + INITIAL_SESSION (common on new tabs).
        if (syncInFlight) {
          await syncInFlight;
          if (cancelled) return;
          // After the first handler, flag should be set → load only.
          if (readSyncedUserId() === userId) {
            await loadServerCartOnly(userId);
            return;
          }
        }

        syncInFlight = run().finally(() => {
          syncInFlight = null;
        });
        await syncInFlight;
      })();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [hasHydrated, setItems]);

  useEffect(() => {
    if (!hasHydrated || !isLoggedIn.current || !readyForSync.current) return;

    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      if (!isLoggedIn.current) return;

      void (async () => {
        const current = useCartStore.getState().items;
        const synced = await replaceServerCart(current);
        if (!synced) return;

        const unchanged =
          synced.length === current.length &&
          synced.every(
            (item, index) =>
              item.variantId === current[index]?.variantId &&
              item.quantity === current[index]?.quantity &&
              item.unitPrice === current[index]?.unitPrice &&
              item.maxQuantity === current[index]?.maxQuantity
          );

        if (!unchanged) {
          skipNextSync.current = true;
          setItems(synced);
        }
      })();
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [hasHydrated, items, setItems]);
}
