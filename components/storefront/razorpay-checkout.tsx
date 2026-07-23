"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { clearServerCart } from "@/lib/hooks/use-cart-sync";
import { formatPrice } from "@/lib/utils/format-price";
import type { PaymentStatus } from "@/types";

interface RazorpayCheckoutProps {
  orderId: string;
  orderTotal: number;
  initialPaymentStatus: PaymentStatus;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
}

type PaymentState = "idle" | "loading" | "processing" | "failed" | "paid";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpayCheckout({
  orderId,
  orderTotal,
  initialPaymentStatus,
  customerName,
  customerEmail,
  customerPhone,
}: RazorpayCheckoutProps) {
  const router = useRouter();
  const clearCart = useCartStore((s) => s.clearCart);
  const [paymentState, setPaymentState] = useState<PaymentState>(() => {
    if (initialPaymentStatus === "paid") return "paid";
    if (initialPaymentStatus === "failed") return "failed";
    return "idle";
  });
  const [error, setError] = useState<string | null>(null);
  const hasAutoOpened = useRef(false);

  const markPaymentFailed = useCallback(async () => {
    await fetch("/api/payments/razorpay/fail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    setPaymentState("failed");
  }, [orderId]);

  const openCheckout = useCallback(async () => {
    setError(null);
    setPaymentState("loading");

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      setError("Could not load Razorpay checkout. Please try again.");
      setPaymentState("failed");
      return;
    }

    const createResponse = await fetch("/api/payments/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    const createResult = (await createResponse.json()) as
      | { error: string }
      | {
          keyId: string;
          razorpayOrderId: string;
          amount: number;
          currency: string;
        };

    if (!createResponse.ok || !("razorpayOrderId" in createResult)) {
      setError(
        ("error" in createResult && createResult.error) ||
          "Failed to start payment."
      );
      setPaymentState("failed");
      return;
    }

    setPaymentState("processing");

    const razorpay = new window.Razorpay({
      key: createResult.keyId,
      amount: createResult.amount,
      currency: createResult.currency,
      name: "BOOK MY TEES",
      description: "Order payment",
      order_id: createResult.razorpayOrderId,
      prefill: {
        name: customerName ?? undefined,
        email: customerEmail ?? undefined,
        contact: customerPhone ?? undefined,
      },
      theme: {
        color: "#E4FF3E",
      },
      handler: async (response) => {
        const verifyResponse = await fetch("/api/payments/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        const verifyResult = (await verifyResponse.json()) as
          | { error: string }
          | { success: true; redirectTo: string };

        if (!verifyResponse.ok || !("redirectTo" in verifyResult)) {
          setError(
            ("error" in verifyResult && verifyResult.error) ||
              "Payment verification failed. If money was deducted, it will be confirmed shortly or contact support."
          );
          // Do not call /fail after a charged payment — inventory must stay
          // reserved until webhook/reconcile confirms or the order is abandoned.
          setPaymentState("failed");
          return;
        }

        clearCart();
        void clearServerCart();
        setPaymentState("paid");
        router.push(verifyResult.redirectTo);
      },
      modal: {
        ondismiss: () => {
          void markPaymentFailed();
          setError("Payment was cancelled. You can retry below.");
        },
      },
    });

    razorpay.on("payment.failed", () => {
      void markPaymentFailed();
      setError("Payment failed. Please try again.");
    });

    razorpay.open();
    setPaymentState("idle");
  }, [
    orderId,
    customerName,
    customerEmail,
    customerPhone,
    clearCart,
    router,
    markPaymentFailed,
  ]);

  useEffect(() => {
    if (
      initialPaymentStatus === "pending" &&
      !hasAutoOpened.current
    ) {
      hasAutoOpened.current = true;
      void openCheckout();
    }
  }, [initialPaymentStatus, openCheckout]);

  if (initialPaymentStatus === "paid" || paymentState === "paid") {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-300">
          Payment already completed
        </p>
        <p className="mt-2 text-sm text-emerald-400/80">
          This order has been paid. Check your confirmation page for details.
        </p>
      </div>
    );
  }

  if (initialPaymentStatus === "refunded") {
    return (
      <div className="rounded-2xl border border-bone/15 bg-surface p-6 text-center">
        <p className="text-lg font-semibold text-bone">
          Order refunded
        </p>
        <p className="mt-2 text-sm text-dust">
          This order has been refunded and cannot be paid again.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-bone/10 bg-surface p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-dust">Amount due</p>
          <p className="font-mono text-2xl font-bold text-neon">
            {formatPrice(orderTotal)}
          </p>
        </div>
        <p className="font-mono text-xs text-dust">Order {orderId}</p>
      </div>

      {paymentState === "loading" && (
        <div className="mt-6 flex items-center gap-2 text-sm text-dust">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing secure checkout...
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {paymentState !== "loading" && paymentState !== "processing" && (
        <button
          type="button"
          onClick={() => void openCheckout()}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-neon px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone sm:w-auto"
        >
          {paymentState === "failed" ? "Retry payment" : "Pay now"}
        </button>
      )}

      {paymentState === "processing" && (
        <p className="mt-6 text-sm text-dust">
          Complete payment in the Razorpay window...
        </p>
      )}
    </div>
  );
}
