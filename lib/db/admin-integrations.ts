import { createServerClient } from "@/lib/supabase/server";
import {
  decryptJson,
  encryptJson,
  isEncryptionKeyConfigured,
  maskSecret,
} from "@/lib/integrations/crypto";
import { hasEnvFallback } from "@/lib/integrations/resolve";
import type { AdminUser } from "@/types";
import type {
  IntegrationConnectionStatus,
  IntegrationCredentialRow,
  IntegrationCredentialSource,
  IntegrationProvider,
  IntegrationProviderCard,
  IntegrationTestStatus,
} from "@/types/integrations";

export const ADMIN_INTEGRATIONS_PATH = "/admin/integrations";

export const INTEGRATION_PROVIDERS: IntegrationProvider[] = [
  "razorpay",
  "resend",
  "twilio_whatsapp",
];

const PROVIDER_META: Record<
  IntegrationProvider,
  { title: string; description: string }
> = {
  razorpay: {
    title: "Razorpay",
    description: "Accept payments and verify checkout + webhook signatures.",
  },
  resend: {
    title: "Email (Resend)",
    description: "Transactional email for order confirmations and alerts.",
  },
  twilio_whatsapp: {
    title: "WhatsApp (Twilio)",
    description: "Order and status updates via Twilio WhatsApp.",
  },
};

/** Deterministic UUIDs for audit_logs.entity_id (uuid column). */
const PROVIDER_AUDIT_IDS: Record<IntegrationProvider, string> = {
  razorpay: "a1000000-0000-4000-8000-000000000001",
  resend: "a1000000-0000-4000-8000-000000000002",
  twilio_whatsapp: "a1000000-0000-4000-8000-000000000003",
};

const MIGRATION_HINT =
  "Integrations require migration 20260722100000_integration_credentials.sql.";

export interface AdminIntegrationsBundle {
  providers: IntegrationProviderCard[];
  encryptionKeyConfigured: boolean;
  siteUrl: string;
  integrationsAvailable: boolean;
  adminEmail: string;
}

export interface SaveIntegrationInput {
  provider: IntegrationProvider;
  isEnabled: boolean;
  config: Record<string, string>;
  /** Blank secret fields keep existing encrypted values. */
  secrets: Record<string, string>;
}

async function assertAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: adminRow, error } = await supabase
    .from("admin_users")
    .select("id, auth_user_id, role, display_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !adminRow) {
    throw new Error("You do not have admin access.");
  }

  return {
    supabase,
    user,
    admin: adminRow as AdminUser,
  };
}

function isMissingRelationError(message: string, relation: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(relation.toLowerCase()) &&
    (lower.includes("does not exist") || lower.includes("schema cache"))
  );
}

function siteBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return raw.replace(/\/$/, "") || "http://localhost:3000";
}

function razorpayWebhookUrl(): string {
  return `${siteBaseUrl()}/api/payments/razorpay/webhook`;
}

function normalizeConfig(
  provider: IntegrationProvider,
  config: Record<string, unknown> | null | undefined
): Record<string, string> {
  const raw = config ?? {};
  if (provider === "resend") {
    return {
      from_email:
        typeof raw.from_email === "string" ? raw.from_email.trim() : "",
    };
  }
  if (provider === "twilio_whatsapp") {
    return {
      whatsapp_from:
        typeof raw.whatsapp_from === "string" ? raw.whatsapp_from.trim() : "",
    };
  }
  return {};
}

function normalizeMask(
  mask: Record<string, unknown> | null | undefined
): Record<string, string> {
  const result: Record<string, string> = {};
  if (!mask) return result;
  for (const [key, value] of Object.entries(mask)) {
    if (typeof value === "string" && value) {
      result[key] = value;
    }
  }
  return result;
}

function hasDbSecrets(row: IntegrationCredentialRow | null): boolean {
  return Boolean(row?.secrets_encrypted && row.is_enabled);
}

function computeStatus(
  row: IntegrationCredentialRow | null,
  envConfigured: boolean
): IntegrationConnectionStatus {
  if (row?.last_test_status === "error") {
    return "error";
  }
  if (hasDbSecrets(row) || envConfigured) {
    return "configured";
  }
  return "not_configured";
}

function computeSource(
  row: IntegrationCredentialRow | null,
  envConfigured: boolean
): IntegrationCredentialSource {
  if (hasDbSecrets(row)) {
    return "database";
  }
  if (envConfigured) {
    return "env";
  }
  return "none";
}

function toCard(
  provider: IntegrationProvider,
  row: IntegrationCredentialRow | null,
  envConfigured: boolean
): IntegrationProviderCard {
  const meta = PROVIDER_META[provider];
  return {
    provider,
    title: meta.title,
    description: meta.description,
    isEnabled: row?.is_enabled ?? true,
    status: computeStatus(row, envConfigured),
    source: computeSource(row, envConfigured),
    config: normalizeConfig(provider, row?.config),
    secretsMask: normalizeMask(row?.secrets_mask),
    lastTestedAt: row?.last_tested_at ?? null,
    lastTestStatus: row?.last_test_status ?? null,
    lastTestMessage: row?.last_test_message ?? null,
    webhookUrl: provider === "razorpay" ? razorpayWebhookUrl() : undefined,
  };
}

