import { z } from "zod";

/** Indian pincode: 6 digits, first digit 1–9 */
const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode");

export const checkoutAddressSchema = z.object({
  line1: z.string().trim().min(1, "Address line 1 is required").max(200),
  line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z.string().trim().min(1, "State is required").max(100),
  pincode: pincodeSchema,
});

export type CheckoutAddressInput = z.infer<typeof checkoutAddressSchema>;

/** Matches orders.shipping_address jsonb shape */
export type CheckoutAddress = CheckoutAddressInput;
