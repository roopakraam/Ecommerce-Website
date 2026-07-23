import { describe, expect, it } from "vitest";
import {
  checkoutRequestSchema,
  couponCodeSchema,
  validateCouponRequestSchema,
} from "@/lib/validations/checkout";
import { cartReplaceSchema } from "@/lib/validations/cart";
import {
  createRazorpayOrderSchema,
  verifyRazorpayPaymentSchema,
} from "@/lib/validations/payment";
import { contactMessageSchema } from "@/lib/validations/contact";
import { submitProductReviewSchema } from "@/lib/validations/review";
import {
  customerLoginSchema,
  customerSignupSchema,
} from "@/lib/validations/customer-auth";

const address = {
  line1: "12 MG Road",
  line2: null,
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
};

const productId = "550e8400-e29b-41d4-a716-446655440000";
const variantId = "6ba7b810-9dad-41d1-80b4-00c04fd430c8";
const orderId = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

describe("checkoutRequestSchema", () => {
  it("accepts a valid checkout payload", () => {
    const parsed = checkoutRequestSchema.safeParse({
      address,
      items: [{ productId, variantId, quantity: 2 }],
      couponCode: "save-10",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.couponCode).toBe("SAVE-10");
    }
  });

  it("rejects empty carts, bad email, and oversized carts", () => {
    expect(
      checkoutRequestSchema.safeParse({ address, items: [] }).success
    ).toBe(false);

    expect(
      checkoutRequestSchema.safeParse({
        address,
        email: "not-an-email",
        items: [{ productId, variantId, quantity: 1 }],
      }).success
    ).toBe(false);

    expect(
      checkoutRequestSchema.safeParse({
        address,
        items: Array.from({ length: 51 }, () => ({
          productId,
          variantId,
          quantity: 1,
        })),
      }).success
    ).toBe(false);
  });

  it("rejects invalid pincode and quantity bounds", () => {
    expect(
      checkoutRequestSchema.safeParse({
        address: { ...address, pincode: "012345" },
        items: [{ productId, variantId, quantity: 1 }],
      }).success
    ).toBe(false);

    expect(
      checkoutRequestSchema.safeParse({
        address,
        items: [{ productId, variantId, quantity: 21 }],
      }).success
    ).toBe(false);
  });
});

describe("coupon schemas", () => {
  it("normalizes coupon codes", () => {
    expect(couponCodeSchema.parse("abc")).toBe("ABC");
    expect(
      validateCouponRequestSchema.parse({ code: "x", subtotal: 10 })
    ).toEqual({ code: "X", subtotal: 10 });
  });
});

describe("cartReplaceSchema", () => {
  it("allows empty replace and coerces quantities", () => {
    expect(cartReplaceSchema.parse({ items: [] })).toEqual({ items: [] });
    expect(
      cartReplaceSchema.parse({
        items: [{ variantId, quantity: "3" }],
      })
    ).toEqual({ items: [{ variantId, quantity: 3 }] });
  });

  it("rejects qty 0 and 100", () => {
    expect(
      cartReplaceSchema.safeParse({
        items: [{ variantId, quantity: 0 }],
      }).success
    ).toBe(false);
    expect(
      cartReplaceSchema.safeParse({
        items: [{ variantId, quantity: 100 }],
      }).success
    ).toBe(false);
  });
});

describe("payment schemas", () => {
  it("requires UUID order ids", () => {
    expect(
      createRazorpayOrderSchema.safeParse({ orderId: "not-uuid" }).success
    ).toBe(false);
    expect(
      verifyRazorpayPaymentSchema.safeParse({
        orderId,
        razorpay_order_id: "order_1",
        razorpay_payment_id: "pay_1",
        razorpay_signature: "sig",
      }).success
    ).toBe(true);
  });
});

describe("contact and review schemas", () => {
  it("validates contact message length and email", () => {
    expect(
      contactMessageSchema.safeParse({
        name: "Roopa",
        email: "a@b.com",
        message: "short",
      }).success
    ).toBe(false);

    expect(
      contactMessageSchema.safeParse({
        name: "Roopa",
        email: "a@b.com",
        message: "Hello there, I need help with an order.",
      }).success
    ).toBe(true);
  });

  it("validates review rating and soft fields", () => {
    const parsed = submitProductReviewSchema.safeParse({
      productId,
      rating: 5,
      body: "Great quality tee, fits perfectly.",
      title: "",
      reviewerName: "X",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.title).toBeUndefined();
      expect(parsed.data.reviewerName).toBeUndefined();
    }
  });
});

describe("customer auth schemas", () => {
  it("requires matching passwords on signup", () => {
    expect(
      customerLoginSchema.safeParse({
        email: "a@b.com",
        password: "secret1",
      }).success
    ).toBe(true);

    expect(
      customerSignupSchema.safeParse({
        email: "a@b.com",
        password: "secret1",
        confirmPassword: "secret2",
        fullName: "Roopa",
      }).success
    ).toBe(false);
  });
});