async function writeIntegrationAudit(input: {
  supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"];
  provider: IntegrationProvider;
  action: string;
  actorAuthUserId: string;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}) {
  const { error } = await input.supabase.from("audit_logs").insert({
    entity_type: "integration",
    entity_id: PROVIDER_AUDIT_IDS[input.provider],
    action: input.action,
    actor_auth_user_id: input.actorAuthUserId,
    previous_values: input.previousValues ?? null,
    new_values: input.newValues ?? null,
    metadata: {
      provider: input.provider,
      ...(input.metadata ?? {}),
    },
  });

  if (error) {
    console.error("Failed to write integration audit log:", error.message);
    if (isMissingRelationError(error.message, "audit_logs")) {
      return;
    }
  }
}

export async function getAdminIntegrations(): Promise<AdminIntegrationsBundle> {
  const { supabase, user } = await assertAdmin();

  const { data, error } = await supabase
    .from("integration_credentials")
    .select("*");

  if (error) {
    if (isMissingRelationError(error.message, "integration_credentials")) {
      const providers = await Promise.all(
        INTEGRATION_PROVIDERS.map(async (provider) =>
          toCard(provider, null, await hasEnvFallback(provider))
        )
      );
      return {
        providers,
        encryptionKeyConfigured: isEncryptionKeyConfigured(),
        siteUrl: siteBaseUrl(),
        integrationsAvailable: false,
        adminEmail: user.email ?? "",
      };
    }
    throw new Error(error.message);
  }

  const rows = (data ?? []) as IntegrationCredentialRow[];
  const byProvider = new Map(rows.map((row) => [row.provider, row]));

  const providers = await Promise.all(
    INTEGRATION_PROVIDERS.map(async (provider) =>
      toCard(
        provider,
        byProvider.get(provider) ?? null,
        await hasEnvFallback(provider)
      )
    )
  );

  return {
    providers,
    encryptionKeyConfigured: isEncryptionKeyConfigured(),
    siteUrl: siteBaseUrl(),
    integrationsAvailable: true,
    adminEmail: user.email ?? "",
  };
}

function buildSecretMask(
  provider: IntegrationProvider,
  secrets: Record<string, string>
): Record<string, string> {
  const mask: Record<string, string> = {};
  if (provider === "razorpay") {
    if (secrets.key_id) mask.key_id = maskSecret(secrets.key_id, 8);
    if (secrets.key_secret) mask.key_secret = maskSecret(secrets.key_secret);
    if (secrets.webhook_secret) {
      mask.webhook_secret = maskSecret(secrets.webhook_secret);
    }
  } else if (provider === "resend") {
    if (secrets.api_key) mask.api_key = maskSecret(secrets.api_key, 5);
  } else if (provider === "twilio_whatsapp") {
    if (secrets.account_sid) {
      mask.account_sid = maskSecret(secrets.account_sid, 4);
    }
    if (secrets.auth_token) mask.auth_token = maskSecret(secrets.auth_token);
  }
  return mask;
}

function mergeSecrets(
  existingEncrypted: string | null,
  incoming: Record<string, string>
): Record<string, string> {
  let existing: Record<string, string> = {};
  if (existingEncrypted) {
    try {
      existing = decryptJson(existingEncrypted);
    } catch {
      existing = {};
    }
  }

  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    const trimmed = value.trim();
    if (trimmed) {
      merged[key] = trimmed;
    }
  }
  return merged;
}

