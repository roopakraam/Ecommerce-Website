import { describe, expect, it } from "vitest";
import { validateRazorpayPaymentAgainstOrder } from "@/lib/payments/validate-razorpay-payment";

describe("validateRazorpayPaymentAgainstOrder", () => {
  const base = {
    expectedOrderTotalRupees: 1130,
    expectedRazorpayOrderId: "order_123",
  };

  it("accepts a matching captured INR payment", () => {
    expect(
      validateRazorpayPaymentAgainstOrder({
        ...base,
        payment: {
          id: "pay_1",
          order_id: "order_123",
          amount: 113000,
          currency: "INR",
          status: "captured",
        },
      })
    ).toEqual({ ok: true });
  });

  it("rejects amount, currency, order, and status mismatches", () => {
    expect(
      validateRazorpayPaymentAgainstOrder({
        ...base,
        payment: {
          id: "pay_1",
          order_id: "order_123",
          amount: 100,
          currency: "INR",
          status: "captured",
        },
      }).ok
    ).toBe(false);

    expect(
      validateRazorpayPaymentAgainstOrder({
        ...base,
        payment: {
          id: "pay_1",
          order_id: "order_OTHER",
          amount: 113000,
          currency: "INR",
          status: "captured",
        },
      }).ok
    ).toBe(false);

    expect(
      validateRazorpayPaymentAgainstOrder({
        ...base,
        payment: {
          id: "pay_1",
          order_id: "order_123",
          amount: 113000,
          currency: "USD",
          status: "captured",
        },
      }).ok
    ).toBe(false);

    expect(
      validateRazorpayPaymentAgainstOrder({
        ...base,
        payment: {
          id: "pay_1",
          order_id: "order_123",
          amount: 113000,
          currency: "INR",
          status: "authorized",
        },
      }).ok
    ).toBe(false);
  });
});
