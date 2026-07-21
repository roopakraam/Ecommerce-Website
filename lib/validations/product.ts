import { z } from "zod";

const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(200)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and hyphens only"
  );

const priceSchema = z.coerce
  .number({ error: "Price must be a number" })
  .min(0, "Price cannot be negative")
  .refine(
    (value) => Number.isFinite(value) && Math.round(value * 100) === value * 100,
    "Price must have at most 2 decimal places"
  );

const productFieldsSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    slug: slugSchema,
    description: z.string().trim().max(5000).optional().nullable(),
    price: priceSchema,
    compare_at_price: priceSchema.optional().nullable(),
    category_id: z.string().uuid("Select a valid category").optional().nullable(),
    stock_quantity: z.coerce
      .number({ error: "Stock must be a number" })
      .int("Stock must be a whole number")
      .min(0, "Stock cannot be negative"),
    is_active: z.boolean().default(true),
  })
  .refine(
    (data) =>
      data.compare_at_price == null || data.compare_at_price >= data.price,
    {
      message: "Compare-at price must be greater than or equal to price",
      path: ["compare_at_price"],
    }
  );

export const productCreateSchema = productFieldsSchema;

export const productEditSchema = productFieldsSchema.safeExtend({
  id: z.string().uuid("Invalid product id"),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductEditInput = z.infer<typeof productEditSchema>;
