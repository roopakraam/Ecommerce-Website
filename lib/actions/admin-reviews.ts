"use server";

import { revalidatePath } from "next/cache";
import { updateAdminReviewStatus } from "@/lib/db/admin-reviews";
import { ADMIN_REVIEWS_PATH } from "@/lib/admin/reviews";
import { ADMIN_PRODUCTS_PATH } from "@/lib/admin/products";
import { updateReviewStatusSchema } from "@/lib/validations/admin-review";
import type { ReviewStatus } from "@/types";

export type UpdateReviewStatusResult =
  | { success: true; status: ReviewStatus }
  | { success: false; error: string };

export async function updateReviewStatusAction(input: {
  reviewId: string;
  status: string;
}): Promise<UpdateReviewStatusResult> {
  const parsed = updateReviewStatusSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid status update.",
    };
  }

  try {
    const review = await updateAdminReviewStatus(
      parsed.data.reviewId,
      parsed.data.status
    );

    revalidatePath(ADMIN_REVIEWS_PATH);
    revalidatePath("/admin/dashboard/reviews");
    revalidatePath(`${ADMIN_PRODUCTS_PATH}/${review.product_id}/edit`);
    revalidatePath("/products");

    return { success: true, status: review.status };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update review.",
    };
  }
}
