import { rupeesToPaise } from "@/lib/razorpay/client";

export interface RazorpayPaymentLike {
  id?: string;
  order_id?: string;
  amount?: number | string;
  currency?: string;
  status?: string;
}

export type PaymentAmountValidation =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Ensures a Razorpay payment matches the expected checkout order amount/currency.
 */
export function validateRazorpayPaymentAgainstOrder(input: {
  payment: RazorpayPaymentLike;
  expectedOrderTotalRupees: number;
  expectedRazorpayOrderId: string;
  requireCaptured?: boolean;
}): PaymentAmountValidation {
  const { payment, expectedOrderTotalRupees, expectedRazorpayOrderId } = input;
  const requireCaptured = input.requireCaptured ?? true;

  if (!payment.id) {
    return { ok: false, error: "Payment is missing an id." };
  }

  if (!payment.order_id || payment.order_id !== expectedRazorpayOrderId) {
    return {
      ok: false,
      error: "Payment does not belong to this Razorpay order.",
    };
  }

  if (requireCaptured && payment.status && payment.status !== "captured") {
    return {
      ok: false,
      error: `Payment status is ${payment.status}, expected captured.`,
    };
  }

  const currency = (payment.currency ?? "").toUpperCase();
  if (currency && currency !== "INR") {
    return { ok: false, error: "Payment currency must be INR." };
  }

  const amountPaise = Number(payment.amount);
  const expectedPaise = rupeesToPaise(expectedOrderTotalRupees);

  if (!Number.isFinite(amountPaise) || amountPaise !== expectedPaise) {
    return {
      ok: false,
      error: "Payment amount does not match the order total.",
    };
  }

  return { ok: true };
}
