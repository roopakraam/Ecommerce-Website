"use server";

import { revalidatePath } from "next/cache";
import {
  ADMIN_INTEGRATIONS_PATH,
  disconnectIntegration,
  getAdminIntegrations,
  recordIntegrationTestResult,
  saveIntegrationCredentials,
} from "@/lib/db/admin-integrations";
import { ResendEmailProvider } from "@/lib/notifications/providers/email";
import {
  TwilioWhatsAppProvider,
  toE164Phone,
} from "@/lib/notifications/providers/whatsapp";
import { getRazorpayClient } from "@/lib/razorpay/client";
import {
  resolveRazorpayCredentials,
  resolveResendCredentials,
  resolveTwilioWhatsAppCredentials,
} from "@/lib/integrations/resolve";
import { createServerClient } from "@/lib/supabase/server";
import {
  disconnectIntegrationSchema,
  saveIntegrationSchema,
  testIntegrationSchema,
} from "@/lib/validations/admin-integrations";
import type { IntegrationProvider } from "@/types/integrations";

export type IntegrationMutationResult =
  | { success: true; message?: string }
  | { success: false; error: string };

function revalidateIntegrations() {
  revalidatePath(ADMIN_INTEGRATIONS_PATH);
  revalidatePath("/admin/dashboard/integrations");
}

export async function saveIntegrationAction(input: {
  form: unknown;
}): Promise<IntegrationMutationResult> {
  const parsed = saveIntegrationSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid integration details.",
    };
  }

  try {
    const data = parsed.data;

    if (data.provider === "razorpay") {
      await saveIntegrationCredentials({
        provider: "razorpay",
        isEnabled: data.is_enabled,
        config: {},
        secrets: {
          key_id: data.key_id,
          key_secret: data.key_secret,
          webhook_secret: data.webhook_secret,
        },
      });
    } else if (data.provider === "resend") {
      await saveIntegrationCredentials({
        provider: "resend",
        isEnabled: data.is_enabled,
        config: { from_email: data.from_email },
        secrets: { api_key: data.api_key },
      });
    } else {
      await saveIntegrationCredentials({
        provider: "twilio_whatsapp",
        isEnabled: data.is_enabled,
        config: { whatsapp_from: data.whatsapp_from },
        secrets: {
          account_sid: data.account_sid,
          auth_token: data.auth_token,
        },
      });
    }

    revalidateIntegrations();
    return { success: true, message: "Credentials saved." };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save integration credentials.",
    };
  }
}

export async function disconnectIntegrationAction(input: {
  provider: unknown;
}): Promise<IntegrationMutationResult> {
  const parsed = disconnectIntegrationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid provider." };
  }

  try {
    await disconnectIntegration(parsed.data.provider);
    revalidateIntegrations();
    return { success: true, message: "Integration disconnected." };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to disconnect integration.",
    };
  }
}

async function testRazorpay(): Promise<string> {
  const client = await getRazorpayClient();
  await client.payments.all({ count: 1 });
  const creds = await resolveRazorpayCredentials();
  return `Connected via ${creds?.source ?? "unknown"} credentials.`;
}

async function testResend(adminEmail: string): Promise<string> {
  if (!adminEmail) {
    throw new Error("Your admin account has no email for the test send.");
  }

  const creds = await resolveResendCredentials();
  if (!creds) {
    throw new Error("Resend is not configured (DB or env).");
  }

  const provider = new ResendEmailProvider(creds.apiKey, creds.fromEmail);
  await provider.send({
    to: adminEmail,
    subject: "BOOK MY TEES — Resend connection test",
    text: "Your Resend integration is working.",
    html: "<p>Your Resend integration is working.</p>",
  });

  return `Test email sent to ${adminEmail} (via ${creds.source}).`;
}

async function resolveTestPhone(testPhone?: string): Promise<string> {
  const trimmed = testPhone?.trim() ?? "";
  if (trimmed) {
    return trimmed;
  }

  const supabase = await createServerClient();
  const { data } = await supabase
    .from("store_settings")
    .select("admin_notify_phone")
    .eq("id", 1)
    .maybeSingle();

  return (
    (data as { admin_notify_phone?: string | null } | null)
      ?.admin_notify_phone ?? ""
  ).trim();
}

async function testTwilio(testPhone?: string): Promise<string> {
  const destination = await resolveTestPhone(testPhone);
  if (!destination) {
    throw new Error(
      "Enter a test phone or set Admin notify phone in Settings → Notifications."
    );
  }

  const e164 = toE164Phone(destination);
  if (!e164) {
    throw new Error(
      "Test phone must be a valid E.164 or 10-digit Indian number."
    );
  }

  const creds = await resolveTwilioWhatsAppCredentials();
  if (!creds) {
    throw new Error("Twilio WhatsApp is not configured (DB or env).");
  }

  const provider = new TwilioWhatsAppProvider(
    creds.accountSid,
    creds.authToken,
    creds.whatsappFrom
  );
  await provider.send({
    to: e164,
    body: "BOOK MY TEES — Twilio WhatsApp connection test. Your integration is working.",
  });

  return `Test WhatsApp sent to ${e164} (via ${creds.source}).`;
}

export async function testIntegrationAction(input: {
  provider: unknown;
  test_phone?: unknown;
}): Promise<IntegrationMutationResult> {
  const parsed = testIntegrationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid test request." };
  }

  const provider = parsed.data.provider as IntegrationProvider;

  try {
    let message: string;

    if (provider === "razorpay") {
      message = await testRazorpay();
    } else if (provider === "resend") {
      const bundle = await getAdminIntegrations();
      message = await testResend(bundle.adminEmail);
    } else {
      message = await testTwilio(parsed.data.test_phone);
    }

    await recordIntegrationTestResult({
      provider,
      status: "success",
      message,
    });
    revalidateIntegrations();
    return { success: true, message };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Connection test failed.";

    try {
      await recordIntegrationTestResult({
        provider,
        status: "error",
        message,
      });
      revalidateIntegrations();
    } catch {
      // ignore secondary failure
    }

    return { success: false, error: message };
  }
}
