import twilio from "twilio";
import { resolveTwilioWhatsAppCredentials } from "@/lib/integrations/resolve";
import type {
  WhatsAppMessage,
  WhatsAppNotificationProvider,
} from "@/lib/notifications/providers/types";

export class TwilioWhatsAppProvider implements WhatsAppNotificationProvider {
  readonly name = "twilio-whatsapp";
  private readonly client: ReturnType<typeof twilio>;
  private readonly from: string;

  constructor(
    accountSid: string,
    authToken: string,
    fromWhatsAppNumber: string
  ) {
    this.client = twilio(accountSid, authToken);
    this.from = normalizeWhatsAppAddress(fromWhatsAppNumber);
  }

  async send(message: WhatsAppMessage): Promise<void> {
    await this.client.messages.create({
      from: this.from,
      to: normalizeWhatsAppAddress(message.to),
      body: message.body,
    });
  }
}

export class StubWhatsAppProvider implements WhatsAppNotificationProvider {
  readonly name = "stub-whatsapp";

  async send(message: WhatsAppMessage): Promise<void> {
    console.info("[notification:stub:whatsapp]", {
      to: message.to,
      body: message.body,
    });
  }
}

export function normalizeWhatsAppAddress(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith("whatsapp:")) {
    return trimmed;
  }
  return `whatsapp:${trimmed}`;
}

/**
 * Best-effort E.164 for Indian storefront numbers.
 * Leaves already-international numbers alone.
 */
export function toE164Phone(phone: string): string | null {
  const digits = phone.replace(/[^\d+]/g, "");

  if (digits.startsWith("+") && digits.length >= 11) {
    return digits;
  }

  const national = digits.replace(/\D/g, "");
  if (national.length === 10) {
    return `+91${national}`;
  }
  if (national.length === 12 && national.startsWith("91")) {
    return `+${national}`;
  }

  return null;
}

export async function createWhatsAppProvider(): Promise<WhatsAppNotificationProvider> {
  const credentials = await resolveTwilioWhatsAppCredentials();

  if (!credentials) {
    console.warn(
      "[notifications] Twilio WhatsApp credentials missing (DB/env) — using stub WhatsApp provider."
    );
    return new StubWhatsAppProvider();
  }

  return new TwilioWhatsAppProvider(
    credentials.accountSid,
    credentials.authToken,
    credentials.whatsappFrom
  );
}
