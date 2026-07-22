import { z } from "zod";

const optionalPositiveIntInput = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value === "" || value == null || value === undefined) {
      return null;
    }
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
      ctx.addIssue({
        code: "custom",
        message: "Must be a number",
      });
      return z.NEVER;
    }
    if (!Number.isInteger(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Must be a whole number greater than zero",
      });
      return z.NEVER;
    }
    return parsed;
  });

const optionalAmountInput = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value === "" || value == null || value === undefined) {
      return null;
    }
    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
      ctx.addIssue({
        code: "custom",
        message: "Must be a number",
      });
      return z.NEVER;
    }
    if (parsed < 0) {
      ctx.addIssue({
        code: "custom",
        message: "Cannot be negative",
      });
      return z.NEVER;
    }
    return parsed;
  });

export const adminCouponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Code is required")
      .max(40)
      .transform((value) => value.toUpperCase())
      .refine(
        (value) => /^[A-Z0-9_-]+$/.test(value),
        "Use letters, numbers, hyphens, or underscores only"
      ),
    discount_type: z.enum(["percentage", "fixed"]),
    discount_value: z.coerce
      .number({ error: "Value is required" })
      .positive("Value must be greater than zero"),
    starts_at: z.union([z.string(), z.literal("")]).optional(),
    ends_at: z.union([z.string(), z.literal("")]).optional(),
    usage_limit: optionalPositiveIntInput,
    per_customer_limit: optionalPositiveIntInput,
    min_order_amount: optionalAmountInput,
    is_active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.discount_type === "percentage" && data.discount_value > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["discount_value"],
        message: "Percentage cannot exceed 100",
      });
    }

    if (
      data.discount_type === "fixed" &&
      !(
        Number.isFinite(data.discount_value) &&
        Math.round(data.discount_value * 100) === data.discount_value * 100
      )
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["discount_value"],
        message: "Fixed amount must have at most 2 decimal places",
      });
    }

    const starts = data.starts_at?.trim() || "";
    const ends = data.ends_at?.trim() || "";
    if (starts && ends && new Date(ends) < new Date(starts)) {
      ctx.addIssue({
        code: "custom",
        path: ["ends_at"],
        message: "End date must be on or after start date",
      });
    }
  });

export type AdminCouponFormInput = z.input<typeof adminCouponFormSchema>;
export type AdminCouponFormValues = z.output<typeof adminCouponFormSchema>;

export function toIsoOrNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
