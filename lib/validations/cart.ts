import { z } from "zod";

export const cartLineSchema = z.object({
  variantId: z.string().uuid("Invalid variant id"),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const cartReplaceSchema = z.object({
  items: z.array(cartLineSchema),
});

export const cartMergeSchema = z.object({
  items: z.array(cartLineSchema),
});

export type CartLineInput = z.infer<typeof cartLineSchema>;
export type CartReplaceInput = z.infer<typeof cartReplaceSchema>;
export type CartMergeInput = z.infer<typeof cartMergeSchema>;
