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

export interface RazorpayRefundResult {
  id: string;
  paymentId: string;
  amount: number;
  status: string;
}

/**
 * Full (or amount-specified) refund against a captured Razorpay payment.
 * Amount is in INR rupees; omit for a full refund of the payment.
 */
export async function createRazorpayRefund(params: {
  paymentId: string;
  amountRupees?: number;
  receipt?: string;
  notes?: Record<string, string>;
}): Promise<RazorpayRefundResult> {
  const razorpay = await getRazorpayClient();

  const payload: {
    amount?: number;
    speed: "normal";
    receipt?: string;
    notes?: Record<string, string>;
  } = {
    speed: "normal",
  };

  if (params.amountRupees !== undefined) {
    payload.amount = rupeesToPaise(params.amountRupees);
  }
  if (params.receipt) {
    payload.receipt = params.receipt.slice(0, 40);
  }
  if (params.notes && Object.keys(params.notes).length > 0) {
    payload.notes = params.notes;
  }

  try {
    const refund = (await razorpay.payments.refund(
      params.paymentId,
      payload
    )) as {
      id?: string;
      payment_id?: string;
      amount?: number | string;
      status?: string;
    };

    if (!refund?.id) {
      throw new Error("Razorpay refund response was missing an id.");
    }

    return {
      id: refund.id,
      paymentId: refund.payment_id ?? params.paymentId,
      amount: Number(refund.amount ?? 0),
      status: refund.status ?? "unknown",
    };
  } catch (error) {
    const message = extractRazorpayErrorMessage(error);
    throw new Error(message);
  }
}

function extractRazorpayErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Razorpay refund failed.";
  }

  const record = error as {
    message?: string;
    error?: { description?: string; code?: string; reason?: string };
    description?: string;
  };

  const description =
    record.error?.description ||
    record.description ||
    record.message ||
    null;

  if (description && description.trim()) {
    return description.trim();
  }

  return "Razorpay refund failed.";
}
