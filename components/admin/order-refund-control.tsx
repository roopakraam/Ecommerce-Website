"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refundOrderAction } from "@/lib/actions/admin-orders";
import { Button } from "@/components/ui/button";
import type { OrderStatus, PaymentStatus } from "@/types";

interface OrderRefundControlProps {
  orderId: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  orderTotalLabel: string;
}

export function OrderRefundControl({
  orderId,
  paymentStatus,
  orderStatus,
  orderTotalLabel,
}: OrderRefundControlProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (paymentStatus === "refunded") {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Refund</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          This order has already been refunded.
        </p>
      </div>
    );
  }

  if (paymentStatus !== "paid") {
    return null;
  }

  const willCancel =
    orderStatus === "pending" || orderStatus === "confirmed";

  function onRefund() {
    setMessage(null);
    setError(null);

    const confirmMessage = willCancel
      ? `Issue a full Razorpay refund of ${orderTotalLabel}? Payment will be marked refunded and the order will be cancelled. Reserved stock will be restored.`
      : `Issue a full Razorpay refund of ${orderTotalLabel}? Payment will be marked refunded. Order status (${orderStatus}) will not be changed automatically. Reserved stock will be restored if still held.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    startTransition(async () => {
      const result = await refundOrderAction({
        orderId,
        reason: reason.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      if (result.alreadyRefunded) {
        setMessage("Order was already marked refunded.");
      } else {
        const parts = [
          "Refund issued via Razorpay.",
          result.razorpayRefundId
            ? `Refund id: ${result.razorpayRefundId}.`
            : null,
          willCancel
            ? "Order status set to cancelled."
            : `Order status left as ${result.status}.`,
          result.inventoryReleased
            ? "Inventory restored to stock."
            : null,
        ].filter(Boolean);
        setMessage(parts.join(" "));
      }

      setReason("");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Issue refund</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Full refund of {orderTotalLabel} via Razorpay.{" "}
        {willCancel
          ? "Pending/confirmed orders are cancelled and reserved stock is restored."
          : "Shipped/delivered/cancelled orders keep their status; only payment is marked refunded."}
      </p>

      <label className="mt-4 block text-xs font-medium text-muted-foreground">
        Reason (optional)
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Customer return, wrong item, etc."
          className="mt-1.5 flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none ring-ring placeholder:text-muted-foreground focus-visible:ring-2"
        />
      </label>

      <div className="mt-4">
        <Button
          type="button"
          variant="destructive"
          disabled={isPending}
          onClick={onRefund}
        >
          {isPending ? "Refunding..." : "Refund payment"}
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
