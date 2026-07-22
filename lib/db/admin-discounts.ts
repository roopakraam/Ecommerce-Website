import { createServerClient } from "@/lib/supabase/server";
import type { Coupon, CouponInsert, CouponUpdate } from "@/types";

async function assertAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: adminRow, error } = await supabase
    .from("admin_users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !adminRow) {
    throw new Error("You do not have admin access.");
  }

  return supabase;
}

function mapCouponError(message: string | undefined): string {
  const lower = (message ?? "").toLowerCase();
  if (lower.includes("coupons_code_unique") || lower.includes("duplicate")) {
    return "A coupon with that code already exists.";
  }
  if (lower.includes("does not exist")) {
    return "Coupons require migration 20260722096000_inventory_adjustments_and_coupons.sql.";
  }
  return message || "Failed to save coupon.";
}

export async function getAdminCoupons(): Promise<Coupon[]> {
  const supabase = await assertAdmin();

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load coupons:", error.message);
    throw new Error(mapCouponError(error.message));
  }

  return (data ?? []) as Coupon[];
}

export async function createAdminCoupon(input: CouponInsert): Promise<Coupon> {
  const supabase = await assertAdmin();

  const { data, error } = await supabase
    .from("coupons")
    .insert({
      code: input.code,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      starts_at: input.starts_at ?? null,
      ends_at: input.ends_at ?? null,
      usage_limit: input.usage_limit ?? null,
      per_customer_limit: input.per_customer_limit ?? null,
      min_order_amount: input.min_order_amount ?? null,
      is_active: input.is_active ?? true,
    })
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to create coupon:", error?.message);
    throw new Error(mapCouponError(error?.message));
  }

  return data as Coupon;
}

export async function updateAdminCoupon(
  id: string,
  input: CouponUpdate
): Promise<Coupon> {
  const supabase = await assertAdmin();

  const { data, error } = await supabase
    .from("coupons")
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update coupon:", error?.message);
    throw new Error(mapCouponError(error?.message));
  }

  return data as Coupon;
}

export async function deleteAdminCoupon(id: string): Promise<void> {
  const supabase = await assertAdmin();

  const { error } = await supabase.from("coupons").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete coupon:", error.message);
    throw new Error(mapCouponError(error.message));
  }
}
