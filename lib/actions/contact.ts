"use server";

import { contactMessageSchema } from "@/lib/validations/contact";
import {
  insertContactMessage,
  updateContactMessageStatus,
} from "@/lib/db/contact";
import { getPublicStoreCommerceSettings } from "@/lib/db/store-settings";
import { createEmailProvider } from "@/lib/notifications/providers/email";

export type SubmitContactMessageResult =
  | { success: true }
  | { success: false; error: string };

const FALLBACK_SUPPORT_EMAIL = "support@bookmytees.com";

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production"
  );
}

function deliveryUnavailableError(supportEmail: string): string {
  return `We saved your message, but email delivery is unavailable right now. Please email us directly at ${supportEmail}.`;
}

export async function submitContactMessageAction(
  input: unknown
): Promise<SubmitContactMessageResult> {
  const parsed = contactMessageSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Please check your details and try again.",
    };
  }

  const { name, email, message } = parsed.data;

  let supportEmail = FALLBACK_SUPPORT_EMAIL;
  let savedId: string | null = null;

  try {
    const settings = await getPublicStoreCommerceSettings();
    supportEmail = settings.supportEmail || FALLBACK_SUPPORT_EMAIL;

    const saved = await insertContactMessage({ name, email, message });
    savedId = saved.id;

    const provider = await createEmailProvider();
    const isStub = provider.name === "stub-email";

    if (isStub && isProductionRuntime()) {
      await updateContactMessageStatus(saved.id, "email_failed");
      return {
        success: false,
        error: deliveryUnavailableError(supportEmail),
      };
    }

    try {
      await provider.send({
        to: supportEmail,
        subject: `New contact message from ${name}`,
        text: `From: ${name} <${email}>\n\n${message}`,
        html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`,
      });
      await updateContactMessageStatus(saved.id, "emailed");
      return { success: true };
    } catch (sendError) {
      console.error("Failed to send contact email:", sendError);
      await updateContactMessageStatus(saved.id, "email_failed");

      // Production: fail closed after persist. Development: persist is enough.
      if (isProductionRuntime()) {
        return {
          success: false,
          error: deliveryUnavailableError(supportEmail),
        };
      }

      return { success: true };
    }
  } catch (error) {
    console.error("Failed to process contact message:", error);

    if (savedId) {
      await updateContactMessageStatus(savedId, "email_failed");
      return {
        success: false,
        error: deliveryUnavailableError(supportEmail),
      };
    }

    return {
      success: false,
      error:
        "Something went wrong saving your message. Please try again or email us directly.",
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
