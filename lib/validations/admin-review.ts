import { z } from "zod";

export const updateReviewStatusSchema = z.object({
  reviewId: z.string().uuid("Invalid review id"),
  status: z.enum(["pending", "approved", "rejected"]),
});

export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
