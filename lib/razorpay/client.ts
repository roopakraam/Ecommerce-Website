import Razorpay from "razorpay";
import { resolveRazorpayCredentials } from "@/lib/integrations/resolve";

export async function getRazorpayClient() {
  const credentials = await resolveRazorpayCredentials();

  if (!credentials) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return new Razorpay({
    key_id: credentials.keyId,
    key_secret: credentials.keySecret,
  });
}

export async function getRazorpayKeyId(): Promise<string> {
  const credentials = await resolveRazorpayCredentials();
  if (!credentials?.keyId) {
    throw new Error("RAZORPAY_KEY_ID is not configured.");
  }
  return credentials.keyId;
}

export async function getRazorpayKeySecret(): Promise<string> {
  const credentials = await resolveRazorpayCredentials();
  if (!credentials?.keySecret) {
    throw new Error("Razorpay key secret is not configured.");
  }
  return credentials.keySecret;
}

export async function getRazorpayWebhookSecret(): Promise<string | null> {
  const credentials = await resolveRazorpayCredentials();
  const secret = credentials?.webhookSecret?.trim();
  return secret ? secret : null;
}

export function rupeesToPaise(amount: number): number {
  return Math.round(amount * 100);
}
