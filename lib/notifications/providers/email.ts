import { Resend } from "resend";
import { resolveResendCredentials } from "@/lib/integrations/resolve";
import type {
  EmailMessage,
  EmailNotificationProvider,
} from "@/lib/notifications/providers/types";

export class ResendEmailProvider implements EmailNotificationProvider {
  readonly name = "resend";
  private readonly client: Resend;
  private readonly from: string;

  constructor(apiKey: string, from: string) {
    this.client = new Resend(apiKey);
    this.from = from;
  }

  async send(message: EmailMessage): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      throw new Error(error.message);
    }
  }
}

export class StubEmailProvider implements EmailNotificationProvider {
  readonly name = "stub-email";

  async send(message: EmailMessage): Promise<void> {
    console.info("[notification:stub:email]", {
      to: message.to,
      subject: message.subject,
    });
  }
}

export async function createEmailProvider(): Promise<EmailNotificationProvider> {
  const credentials = await resolveResendCredentials();

  if (!credentials) {
    console.warn(
      "[notifications] Resend credentials missing (DB/env) — using stub email provider."
    );
    return new StubEmailProvider();
  }

  return new ResendEmailProvider(credentials.apiKey, credentials.fromEmail);
}
