import { roundMoney } from "@/lib/checkout/order-totals";
import type { Coupon, CouponDiscountType } from "@/types";

export type CouponForDiscount = Pick<
  Coupon,
  | "id"
  | "code"
  | "discount_type"
  | "discount_value"
  | "starts_at"
  | "ends_at"
  | "usage_limit"
  | "usage_count"
  | "per_customer_limit"
  | "min_order_amount"
  | "is_active"
>;

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function computeCouponDiscountAmount(
  coupon: Pick<Coupon, "discount_type" | "discount_value">,
  subtotal: number
): number {
  const value = Number(coupon.discount_value);
  if (!Number.isFinite(value) || value <= 0 || subtotal <= 0) {
    return 0;
  }

  if (coupon.discount_type === "percentage") {
    return roundMoney(Math.min(subtotal, (subtotal * value) / 100));
  }

  return roundMoney(Math.min(subtotal, value));
}

export function getCouponWindowError(
  coupon: Pick<Coupon, "is_active" | "starts_at" | "ends_at">,
  now: Date = new Date()
): string | null {
  if (!coupon.is_active) {
    return "This coupon is no longer active.";
  }

  if (coupon.starts_at) {
    const startsAt = new Date(coupon.starts_at);
    if (Number.isNaN(startsAt.getTime())) {
      return "This coupon has an invalid start date.";
    }
    if (now < startsAt) {
      return "This coupon is not valid yet.";
    }
  }

  if (coupon.ends_at) {
    const endsAt = new Date(coupon.ends_at);
    if (Number.isNaN(endsAt.getTime())) {
      return "This coupon has an invalid end date.";
    }
    if (now > endsAt) {
      return "This coupon has expired.";
    }
  }

  return null;
}

export function getCouponEligibilityError(input: {
  coupon: CouponForDiscount;
  subtotal: number;
  customerUsageCount: number;
  now?: Date;
}): string | null {
  const windowError = getCouponWindowError(input.coupon, input.now);
  if (windowError) {
    return windowError;
  }

  if (
    input.coupon.usage_limit != null &&
    input.coupon.usage_count >= input.coupon.usage_limit
  ) {
    return "This coupon has reached its usage limit.";
  }

  if (
    input.coupon.min_order_amount != null &&
    input.subtotal < Number(input.coupon.min_order_amount)
  ) {
    return `Order subtotal must be at least ₹${Number(input.coupon.min_order_amount).toFixed(2)} for this coupon.`;
  }

  if (
    input.coupon.per_customer_limit != null &&
    input.customerUsageCount >= input.coupon.per_customer_limit
  ) {
    return "You have already used this coupon the maximum number of times.";
  }

  return null;
}

export function describeCouponDiscount(
  discountType: CouponDiscountType,
  discountValue: number
): string {
  if (discountType === "percentage") {
    return `${Number(discountValue)}% off`;
  }
  return `₹${Number(discountValue).toFixed(2)} off`;
}
