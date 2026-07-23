import { describe, expect, it } from "vitest";
import {
  computeCouponDiscountAmount,
  describeCouponDiscount,
  getCouponEligibilityError,
  getCouponWindowError,
  normalizeCouponCode,
  type CouponForDiscount,
} from "@/lib/checkout/coupons";

function baseCoupon(
  overrides: Partial<CouponForDiscount> = {}
): CouponForDiscount {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    code: "SAVE10",
    discount_type: "percentage",
    discount_value: 10,
    starts_at: null,
    ends_at: null,
    usage_limit: null,
    usage_count: 0,
    per_customer_limit: null,
    min_order_amount: null,
    is_active: true,
    ...overrides,
  };
}

describe("normalizeCouponCode", () => {
  it("trims and uppercases", () => {
    expect(normalizeCouponCode("  save10 ")).toBe("SAVE10");
  });
});

describe("computeCouponDiscountAmount", () => {
  it("computes percentage and fixed discounts", () => {
    expect(
      computeCouponDiscountAmount(
        { discount_type: "percentage", discount_value: 10 },
        999
      )
    ).toBe(99.9);

    expect(
      computeCouponDiscountAmount(
        { discount_type: "fixed", discount_value: 50 },
        200
      )
    ).toBe(50);

    expect(
      computeCouponDiscountAmount(
        { discount_type: "fixed", discount_value: 50 },
        30
      )
    ).toBe(30);
  });

  it("caps percentage over 100% at subtotal", () => {
    expect(
      computeCouponDiscountAmount(
        { discount_type: "percentage", discount_value: 150 },
        200
      )
    ).toBe(200);
  });

  it("returns 0 for invalid inputs", () => {
    expect(
      computeCouponDiscountAmount(
        { discount_type: "fixed", discount_value: -1 },
        100
      )
    ).toBe(0);
    expect(
      computeCouponDiscountAmount(
        { discount_type: "fixed", discount_value: 10 },
        0
      )
    ).toBe(0);
  });
});

describe("getCouponWindowError", () => {
  const now = new Date("2026-07-23T12:00:00.000Z");

  it("rejects inactive coupons", () => {
    expect(
      getCouponWindowError(baseCoupon({ is_active: false }), now)
    ).toMatch(/no longer active/i);
  });

  it("rejects not-yet-valid and expired coupons", () => {
    expect(
      getCouponWindowError(
        baseCoupon({ starts_at: "2026-07-24T00:00:00.000Z" }),
        now
      )
    ).toMatch(/not valid yet/i);

    expect(
      getCouponWindowError(
        baseCoupon({ ends_at: "2026-07-22T00:00:00.000Z" }),
        now
      )
    ).toMatch(/expired/i);
  });

  it("rejects invalid date strings", () => {
    expect(
      getCouponWindowError(baseCoupon({ starts_at: "not-a-date" }), now)
    ).toMatch(/invalid start date/i);
    expect(
      getCouponWindowError(baseCoupon({ ends_at: "not-a-date" }), now)
    ).toMatch(/invalid end date/i);
  });
});

describe("getCouponEligibilityError", () => {
  it("enforces usage, min order, and per-customer limits", () => {
    expect(
      getCouponEligibilityError({
        coupon: baseCoupon({ usage_limit: 1, usage_count: 1 }),
        subtotal: 500,
        customerUsageCount: 0,
      })
    ).toMatch(/usage limit/i);

    expect(
      getCouponEligibilityError({
        coupon: baseCoupon({ min_order_amount: 1000 }),
        subtotal: 999.99,
        customerUsageCount: 0,
      })
    ).toMatch(/at least/i);

    expect(
      getCouponEligibilityError({
        coupon: baseCoupon({ per_customer_limit: 1 }),
        subtotal: 500,
        customerUsageCount: 1,
      })
    ).toMatch(/maximum number/i);
  });

  it("allows equal min order amount", () => {
    expect(
      getCouponEligibilityError({
        coupon: baseCoupon({ min_order_amount: 1000 }),
        subtotal: 1000,
        customerUsageCount: 0,
      })
    ).toBeNull();
  });
});

describe("describeCouponDiscount", () => {
  it("formats percentage and fixed copy", () => {
    expect(describeCouponDiscount("percentage", 10)).toBe("10% off");
    expect(describeCouponDiscount("fixed", 50)).toBe("₹50.00 off");
  });
});
