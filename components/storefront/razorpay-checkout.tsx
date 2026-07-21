"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
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
        color: "#a3e635",
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
              "Payment verification failed."
          );
          await markPaymentFailed();
          return;
        }

        clearCart();
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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <p className="text-lg font-semibold text-emerald-800">
          Payment already completed
        </p>
        <p className="mt-2 text-sm text-emerald-700">
          This order has been paid. Check your confirmation page for details.
        </p>
      </div>
    );
  }

  if (initialPaymentStatus === "refunded") {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6 text-center">
        <p className="text-lg font-semibold text-neutral-950">
          Order refunded
        </p>
        <p className="mt-2 text-sm text-neutral-600">
          This order has been refunded and cannot be paid again.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-neutral-600">Amount due</p>
          <p className="text-2xl font-bold text-neutral-950">
            {formatPrice(orderTotal)}
          </p>
        </div>
        <p className="font-mono text-xs text-neutral-500">Order {orderId}</p>
      </div>

      {paymentState === "loading" && (
        <div className="mt-6 flex items-center gap-2 text-sm text-neutral-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          Preparing secure checkout...
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {paymentState !== "loading" && paymentState !== "processing" && (
        <button
          type="button"
          onClick={() => void openCheckout()}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-lime-400 hover:text-neutral-950 sm:w-auto"
        >
          {paymentState === "failed" ? "Retry payment" : "Pay now"}
        </button>
      )}

      {paymentState === "processing" && (
        <p className="mt-6 text-sm text-neutral-600">
          Complete payment in the Razorpay window...
        </p>
      )}
    </div>
  );
}
