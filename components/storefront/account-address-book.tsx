"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Trash2 } from "lucide-react";
import {
  deleteAccountAddressAction,
  setDefaultAccountAddressAction,
} from "@/lib/actions/account";
import type { Address } from "@/types";

interface AccountAddressBookProps {
  addresses: Address[];
}

export function AccountAddressBook({ addresses }: AccountAddressBookProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function runAction(
    addressId: string,
    action: (input: { addressId: string }) => Promise<
      { success: true } | { success: false; error: string }
    >
  ) {
    setError(null);
    setPendingId(addressId);

    startTransition(async () => {
      const result = await action({ addressId });
      setPendingId(null);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-bone/10 bg-surface p-5 sm:p-6">
      <h2 className="font-display text-xl uppercase tracking-tight text-bone">
        Saved addresses
      </h2>
      <p className="mt-1 text-sm text-dust">
        Addresses saved at checkout. Set a default or remove ones you no longer use.
      </p>

      {addresses.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-bone/15 px-5 py-8 text-center">
          <MapPin className="mx-auto h-6 w-6 text-dust" />
          <p className="mt-3 text-sm text-dust">
            No saved addresses yet. Tick &quot;Save address&quot; on your next checkout.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {addresses.map((address) => {
            const busy = isPending && pendingId === address.id;

            return (
              <li
                key={address.id}
                className="rounded-2xl border border-bone/10 bg-surface2 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    {address.is_default ? (
                      <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-neon">
                        Default
                      </p>
                    ) : null}
                    <p className="text-sm text-bone">
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-dust">
                      {address.city}, {address.state} {address.pincode}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!address.is_default ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() =>
                          runAction(address.id, setDefaultAccountAddressAction)
                        }
                        className="rounded-full border border-bone/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-dust transition hover:border-neon hover:text-neon disabled:opacity-60"
                      >
                        {busy ? "Updating…" : "Set default"}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        runAction(address.id, deleteAccountAddressAction)
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-bone/15 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-dust transition hover:border-red-400/50 hover:text-red-400 disabled:opacity-60"
                      aria-label="Delete address"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {busy ? "Removing…" : "Delete"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
