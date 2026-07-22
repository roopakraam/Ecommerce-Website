import { z } from "zod";

export const integrationProviderSchema = z.enum([
  "razorpay",
  "resend",
  "twilio_whatsapp",
]);

export const razorpayIntegrationSchema = z.object({
  provider: z.literal("razorpay"),
  is_enabled: z.boolean(),
  key_id: z.string().trim(),
  key_secret: z.string().trim(),
  webhook_secret: z.string().trim(),
});

export const resendIntegrationSchema = z.object({
  provider: z.literal("resend"),
  is_enabled: z.boolean(),
  api_key: z.string().trim(),
  from_email: z
    .string()
    .trim()
    .min(1, "From email is required.")
    .refine((value) => {
      // Allow "Name <email@domain.com>" or plain email
      const angle = value.match(/<([^>]+)>/);
      const email = (angle?.[1] ?? value).trim();
      return z.string().email().safeParse(email).success;
    }, "Enter a valid from email (or Name <email@domain.com>)."),
});

export const twilioIntegrationSchema = z.object({
  provider: z.literal("twilio_whatsapp"),
  is_enabled: z.boolean(),
  account_sid: z.string().trim(),
  auth_token: z.string().trim(),
  whatsapp_from: z
    .string()
    .trim()
    .min(1, "WhatsApp From is required.")
    .refine(
      (value) => value.startsWith("whatsapp:+") || value.startsWith("+"),
      "Use E.164 or whatsapp:+E.164 format."
    ),
  test_phone: z.string().trim().optional(),
});

export const saveIntegrationSchema = z.discriminatedUnion("provider", [
  razorpayIntegrationSchema,
  resendIntegrationSchema,
  twilioIntegrationSchema,
]);

export type RazorpayIntegrationInput = z.input<typeof razorpayIntegrationSchema>;
export type RazorpayIntegrationValues = z.output<typeof razorpayIntegrationSchema>;
export type ResendIntegrationInput = z.input<typeof resendIntegrationSchema>;
export type ResendIntegrationValues = z.output<typeof resendIntegrationSchema>;
export type TwilioIntegrationInput = z.input<typeof twilioIntegrationSchema>;
export type TwilioIntegrationValues = z.output<typeof twilioIntegrationSchema>;
export type SaveIntegrationValues = z.output<typeof saveIntegrationSchema>;

export const testIntegrationSchema = z.object({
  provider: integrationProviderSchema,
  test_phone: z.string().trim().optional(),
});

export const disconnectIntegrationSchema = z.object({
  provider: integrationProviderSchema,
});
