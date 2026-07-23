import {
  computeCouponDiscountAmount,
  getCouponEligibilityError,
  normalizeCouponCode,
  type CouponForDiscount,
} from "@/lib/checkout/coupons";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AppliedCouponResult {
  coupon: CouponForDiscount;
  discountAmount: number;
}

export type ApplyCouponResult =
  | { ok: true; applied: AppliedCouponResult }
  | { ok: false; error: string };

export async function getCouponByCode(
  code: string
): Promise<CouponForDiscount | null> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    return null;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupons")
    .select(
      "id, code, discount_type, discount_value, starts_at, ends_at, usage_limit, usage_count, per_customer_limit, min_order_amount, is_active"
    )
    .eq("code", normalized)
    .maybeSingle();

  if (error) {
    console.error("Failed to load coupon:", error.message);
    throw new Error("Failed to validate coupon.");
  }

  return (data as CouponForDiscount | null) ?? null;
}

/**
 * Counts paid (non-cancelled) orders that used this coupon for a customer.
 * Unpaid / abandoned checkouts must not burn per-customer limits.
 */
export async function countCustomerCouponUsage(
  customerId: string,
  couponId: string
): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("coupon_id", couponId)
    .eq("payment_status", "paid")
    .neq("status", "cancelled");

  if (error) {
    console.error("Failed to count coupon usage:", error.message);
    throw new Error("Failed to validate coupon usage.");
  }

  return count ?? 0;
}

/**
 * Validates a coupon for the given customer/subtotal and returns the discount.
 * Does not increment usage_count — that happens on successful payment capture.
 */
export async function resolveCouponForCheckout(input: {
  code: string | null | undefined;
  customerId: string;
  subtotal: number;
}): Promise<ApplyCouponResult | { ok: true; applied: null }> {
  const raw = input.code?.trim() ?? "";
  if (!raw) {
    return { ok: true, applied: null };
  }

  const coupon = await getCouponByCode(raw);
  if (!coupon) {
    return { ok: false, error: "Invalid coupon code." };
  }

  const customerUsageCount = await countCustomerCouponUsage(
    input.customerId,
    coupon.id
  );

  const eligibilityError = getCouponEligibilityError({
    coupon,
    subtotal: input.subtotal,
    customerUsageCount,
  });

  if (eligibilityError) {
    return { ok: false, error: eligibilityError };
  }

  const discountAmount = computeCouponDiscountAmount(coupon, input.subtotal);
  if (discountAmount <= 0) {
    return { ok: false, error: "This coupon does not apply to your order." };
  }

  return {
    ok: true,
    applied: { coupon, discountAmount },
  };
}

/**
 * Atomically increments usage_count when under the optional usage_limit.
 * Returns false if the coupon was concurrently exhausted.
 */
export async function incrementCouponUsage(couponId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data: coupon, error: loadError } = await admin
    .from("coupons")
    .select("id, usage_count, usage_limit")
    .eq("id", couponId)
    .maybeSingle();

  if (loadError || !coupon) {
    console.error("Failed to load coupon for usage increment:", loadError?.message);
    return false;
  }

  const usageCount = Number(coupon.usage_count);
  const usageLimit =
    coupon.usage_limit == null ? null : Number(coupon.usage_limit);

  if (usageLimit != null && usageCount >= usageLimit) {
    return false;
  }

  let query = admin
    .from("coupons")
    .update({
      usage_count: usageCount + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", couponId)
    .eq("usage_count", usageCount);

  if (usageLimit != null) {
    query = query.lt("usage_count", usageLimit);
  }

  const { data, error } = await query.select("id").maybeSingle();

  if (error) {
    console.error("Failed to increment coupon usage:", error.message);
    return false;
  }

  return Boolean(data);
}
