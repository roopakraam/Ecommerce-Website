import { z } from "zod";

export const adjustInventorySchema = z.object({
  variantId: z.string().uuid("Invalid variant id"),
  delta: z
    .number({ error: "Adjustment must be a number" })
    .int("Adjustment must be a whole number")
    .refine((value) => value !== 0, "Adjustment cannot be zero"),
  reason: z.string().trim().max(500).optional(),
});

export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
