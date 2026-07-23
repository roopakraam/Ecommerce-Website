import crypto from "crypto";
import { describe, expect, it } from "vitest";
import {
  verifyRazorpayPaymentSignature,
  verifyRazorpayWebhookSignature,
} from "@/lib/razorpay/verify-signature";

describe("verifyRazorpayPaymentSignature", () => {
  const secret = "test_secret";
  const orderId = "order_ABC";
  const paymentId = "pay_XYZ";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  it("accepts a valid signature", () => {
    expect(
      verifyRazorpayPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: expected,
        secret,
      })
    ).toBe(true);
  });

  it("accepts uppercase hex signatures", () => {
    expect(
      verifyRazorpayPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: expected.toUpperCase(),
        secret,
      })
    ).toBe(true);
  });

  it("rejects tampered payment ids and wrong secrets", () => {
    expect(
      verifyRazorpayPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: "pay_OTHER",
        razorpaySignature: expected,
        secret,
      })
    ).toBe(false);

    expect(
      verifyRazorpayPaymentSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: expected,
        secret: "wrong",
      })
    ).toBe(false);
  });
});

describe("verifyRazorpayWebhookSignature", () => {
  const secret = "whsec";
  const rawBody = '{"event":"payment.captured"}';
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  it("validates webhook HMAC", () => {
    expect(
      verifyRazorpayWebhookSignature({
        rawBody,
        signature: expected,
        secret,
      })
    ).toBe(true);

    expect(
      verifyRazorpayWebhookSignature({
        rawBody,
        signature: "deadbeef",
        secret,
      })
    ).toBe(false);
  });
});
