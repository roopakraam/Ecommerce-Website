import { describe, expect, it } from "vitest";
import {
  computeOrderTotals,
  computeShippingFee,
  computeTaxAmount,
  matchShippingZone,
  roundMoney,
  taxFromOrderAmounts,
  type ShippingZoneLike,
} from "@/lib/checkout/order-totals";

const flatZone: ShippingZoneLike = {
  name: "South",
  states: ["Karnataka", "Tamil Nadu"],
  flat_rate: 80,
  free_above: 1000,
  is_active: true,
  sort_order: 1,
};

const allIndia: ShippingZoneLike = {
  name: "All India",
  states: [],
  flat_rate: 120,
  free_above: null,
  is_active: true,
  sort_order: 10,
};

describe("roundMoney", () => {
  it("rounds to 2 decimal places", () => {
    expect(roundMoney(10.1 + 10.2)).toBe(20.3);
    expect(roundMoney(1.005)).toBe(1.01);
  });

  it("returns 0 for non-finite values", () => {
    expect(roundMoney(Number.NaN)).toBe(0);
    expect(roundMoney(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("matchShippingZone", () => {
  it("matches by state (case-insensitive)", () => {
    expect(matchShippingZone([flatZone, allIndia], "karnataka")?.name).toBe(
      "South"
    );
  });

  it("falls back to All India when no state match", () => {
    expect(matchShippingZone([flatZone, allIndia], "Punjab")?.name).toBe(
      "All India"
    );
  });

  it("ignores inactive zones", () => {
    const inactive = { ...flatZone, is_active: false };
    expect(matchShippingZone([inactive, allIndia], "Karnataka")?.name).toBe(
      "All India"
    );
  });
});

describe("computeShippingFee", () => {
  it("applies free_above at exact threshold", () => {
    expect(computeShippingFee(flatZone, 1000)).toBe(0);
    expect(computeShippingFee(flatZone, 999.99)).toBe(80);
  });

  it("returns 0 without a zone", () => {
    expect(computeShippingFee(null, 500)).toBe(0);
  });
});

describe("computeTaxAmount", () => {
  it("computes percent of merchandise", () => {
    expect(computeTaxAmount(1000, 5)).toBe(50);
    expect(computeTaxAmount(1000, 0)).toBe(0);
    expect(computeTaxAmount(1000, -5)).toBe(0);
  });
});

describe("computeOrderTotals", () => {
  it("computes basic total with tax and shipping", () => {
    const result = computeOrderTotals({
      subtotal: 1000,
      taxRatePercent: 5,
      zones: [flatZone],
      state: "Karnataka",
    });
    // free_above hit → shipping 0, tax 50, total 1050
    expect(result.shippingFee).toBe(0);
    expect(result.taxAmount).toBe(50);
    expect(result.total).toBe(1050);
    expect(result.discountAmount).toBe(0);
  });

  it("uses post-discount subtotal for free shipping", () => {
    const result = computeOrderTotals({
      subtotal: 1000,
      taxRatePercent: 0,
      zones: [flatZone],
      state: "Karnataka",
      discountAmount: 200,
    });
    // taxable 800 < free_above 1000 → shipping 80
    expect(result.discountAmount).toBe(200);
    expect(result.shippingFee).toBe(80);
    expect(result.total).toBe(880);
  });

  it("caps discount at subtotal", () => {
    const result = computeOrderTotals({
      subtotal: 100,
      taxRatePercent: 18,
      zones: [allIndia],
      state: "Delhi",
      discountAmount: 500,
    });
    expect(result.discountAmount).toBe(100);
    expect(result.taxAmount).toBe(0);
    expect(result.shippingFee).toBe(120);
    expect(result.total).toBe(120);
  });

  it("applies tax on post-discount merchandise", () => {
    const result = computeOrderTotals({
      subtotal: 1000,
      taxRatePercent: 18,
      zones: [allIndia],
      state: "Delhi",
      discountAmount: 100,
    });
    expect(result.taxAmount).toBe(162);
    expect(result.shippingFee).toBe(120);
    expect(result.total).toBe(1182);
  });
});

describe("taxFromOrderAmounts", () => {
  it("reconstructs tax from stored totals", () => {
    expect(
      taxFromOrderAmounts({
        subtotal: 1000,
        shippingFee: 50,
        discountAmount: 100,
        total: 1000.5,
      })
    ).toBe(50.5);
  });
});
