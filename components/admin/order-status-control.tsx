"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/lib/actions/admin-orders";
import { ORDER_STATUSES } from "@/lib/orders/status";
import type { OrderStatus } from "@/types";

interface OrderStatusControlProps {
  orderId: string;
  currentStatus: OrderStatus;
}

export function OrderStatusControl({
  orderId,
  currentStatus,
}: OrderStatusControlProps) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await updateOrderStatusAction({ orderId, status });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setMessage(`Status updated to ${result.status}. Notification queued (stub).`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="text-sm font-semibold text-white">Update status</h2>
      <p className="mt-1 text-xs text-neutral-400">
        Saves to Supabase and triggers a notification stub.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
          className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm capitalize text-white outline-none ring-lime-400 transition focus:border-lime-400 focus:ring-2 sm:max-w-xs"
        >
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <button
          type="button"
          disabled={isPending || status === currentStatus}
          onClick={onSave}
          className="rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save status"}
        </button>
      </div>

      {message && (
        <p className="mt-3 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
