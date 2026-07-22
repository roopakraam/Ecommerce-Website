"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrderStatusAction } from "@/lib/actions/admin-orders";
import { ORDER_STATUSES } from "@/lib/orders/status";
import { Button } from "@/components/ui/button";
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

      setMessage(`Status updated to ${result.status}. Logged to audit history.`);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Update status</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Saves the order status and writes an entry to audit_logs.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm capitalize text-foreground outline-none ring-ring focus-visible:ring-2 sm:max-w-xs"
        >
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <Button
          type="button"
          disabled={isPending || status === currentStatus}
          onClick={onSave}
        >
          {isPending ? "Saving..." : "Save status"}
        </Button>
      </div>

      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {error}
        </p>
      ) : null}
    </div>
  );
}
