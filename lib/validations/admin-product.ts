import { z } from "zod";

const priceSchema = z
  .number({ error: "Price must be a number" })
  .min(0, "Price cannot be negative")
  .refine(
    (value) => Number.isFinite(value) && Math.round(value * 100) === value * 100,
    "Price must have at most 2 decimal places"
  );

export const adminProductFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  description: z.union([z.string().trim().max(5000), z.literal("")]),
  price: priceSchema,
  stock_quantity: z
    .number({ error: "Stock must be a number" })
    .int("Stock must be a whole number")
    .min(0, "Stock cannot be negative"),
  category_id: z.union([
    z.string().uuid("Select a valid category"),
    z.literal(""),
  ]),
  is_active: z.boolean(),
});

export type AdminProductFormInput = z.infer<typeof adminProductFormSchema>;

export const adminProductImageSchema = z.object({
  url: z.string().url(),
  path: z.string().optional(),
  position: z.number().int().min(0),
});

export type AdminProductImageInput = z.infer<typeof adminProductImageSchema>;
