"use server";

import { revalidatePath } from "next/cache";
import {
  createAdminCoupon,
  deleteAdminCoupon,
  updateAdminCoupon,
} from "@/lib/db/admin-discounts";
import { ADMIN_DISCOUNTS_PATH } from "@/lib/admin/inventory";
import {
  adminCouponFormSchema,
  toIsoOrNull,
} from "@/lib/validations/admin-discount";

export type AdminCouponMutationResult =
  | { success: true }
  | { success: false; error: string };

function revalidateCouponPaths() {
  revalidatePath(ADMIN_DISCOUNTS_PATH);
  revalidatePath("/admin/dashboard/discounts");
}

export async function createCouponAction(input: {
  form: unknown;
}): Promise<AdminCouponMutationResult> {
  const parsed = adminCouponFormSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid coupon details.",
    };
  }

  try {
    await createAdminCoupon({
      code: parsed.data.code,
      discount_type: parsed.data.discount_type,
      discount_value: parsed.data.discount_value,
      starts_at: toIsoOrNull(parsed.data.starts_at),
      ends_at: toIsoOrNull(parsed.data.ends_at),
      usage_limit: parsed.data.usage_limit,
      per_customer_limit: parsed.data.per_customer_limit,
      min_order_amount: parsed.data.min_order_amount,
      is_active: parsed.data.is_active,
    });
    revalidateCouponPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create coupon.",
    };
  }
}

export async function updateCouponAction(input: {
  couponId: string;
  form: unknown;
}): Promise<AdminCouponMutationResult> {
  const parsed = adminCouponFormSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid coupon details.",
    };
  }

  try {
    await updateAdminCoupon(input.couponId, {
      code: parsed.data.code,
      discount_type: parsed.data.discount_type,
      discount_value: parsed.data.discount_value,
      starts_at: toIsoOrNull(parsed.data.starts_at),
      ends_at: toIsoOrNull(parsed.data.ends_at),
      usage_limit: parsed.data.usage_limit,
      per_customer_limit: parsed.data.per_customer_limit,
      min_order_amount: parsed.data.min_order_amount,
      is_active: parsed.data.is_active,
    });
    revalidateCouponPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update coupon.",
    };
  }
}

export async function deleteCouponAction(
  couponId: string
): Promise<AdminCouponMutationResult> {
  try {
    await deleteAdminCoupon(couponId);
    revalidateCouponPaths();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete coupon.",
    };
  }
}
