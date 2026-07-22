import { z } from "zod";

const optionalText = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    const trimmed = (value ?? "").trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const optionalEmail = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return null;
    const result = z.string().email("Enter a valid email").safeParse(trimmed);
    if (!result.success) {
      ctx.addIssue({
        code: "custom",
        message: result.error.issues[0]?.message ?? "Enter a valid email",
      });
      return z.NEVER;
    }
    return result.data;
  });

const optionalAmount = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value === "" || value == null || value === undefined) {
      return null;
    }
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
      ctx.addIssue({ code: "custom", message: "Must be a number" });
      return z.NEVER;
    }
    if (parsed < 0) {
      ctx.addIssue({ code: "custom", message: "Cannot be negative" });
      return z.NEVER;
    }
    return Math.round(parsed * 100) / 100;
  });

const optionalDays = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value === "" || value == null || value === undefined) {
      return null;
    }
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
      ctx.addIssue({
        code: "custom",
        message: "Must be a whole number ≥ 0",
      });
      return z.NEVER;
    }
    return parsed;
  });

export const storeDetailsSchema = z.object({
  store_name: z
    .string()
    .trim()
    .min(2, "Store name is required")
    .max(80, "Keep the store name under 80 characters"),
  currency: z.enum(["INR", "USD"]),
  tax_rate: z.coerce
    .number({ error: "Tax rate is required" })
    .min(0, "Tax rate cannot be negative")
    .max(100, "Tax rate cannot exceed 100"),
  support_email: optionalEmail,
  support_phone: optionalText,
});

export const notificationPreferencesSchema = z.object({
  notify_email_customer: z.boolean(),
  notify_whatsapp_customer: z.boolean(),
  notify_email_admin: z.boolean(),
  notify_whatsapp_admin: z.boolean(),
  notify_low_stock: z.boolean(),
  admin_notify_email: optionalEmail,
  admin_notify_phone: optionalText,
});

export const shippingZoneFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Zone name is required")
      .max(80),
    states_text: z.string().max(2000).default(""),
    flat_rate: z.coerce
      .number({ error: "Flat rate is required" })
      .min(0, "Flat rate cannot be negative"),
    free_above: optionalAmount,
    estimated_days_min: optionalDays,
    estimated_days_max: optionalDays,
    is_active: z.boolean(),
    sort_order: z.coerce.number().int().min(0).max(999).default(0),
  })
  .superRefine((data, ctx) => {
    if (
      data.estimated_days_min != null &&
      data.estimated_days_max != null &&
      data.estimated_days_max < data.estimated_days_min
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["estimated_days_max"],
        message: "Max days must be ≥ min days",
      });
    }
  });

export const adminProfileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .max(80, "Keep the name under 80 characters")
    .transform((value) => (value.length > 0 ? value : null)),
});

export const adminPasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(72, "Password is too long"),
    confirm_password: z.string().min(1, "Confirm your new password"),
  })
  .superRefine((data, ctx) => {
    if (data.new_password !== data.confirm_password) {
      ctx.addIssue({
        code: "custom",
        path: ["confirm_password"],
        message: "Passwords do not match",
      });
    }
    if (data.current_password === data.new_password) {
      ctx.addIssue({
        code: "custom",
        path: ["new_password"],
        message: "New password must be different",
      });
    }
  });

export type StoreDetailsInput = z.input<typeof storeDetailsSchema>;
export type StoreDetailsValues = z.output<typeof storeDetailsSchema>;
export type NotificationPreferencesInput = z.input<
  typeof notificationPreferencesSchema
>;
export type NotificationPreferencesValues = z.output<
  typeof notificationPreferencesSchema
>;
export type ShippingZoneFormInput = z.input<typeof shippingZoneFormSchema>;
export type ShippingZoneFormValues = z.output<typeof shippingZoneFormSchema>;
export type AdminProfileInput = z.input<typeof adminProfileSchema>;
export type AdminProfileValues = z.output<typeof adminProfileSchema>;
export type AdminPasswordInput = z.input<typeof adminPasswordSchema>;
export type AdminPasswordValues = z.output<typeof adminPasswordSchema>;

export function parseStatesText(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      part
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ")
    );
}

export function formatStatesText(states: string[]): string {
  return states.join(", ");
}
