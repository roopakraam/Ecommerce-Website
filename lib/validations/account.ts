import { z } from "zod";

export const updateAccountProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(120, "Name is too long"),
  phone: z
    .string()
    .trim()
    .max(20, "Enter a valid phone number")
    .superRefine((value, ctx) => {
      if (value.length > 0 && value.length < 10) {
        ctx.addIssue({
          code: "custom",
          message: "Enter a valid phone number",
        });
      }
    }),
});

export const accountAddressIdSchema = z.object({
  addressId: z.string().uuid("Invalid address"),
});

export type UpdateAccountProfileInput = z.infer<typeof updateAccountProfileSchema>;
export type AccountAddressIdInput = z.infer<typeof accountAddressIdSchema>;