export async function saveIntegrationCredentials(
  input: SaveIntegrationInput
): Promise<IntegrationProviderCard> {
  const { supabase, user } = await assertAdmin();

  if (!isEncryptionKeyConfigured()) {
    throw new Error(
      "Set INTEGRATIONS_ENCRYPTION_KEY before saving credentials (openssl rand -base64 32)."
    );
  }

  const { data: existing, error: loadError } = await supabase
    .from("integration_credentials")
    .select("*")
    .eq("provider", input.provider)
    .maybeSingle();

  if (loadError) {
    if (isMissingRelationError(loadError.message, "integration_credentials")) {
      throw new Error(MIGRATION_HINT);
    }
    throw new Error(loadError.message);
  }

  const existingRow = (existing as IntegrationCredentialRow | null) ?? null;
  const mergedSecrets = mergeSecrets(
    existingRow?.secrets_encrypted ?? null,
    input.secrets
  );

  const requiredKeys =
    input.provider === "razorpay"
      ? ["key_id", "key_secret"]
      : input.provider === "resend"
        ? ["api_key"]
        : ["account_sid", "auth_token"];

  for (const key of requiredKeys) {
    if (!mergedSecrets[key]) {
      throw new Error(
        `Missing required secret: ${key.replace(/_/g, " ")}. Enter it to save.`
      );
    }
  }

  if (input.provider === "resend" && !input.config.from_email?.trim()) {
    throw new Error("From email is required.");
  }
  if (
    input.provider === "twilio_whatsapp" &&
    !input.config.whatsapp_from?.trim()
  ) {
    throw new Error("WhatsApp From number is required.");
  }

  const config = normalizeConfig(input.provider, input.config);
  const secretsEncrypted = encryptJson(mergedSecrets);
  const secretsMask = buildSecretMask(input.provider, mergedSecrets);

  const payload = {
    provider: input.provider,
    is_enabled: input.isEnabled,
    config,
    secrets_encrypted: secretsEncrypted,
    secrets_mask: secretsMask,
    updated_by: user.id,
  };

  const { data, error } = await supabase
    .from("integration_credentials")
    .upsert(payload, { onConflict: "provider" })
    .select("*")
    .single();

  if (error || !data) {
    if (error && isMissingRelationError(error.message, "integration_credentials")) {
      throw new Error(MIGRATION_HINT);
    }
    throw new Error(error?.message ?? "Failed to save integration credentials.");
  }

  await writeIntegrationAudit({
    supabase,
    provider: input.provider,
    action: existingRow ? "integration.updated" : "integration.created",
    actorAuthUserId: user.id,
    previousValues: existingRow
      ? {
          is_enabled: existingRow.is_enabled,
          config: existingRow.config,
          secrets_mask: existingRow.secrets_mask,
        }
      : null,
    newValues: {
      is_enabled: input.isEnabled,
      config,
      secrets_mask: secretsMask,
    },
  });

  return toCard(
    input.provider,
    data as IntegrationCredentialRow,
    await hasEnvFallback(input.provider)
  );
}

export async function disconnectIntegration(
  provider: IntegrationProvider
): Promise<IntegrationProviderCard> {
  const { supabase, user } = await assertAdmin();

  const { data: existing } = await supabase
    .from("integration_credentials")
    .select("*")
    .eq("provider", provider)
    .maybeSingle();

  const existingRow = (existing as IntegrationCredentialRow | null) ?? null;

  const { data, error } = await supabase
    .from("integration_credentials")
    .upsert(
      {
        provider,
        is_enabled: false,
        config: {},
        secrets_encrypted: null,
        secrets_mask: {},
        last_tested_at: null,
        last_test_status: null,
        last_test_message: null,
        updated_by: user.id,
      },
      { onConflict: "provider" }
    )
    .select("*")
    .single();

  if (error || !data) {
    if (error && isMissingRelationError(error.message, "integration_credentials")) {
      throw new Error(MIGRATION_HINT);
    }
    throw new Error(error?.message ?? "Failed to disconnect integration.");
  }

  await writeIntegrationAudit({
    supabase,
    provider,
    action: "integration.disconnected",
    actorAuthUserId: user.id,
    previousValues: existingRow
      ? {
          is_enabled: existingRow.is_enabled,
          secrets_mask: existingRow.secrets_mask,
        }
      : null,
    newValues: { is_enabled: false, secrets_mask: {} },
  });

  return toCard(
    provider,
    data as IntegrationCredentialRow,
    await hasEnvFallback(provider)
  );
}

export async function recordIntegrationTestResult(input: {
  provider: IntegrationProvider;
  status: IntegrationTestStatus;
  message: string;
}): Promise<void> {
  const { supabase, user } = await assertAdmin();

  const testedAt = new Date().toISOString();
  const message = input.message.slice(0, 500);

  const { data: existing, error: loadError } = await supabase
    .from("integration_credentials")
    .select("provider")
    .eq("provider", input.provider)
    .maybeSingle();

  if (loadError) {
    if (isMissingRelationError(loadError.message, "integration_credentials")) {
      throw new Error(MIGRATION_HINT);
    }
    console.error("Failed to load integration for test record:", loadError.message);
  }

  if (existing) {
    const { error } = await supabase
      .from("integration_credentials")
      .update({
        last_tested_at: testedAt,
        last_test_status: input.status,
        last_test_message: message,
        updated_by: user.id,
      })
      .eq("provider", input.provider);

    if (error) {
      console.error("Failed to record integration test:", error.message);
    }
  } else {
    const { error } = await supabase.from("integration_credentials").insert({
      provider: input.provider,
      last_tested_at: testedAt,
      last_test_status: input.status,
      last_test_message: message,
      updated_by: user.id,
    });

    if (error) {
      if (isMissingRelationError(error.message, "integration_credentials")) {
        throw new Error(MIGRATION_HINT);
      }
      console.error("Failed to record integration test:", error.message);
    }
  }

  await writeIntegrationAudit({
    supabase,
    provider: input.provider,
    action: "integration.tested",
    actorAuthUserId: user.id,
    newValues: {
      last_test_status: input.status,
      last_test_message: message.slice(0, 200),
    },
  });
}
