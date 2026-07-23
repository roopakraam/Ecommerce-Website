import { z } from "zod";

const priceSchema = z
  .number({ error: "Price must be a number" })
  .min(0, "Price cannot be negative")
  .refine(
    (value) => Number.isFinite(value) && Math.round(value * 100) === value * 100,
    "Price must have at most 2 decimal places"
  );

export const adminProductVariantSchema = z.object({
  // Hidden inputs register as "" for new variants — treat blank as unset.
  id: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.string().uuid().optional()
  ),
  size: z.string().trim().min(1, "Size is required").max(40),
  color: z.string().trim().min(1, "Colour is required").max(40),
  // Blank is allowed in the form — server/action fills an auto SKU before save.
  sku: z.string().trim().max(80),
  stock_quantity: z.preprocess(
    (value) => (typeof value === "number" && Number.isNaN(value) ? 0 : value),
    z
      .number({ error: "Stock must be a number" })
      .int("Stock must be a whole number")
      .min(0, "Stock cannot be negative")
  ),
  price_override: z.preprocess(
    (value) => (typeof value === "number" && Number.isNaN(value) ? null : value),
    z
      .number({ error: "Override price must be a number" })
      .min(0, "Override price cannot be negative")
      .nullable()
  ),
  is_active: z.boolean(),
});

export const adminProductFormSchema = z
  .object({
    name: z.string().trim().min(1, "Title is required").max(200),
    description: z.union([z.string().trim().max(5000), z.literal("")]),
    price: z.preprocess(
      (value) => (typeof value === "number" && Number.isNaN(value) ? undefined : value),
      priceSchema
    ),
    category_id: z.union([
      z.string().uuid("Select a valid category"),
      z.literal(""),
    ]),
    is_active: z.boolean(),
    variants: z
      .array(adminProductVariantSchema)
      .min(1, "Add at least one size/colour variant"),
  })
  .superRefine((data, ctx) => {
    const seenSku = new Set<string>();
    const seenCombo = new Set<string>();

    data.variants.forEach((variant, index) => {
      const skuKey = variant.sku.toLowerCase();
      // Only enforce uniqueness for non-empty SKUs; blanks are auto-generated later.
      if (skuKey) {
        if (seenSku.has(skuKey)) {
          ctx.addIssue({
            code: "custom",
            path: ["variants", index, "sku"],
            message: "SKU must be unique",
          });
        }
        seenSku.add(skuKey);
      }

      const comboKey = `${variant.size.toLowerCase()}::${variant.color.toLowerCase()}`;
      if (seenCombo.has(comboKey)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "size"],
          message: "Duplicate size/colour combination",
        });
      }
      seenCombo.add(comboKey);

      if (
        variant.price_override != null &&
        !(
          Number.isFinite(variant.price_override) &&
          Math.round(variant.price_override * 100) ===
            variant.price_override * 100
        )
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index, "price_override"],
          message: "Override price must have at most 2 decimal places",
        });
      }
    });
  });

export type AdminProductFormInput = z.output<typeof adminProductFormSchema>;
export type AdminProductVariantInput = z.output<
  typeof adminProductVariantSchema
>;

export const adminProductImageSchema = z.object({
  url: z.string().url(),
  path: z.string().optional(),
  position: z.number().int().min(0),
});

export type AdminProductImageInput = z.infer<typeof adminProductImageSchema>;

export const COMMON_PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
