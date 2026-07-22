import { z } from "zod";

export const customerLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const customerSignupSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(120, "Name is too long"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().max(20, "Enter a valid phone number").optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm your password"),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "Passwords do not match",
    });
  }

  if (data.phone && data.phone.length > 0 && data.phone.length < 10) {
    ctx.addIssue({
      code: "custom",
      path: ["phone"],
      message: "Enter a valid phone number",
    });
  }
});

export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;
