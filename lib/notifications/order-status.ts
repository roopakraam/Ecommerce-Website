import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreSettingsForRuntime } from "@/lib/db/store-settings";
import { createEmailProvider } from "@/lib/notifications/providers/email";
import {
  createWhatsAppProvider,
  toE164Phone,
} from "@/lib/notifications/providers/whatsapp";
import type { OrderStatus } from "@/types";

export interface OrderStatusNotificationPayload {
  orderId: string;
  previousStatus: OrderStatus;
  nextStatus: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail?: string | null;
}

function statusLabel(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

async function resolveCustomerEmail(
  payload: OrderStatusNotificationPayload
): Promise<string | null> {
  if (payload.customerEmail) {
    return payload.customerEmail;
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select("customers(auth_user_id)")
      .eq("id", payload.orderId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const customers = (
      data as {
        customers:
          | { auth_user_id: string }
          | Array<{ auth_user_id: string }>
          | null;
      }
    ).customers;

    const customer = Array.isArray(customers)
      ? customers[0]
      : customers;

    if (!customer?.auth_user_id) {
      return null;
    }

    const { data: authData, error: authError } =
      await admin.auth.admin.getUserById(customer.auth_user_id);

    if (authError) {
      return null;
    }

    return authData.user.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Notify customer (and optionally admin) when order status changes.
 * Respects store_settings customer notification flags.
 * Never throws.
 */
export async function notifyOrderStatusChange(
  payload: OrderStatusNotificationPayload
): Promise<void> {
  try {
    if (payload.previousStatus === payload.nextStatus) {
      return;
    }

    const settings = await getStoreSettingsForRuntime();
    const emailProvider = await createEmailProvider();
    const whatsappProvider = await createWhatsAppProvider();
    const name = payload.customerName?.trim() || "there";
    const label = statusLabel(payload.nextStatus);

    if (settings.notify_email_customer) {
      const email = await resolveCustomerEmail(payload);
      if (email) {
        try {
          const subject = `Order update — ${label} (${payload.orderId.slice(0, 8)})`;
          const text = [
            `Hi ${name},`,
            "",
            `Your BOOK MY TEES order status is now: ${label}.`,
            `Order ID: ${payload.orderId}`,
            `Previous: ${statusLabel(payload.previousStatus)}`,
          ].join("\n");
          const html = `
            <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
              <h1 style="font-size: 18px;">Order update</h1>
              <p>Hi ${name},</p>
              <p>Your BOOK MY TEES order status is now: <strong>${label}</strong>.</p>
              <p>Order ID: ${payload.orderId}</p>
            </div>
          `.trim();

          await emailProvider.send({ to: email, subject, html, text });
        } catch (error) {
          console.error(
            `[notifications:${emailProvider.name}] Failed status email:`,
            error
          );
        }
      }
    }

    if (settings.notify_whatsapp_customer && payload.customerPhone) {
      const e164 = toE164Phone(payload.customerPhone);
      if (e164) {
        try {
          await whatsappProvider.send({
            to: e164,
            body: [
              `Hi ${name}, your BOOK MY TEES order is now ${label}.`,
              `Order: ${payload.orderId.slice(0, 8)}…`,
            ].join("\n"),
          });
        } catch (error) {
          console.error(
            `[notifications:${whatsappProvider.name}] Failed status WhatsApp:`,
            error
          );
        }
      }
    }
  } catch (error) {
    console.error(
      `[notifications] Unexpected error on status change for ${payload.orderId}:`,
      error
    );
  }
}
