"use server";

import { revalidatePath } from "next/cache";
import { createProductReview } from "@/lib/db/reviews";
import { submitProductReviewSchema } from "@/lib/validations/review";

export type SubmitProductReviewResult =
  | { success: true }
  | { success: false; error: string };

export async function submitProductReviewAction(
  input: unknown
): Promise<SubmitProductReviewResult> {
  const parsed = submitProductReviewSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        "Please check your review and try again.",
    };
  }

  const { productId, productSlug, rating, body, title, reviewerName } =
    parsed.data;

  const result = await createProductReview({
    productId,
    rating,
    body,
    title: title ?? null,
    reviewerName: reviewerName ?? null,
  });

  if ("error" in result) {
    return { success: false, error: result.error };
  }

  revalidatePath("/");
  revalidatePath("/products");
  if (productSlug) {
    revalidatePath(`/products/${productSlug}`);
  }

  return { success: true };
}
