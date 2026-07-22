import { createServerClient } from "@/lib/supabase/server";
import type { ProductReview, ReviewStatus } from "@/types";
import type { AdminReviewStatusFilter } from "@/lib/admin/reviews";

export interface AdminReviewListItem extends ProductReview {
  products: {
    id: string;
    name: string;
    slug: string;
  } | null;
  customers: {
    id: string;
    full_name: string | null;
    phone: string | null;
  } | null;
}

export interface AdminReviewListOptions {
  status?: AdminReviewStatusFilter;
}

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

  return { supabase, user };
}

function mapReviewsError(message: string | undefined): string {
  const lower = (message ?? "").toLowerCase();
  if (lower.includes("product_reviews") && lower.includes("does not exist")) {
    return "Reviews require migration 20260722097000_product_reviews.sql.";
  }
  return message || "Failed to load reviews.";
}

function normalizeJoin<T>(
  value: T | T[] | null | undefined
): T | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getAdminReviews(
  options: AdminReviewListOptions = {}
): Promise<AdminReviewListItem[]> {
  const { supabase } = await assertAdmin();
  const status =
    options.status && options.status !== "all" ? options.status : null;

  let query = supabase
    .from("product_reviews")
    .select(
      "id, product_id, customer_id, rating, title, body, status, reviewer_name, moderated_at, moderated_by, created_at, updated_at, products(id, name, slug), customers(id, full_name, phone)"
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load reviews:", error.message);
    throw new Error(mapReviewsError(error.message));
  }

  return ((data ?? []) as unknown as AdminReviewListItem[]).map((review) => ({
    ...review,
    products: normalizeJoin(review.products),
    customers: normalizeJoin(review.customers),
  }));
}

export async function updateAdminReviewStatus(
  reviewId: string,
  status: ReviewStatus
): Promise<ProductReview> {
  const { supabase, user } = await assertAdmin();

  const { data: existing, error: existingError } = await supabase
    .from("product_reviews")
    .select("id, status")
    .eq("id", reviewId)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to load review:", existingError.message);
    throw new Error(mapReviewsError(existingError.message));
  }

  if (!existing) {
    throw new Error("Review not found.");
  }

  if ((existing as { status: ReviewStatus }).status === status) {
    const { data: current } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("id", reviewId)
      .single();
    return current as ProductReview;
  }

  const { data, error } = await supabase
    .from("product_reviews")
    .update({
      status,
      moderated_at: new Date().toISOString(),
      moderated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select("*")
    .single();

  if (error || !data) {
    console.error("Failed to update review status:", error?.message);
    throw new Error(mapReviewsError(error?.message));
  }

  return data as ProductReview;
}
