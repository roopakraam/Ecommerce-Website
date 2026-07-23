import { z } from "zod";

export const submitProductReviewSchema = z.object({
  productId: z.string().uuid("Invalid product"),
  productSlug: z
    .string()
    .trim()
    .min(1, "Invalid product")
    .max(200)
    .optional(),
  rating: z.coerce
    .number()
    .int("Rating must be a whole number")
    .min(1, "Choose a rating from 1 to 5")
    .max(5, "Choose a rating from 1 to 5"),
  title: z
    .string()
    .trim()
    .max(120, "Title is too long")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  body: z
    .string()
    .trim()
    .min(10, "Tell us a bit more (at least 10 characters)")
    .max(2000, "Review is too long"),
  reviewerName: z
    .string()
    .trim()
    .max(80, "Name is too long")
    .optional()
    .transform((value) => (value && value.length >= 2 ? value : undefined)),
});

export type SubmitProductReviewInput = z.infer<typeof submitProductReviewSchema>;
