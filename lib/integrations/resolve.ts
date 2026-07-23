import { createAdminClient } from "@/lib/supabase/admin";
import { decryptJson } from "@/lib/integrations/crypto";
import type {
  IntegrationCredentialRow,
  IntegrationProvider,
  ResolvedResendCredentials,
  ResolvedRazorpayCredentials,
  ResolvedTwilioWhatsAppCredentials,
} from "@/types/integrations";

function isMissingRelationError(message: string, relation: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(relation.toLowerCase()) &&
    (lower.includes("does not exist") || lower.includes("schema cache"))
  );
}

async function loadCredentialRow(
  provider: IntegrationProvider
): Promise<IntegrationCredentialRow | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("integration_credentials")
      .select("*")
      .eq("provider", provider)
      .maybeSingle();

    if (error) {
      if (isMissingRelationError(error.message, "integration_credentials")) {
        return null;
      }
      console.error(
        `[integrations] Failed to load ${provider} credentials:`,
        error.message
      );
      return null;
    }

    return (data as IntegrationCredentialRow | null) ?? null;
  } catch (error) {
    console.error(`[integrations] Unexpected error loading ${provider}:`, error);
    return null;
  }
}

function readDbSecrets(
  row: IntegrationCredentialRow | null
): Record<string, string> | null {
  if (!row?.is_enabled || !row.secrets_encrypted) {
    return null;
  }

  try {
    return decryptJson(row.secrets_encrypted);
  } catch (error) {
    console.error(
      `[integrations] Failed to decrypt ${row.provider} secrets:`,
      error
    );
    return null;
  }
}

function configString(
  config: Record<string, unknown> | undefined,
  key: string
): string {
  const value = config?.[key];
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Resolve Razorpay credentials: DB (enabled + secrets) → env → null.
 */
export async function resolveRazorpayCredentials(): Promise<ResolvedRazorpayCredentials | null> {
  const row = await loadCredentialRow("razorpay");
  const secrets = readDbSecrets(row);

  const envWebhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";

  if (secrets?.key_id && secrets?.key_secret) {
    return {
      keyId: secrets.key_id,
      keySecret: secrets.key_secret,
      // Prefer DB webhook secret; fall back to env so partial DB config still works.
      webhookSecret: (secrets.webhook_secret ?? "").trim() || envWebhookSecret,
      source: "database",
    };
  }

  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (keyId && keySecret) {
    return {
      keyId,
      keySecret,
      webhookSecret: envWebhookSecret,
      source: "env",
    };
  }

  return null;
}

/**
 * Resolve Resend credentials: DB → env → null.
 */
export async function resolveResendCredentials(): Promise<ResolvedResendCredentials | null> {
  const row = await loadCredentialRow("resend");
  const secrets = readDbSecrets(row);
  const fromEmail =
    configString(row?.config, "from_email") ||
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "";

  if (secrets?.api_key && fromEmail) {
    return {
      apiKey: secrets.api_key,
      fromEmail,
      source: "database",
    };
  }

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const envFrom = process.env.RESEND_FROM_EMAIL?.trim();

  if (apiKey && envFrom) {
    return {
      apiKey,
      fromEmail: envFrom,
      source: "env",
    };
  }

  return null;
}

/**
 * Resolve Twilio WhatsApp credentials: DB → env → null.
 */
export async function resolveTwilioWhatsAppCredentials(): Promise<ResolvedTwilioWhatsAppCredentials | null> {
  const row = await loadCredentialRow("twilio_whatsapp");
  const secrets = readDbSecrets(row);
  const whatsappFrom =
    configString(row?.config, "whatsapp_from") ||
    process.env.TWILIO_WHATSAPP_FROM?.trim() ||
    "";

  if (secrets?.account_sid && secrets?.auth_token && whatsappFrom) {
    return {
      accountSid: secrets.account_sid,
      authToken: secrets.auth_token,
      whatsappFrom,
      source: "database",
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const envFrom = process.env.TWILIO_WHATSAPP_FROM?.trim();

  if (accountSid && authToken && envFrom) {
    return {
      accountSid,
      authToken,
      whatsappFrom: envFrom,
      source: "env",
    };
  }

  return null;
}

export async function hasEnvFallback(
  provider: IntegrationProvider
): Promise<boolean> {
  switch (provider) {
    case "razorpay":
      return Boolean(
        process.env.RAZORPAY_KEY_ID?.trim() &&
          process.env.RAZORPAY_KEY_SECRET?.trim()
      );
    case "resend":
      return Boolean(
        process.env.RESEND_API_KEY?.trim() &&
          process.env.RESEND_FROM_EMAIL?.trim()
      );
    case "twilio_whatsapp":
      return Boolean(
        process.env.TWILIO_ACCOUNT_SID?.trim() &&
          process.env.TWILIO_AUTH_TOKEN?.trim() &&
          process.env.TWILIO_WHATSAPP_FROM?.trim()
      );
    default:
      return false;
  }
}
