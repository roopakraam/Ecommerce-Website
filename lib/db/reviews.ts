import { createServerClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import type { ProductReview } from "@/types";

const REVIEW_SELECT =
  "id, product_id, customer_id, rating, title, body, status, reviewer_name, moderated_at, moderated_by, created_at, updated_at";

function mapReviewsError(message: string | undefined): string {
  const lower = (message ?? "").toLowerCase();
  if (lower.includes("product_reviews") && lower.includes("does not exist")) {
    return "Reviews require migration 20260722097000_product_reviews.sql.";
  }
  if (lower.includes("row-level security") || lower.includes("rls")) {
    return "You do not have permission to submit a review.";
  }
  return message || "Failed to load reviews.";
}

/** Approved reviews for the home testimonials section. */
export async function getApprovedReviews(limit = 6): Promise<ProductReview[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("product_reviews")
    .select(REVIEW_SELECT)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load approved reviews:", error.message);
    return [];
  }

  return (data ?? []) as ProductReview[];
}

/** Approved reviews for a product detail page. */
export async function getApprovedReviewsForProduct(
  productId: string
): Promise<ProductReview[]> {
  const supabase = createStaticClient();

  const { data, error } = await supabase
    .from("product_reviews")
    .select(REVIEW_SELECT)
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load product reviews:", error.message);
    return [];
  }

  return (data ?? []) as ProductReview[];
}

export interface CreateProductReviewInput {
  productId: string;
  rating: number;
  body: string;
  title?: string | null;
  reviewerName?: string | null;
}

/**
 * Insert a customer review as `pending` (RLS requires own customer_id + pending).
 */
export async function createProductReview(
  input: CreateProductReviewInput
): Promise<{ review: ProductReview } | { error: string }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sign in to leave a review." };
  }

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (customerError) {
    console.error("Failed to load customer for review:", customerError.message);
    return { error: "Could not verify your account. Please try again." };
  }

  if (!customer) {
    return {
      error: "Complete your account setup before leaving a review.",
    };
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, is_active")
    .eq("id", input.productId)
    .maybeSingle();

  if (productError) {
    console.error("Failed to verify product for review:", productError.message);
    return { error: "Could not verify this product. Please try again." };
  }

  if (!product || !product.is_active) {
    return { error: "This product is not available for reviews." };
  }

  const reviewerName =
    input.reviewerName?.trim() ||
    customer.full_name?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    null;

  const { data, error } = await supabase
    .from("product_reviews")
    .insert({
      product_id: input.productId,
      customer_id: customer.id,
      rating: input.rating,
      title: input.title?.trim() || null,
      body: input.body.trim(),
      status: "pending",
      reviewer_name: reviewerName,
    })
    .select(REVIEW_SELECT)
    .single();

  if (error || !data) {
    console.error("Failed to create product review:", error?.message);
    return { error: mapReviewsError(error?.message) };
  }

  return { review: data as ProductReview };
}
