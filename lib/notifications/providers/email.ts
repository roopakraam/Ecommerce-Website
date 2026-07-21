import { Resend } from "resend";
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

export function createEmailProvider(): EmailNotificationProvider {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.warn(
      "[notifications] RESEND_API_KEY / RESEND_FROM_EMAIL missing — using stub email provider."
    );
    return new StubEmailProvider();
  }

  return new ResendEmailProvider(apiKey, from);
}
