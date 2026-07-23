import { z } from "zod";
import { checkoutAddressSchema } from "@/lib/validations/address";

export const checkoutItemSchema = z.object({
  productId: z.string().uuid("Invalid product id"),
  variantId: z.string().uuid("Invalid variant id"),
  quantity: z.coerce.number().int().min(1).max(20),
});

export const couponCodeSchema = z
  .string()
  .trim()
  .max(40, "Coupon code is too long")
  .transform((value) => (value ? value.toUpperCase() : ""))
  .refine(
    (value) => value === "" || /^[A-Z0-9_-]+$/.test(value),
    "Use letters, numbers, hyphens, or underscores only"
  );

const optionalEmailSchema = z
  .union([z.string().trim().email("Enter a valid email address"), z.literal("")])
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

const optionalPhoneSchema = z
  .union([
    z
      .string()
      .trim()
      .min(10, "Phone number must be at least 10 characters"),
    z.literal(""),
  ])
  .optional()
  .nullable()
  .transform((value) => (value ? value : null));

export const checkoutRequestSchema = z.object({
  fullName: z.string().trim().max(120).optional().nullable(),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  address: checkoutAddressSchema,
  saveAddress: z.boolean().optional().default(false),
  couponCode: couponCodeSchema.optional().nullable(),
  items: z
    .array(checkoutItemSchema)
    .min(1, "Cart is empty")
    .max(50, "Too many line items in cart"),
});

export const customerCheckoutFormSchema = z.object({
  fullName: z.string().trim().max(120).optional().nullable(),
  email: optionalEmailSchema,
  phone: optionalPhoneSchema,
  address: checkoutAddressSchema,
  saveAddress: z.boolean().optional().default(false),
  couponCode: couponCodeSchema.optional().nullable(),
});

export const validateCouponRequestSchema = z.object({
  code: couponCodeSchema,
  subtotal: z.coerce.number().min(0),
});

export type CheckoutRequestInput = z.infer<typeof checkoutRequestSchema>;
export type CustomerCheckoutFormInput = z.infer<
  typeof customerCheckoutFormSchema
>;
export type ValidateCouponRequestInput = z.infer<
  typeof validateCouponRequestSchema
>;
