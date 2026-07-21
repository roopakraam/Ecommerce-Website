import { z } from "zod";
import { checkoutAddressSchema } from "@/lib/validations/address";

export const checkoutItemSchema = z.object({
  productId: z.string().uuid("Invalid product id"),
  quantity: z.coerce.number().int().min(1).max(20),
});

const guestFieldsSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(20, "Enter a valid phone number"),
});

const baseCheckoutSchema = z.object({
  isGuest: z.boolean(),
  fullName: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  address: checkoutAddressSchema,
  saveAddress: z.boolean().optional().default(false),
  items: z.array(checkoutItemSchema).min(1, "Cart is empty"),
});

export const checkoutRequestSchema = baseCheckoutSchema.superRefine(
  (data, ctx) => {
    if (data.isGuest) {
      const emailResult = guestFieldsSchema.shape.email.safeParse(data.email);
      if (!emailResult.success) {
        ctx.addIssue({
          code: "custom",
          path: ["email"],
          message: "Enter a valid email",
        });
      }

      const phoneResult = guestFieldsSchema.shape.phone.safeParse(data.phone);
      if (!phoneResult.success) {
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Enter a valid phone number",
        });
      }
    }
  }
);

export const guestCheckoutFormSchema = z.object({
  fullName: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number")
    .max(20, "Enter a valid phone number"),
  address: checkoutAddressSchema,
  saveAddress: z.boolean().optional().default(false),
});

export const customerCheckoutFormSchema = z.object({
  fullName: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  address: checkoutAddressSchema,
  saveAddress: z.boolean().optional().default(false),
});

export type CheckoutRequestInput = z.infer<typeof checkoutRequestSchema>;
export type GuestCheckoutFormInput = z.infer<typeof guestCheckoutFormSchema>;
export type CustomerCheckoutFormInput = z.infer<
  typeof customerCheckoutFormSchema
>;
