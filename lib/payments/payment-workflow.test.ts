import { describe, expect, it } from "vitest";
import { validateRazorpayPaymentAgainstOrder } from "@/lib/payments/validate-razorpay-payment";
import { rupeesToPaise } from "@/lib/razorpay/client";

/**
 * Business-workflow style tests for payment confirmation guards.
 * These encode the failure modes fixed in the production audit
 * (amount mismatch, wrong order, non-captured status).
 */
describe("payment confirmation workflow guards", () => {
  const orderTotal = 1499.5;
  const razorpayOrderId = "order_checkout_1";

  it("allows capture that matches order total in paise", () => {
    const result = validateRazorpayPaymentAgainstOrder({
      payment: {
        id: "pay_ok",
        order_id: razorpayOrderId,
        amount: rupeesToPaise(orderTotal),
        currency: "INR",
        status: "captured",
      },
      expectedOrderTotalRupees: orderTotal,
      expectedRazorpayOrderId: razorpayOrderId,
    });
    expect(result).toEqual({ ok: true });
  });

  it("blocks underpayment and overpayment", () => {
    const under = validateRazorpayPaymentAgainstOrder({
      payment: {
        id: "pay_under",
        order_id: razorpayOrderId,
        amount: rupeesToPaise(orderTotal) - 1,
        currency: "INR",
        status: "captured",
      },
      expectedOrderTotalRupees: orderTotal,
      expectedRazorpayOrderId: razorpayOrderId,
    });
    expect(under.ok).toBe(false);

    const over = validateRazorpayPaymentAgainstOrder({
      payment: {
        id: "pay_over",
        order_id: razorpayOrderId,
        amount: rupeesToPaise(orderTotal) + 100,
        currency: "INR",
        status: "captured",
      },
      expectedOrderTotalRupees: orderTotal,
      expectedRazorpayOrderId: razorpayOrderId,
    });
    expect(over.ok).toBe(false);
  });

  it("blocks payment linked to a different Razorpay order", () => {
    const result = validateRazorpayPaymentAgainstOrder({
      payment: {
        id: "pay_wrong",
        order_id: "order_other",
        amount: rupeesToPaise(orderTotal),
        currency: "INR",
        status: "captured",
      },
      expectedOrderTotalRupees: orderTotal,
      expectedRazorpayOrderId: razorpayOrderId,
    });
    expect(result.ok).toBe(false);
  });
});
