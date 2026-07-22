export type IntegrationProvider =
  | "razorpay"
  | "resend"
  | "twilio_whatsapp";

export type IntegrationTestStatus = "success" | "error";

export type IntegrationConnectionStatus =
  | "not_configured"
  | "configured"
  | "error";

export type IntegrationCredentialSource = "database" | "env" | "none";

export interface IntegrationCredentialRow {
  provider: IntegrationProvider;
  is_enabled: boolean;
  config: Record<string, unknown>;
  secrets_encrypted: string | null;
  secrets_mask: Record<string, string>;
  last_tested_at: string | null;
  last_test_status: IntegrationTestStatus | null;
  last_test_message: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface IntegrationCredentialInsert {
  provider: IntegrationProvider;
  is_enabled?: boolean;
  config?: Record<string, unknown>;
  secrets_encrypted?: string | null;
  secrets_mask?: Record<string, string>;
  last_tested_at?: string | null;
  last_test_status?: IntegrationTestStatus | null;
  last_test_message?: string | null;
  updated_by?: string | null;
}

export interface IntegrationCredentialUpdate {
  is_enabled?: boolean;
  config?: Record<string, unknown>;
  secrets_encrypted?: string | null;
  secrets_mask?: Record<string, string>;
  last_tested_at?: string | null;
  last_test_status?: IntegrationTestStatus | null;
  last_test_message?: string | null;
  updated_by?: string | null;
}

/** Safe public view for admin UI — never includes decrypted secrets. */
export interface IntegrationProviderCard {
  provider: IntegrationProvider;
  title: string;
  description: string;
  isEnabled: boolean;
  status: IntegrationConnectionStatus;
  source: IntegrationCredentialSource;
  config: Record<string, string>;
  secretsMask: Record<string, string>;
  lastTestedAt: string | null;
  lastTestStatus: IntegrationTestStatus | null;
  lastTestMessage: string | null;
  webhookUrl?: string;
}

export interface RazorpaySecrets {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
}

export interface ResendSecrets {
  apiKey: string;
}

export interface ResendConfig {
  fromEmail: string;
}

export interface TwilioWhatsAppSecrets {
  accountSid: string;
  authToken: string;
}

export interface TwilioWhatsAppConfig {
  whatsappFrom: string;
}

export interface ResolvedRazorpayCredentials extends RazorpaySecrets {
  source: Exclude<IntegrationCredentialSource, "none">;
}

export interface ResolvedResendCredentials extends ResendSecrets, ResendConfig {
  source: Exclude<IntegrationCredentialSource, "none">;
}

export interface ResolvedTwilioWhatsAppCredentials
  extends TwilioWhatsAppSecrets, TwilioWhatsAppConfig {
  source: Exclude<IntegrationCredentialSource, "none">;
}
