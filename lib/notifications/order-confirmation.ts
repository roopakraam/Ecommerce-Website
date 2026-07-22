import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreSettingsForRuntime } from "@/lib/db/store-settings";
import { formatPrice } from "@/lib/utils/format-price";
import { createEmailProvider } from "@/lib/notifications/providers/email";
import {
  createWhatsAppProvider,
  toE164Phone,
} from "@/lib/notifications/providers/whatsapp";
import type {
  EmailNotificationProvider,
  WhatsAppNotificationProvider,
} from "@/lib/notifications/providers/types";

export interface OrderConfirmationItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderConfirmationPayload {
  orderId: string;
  total: number;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  items: OrderConfirmationItem[];
}

export interface OrderConfirmationNotifierDeps {
  emailProvider?: EmailNotificationProvider;
  whatsappProvider?: WhatsAppNotificationProvider;
}

interface OrderNotificationRow {
  id: string;
  total: number | string;
  customer_id: string;
  order_items: Array<{
    product_name_snapshot: string;
    unit_price: number | string;
    quantity: number;
  }> | null;
  customers:
    | {
        full_name: string | null;
        phone: string | null;
        auth_user_id: string;
      }
    | Array<{
        full_name: string | null;
        phone: string | null;
        auth_user_id: string;
      }>
    | null;
}

function unwrapCustomer(
  customers: OrderNotificationRow["customers"]
): {
  full_name: string | null;
  phone: string | null;
  auth_user_id: string;
} | null {
  if (!customers) {
    return null;
  }
  return Array.isArray(customers) ? (customers[0] ?? null) : customers;
}

export async function getOrderConfirmationPayload(
  orderId: string
): Promise<OrderConfirmationPayload | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("orders")
    .select(
      "id, total, customer_id, order_items(product_name_snapshot, unit_price, quantity), customers(full_name, phone, auth_user_id)"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    console.error(
      "Failed to load order for confirmation notification:",
      error.message
    );
    return null;
  }

  if (!data) {
    return null;
  }

  const order = data as unknown as OrderNotificationRow;
  const customer = unwrapCustomer(order.customers);

  let email: string | null = null;
  if (customer?.auth_user_id) {
    const { data: authData, error: authError } =
      await admin.auth.admin.getUserById(customer.auth_user_id);

    if (authError) {
      console.error(
        "Failed to load customer email for notification:",
        authError.message
      );
    } else {
      email = authData.user.email ?? null;
    }
  }

  return {
    orderId: order.id,
    total: Number(order.total),
    customerName: customer?.full_name ?? null,
    email,
    phone: customer?.phone ?? null,
    items: (order.order_items ?? []).map((item) => ({
      name: item.product_name_snapshot,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
    })),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailContent(payload: OrderConfirmationPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const name = payload.customerName?.trim() || "there";
  const itemLines = payload.items
    .map(
      (item) =>
        `${item.name} × ${item.quantity} — ${formatPrice(item.unitPrice * item.quantity)}`
    )
    .join("\n");

  const subject = `Order confirmed — BOOK MY TEES (${payload.orderId.slice(0, 8)})`;
  const text = [
    `Hi ${name},`,
    "",
    "Thanks for shopping with BOOK MY TEES. Your payment was successful.",
    "",
    `Order ID: ${payload.orderId}`,
    `Total: ${formatPrice(payload.total)}`,
    "",
    "Items:",
    itemLines || "(no items)",
    "",
    "We'll notify you when your order ships.",
  ].join("\n");

  const htmlItems = payload.items
    .map(
      (item) =>
        `<li>${escapeHtml(item.name)} × ${item.quantity} — ${formatPrice(item.unitPrice * item.quantity)}</li>`
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
      <h1 style="font-size: 20px;">Order confirmed</h1>
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thanks for shopping with <strong>BOOK MY TEES</strong>. Your payment was successful.</p>
      <p><strong>Order ID:</strong> ${escapeHtml(payload.orderId)}<br/>
      <strong>Total:</strong> ${formatPrice(payload.total)}</p>
      <p><strong>Items</strong></p>
      <ul>${htmlItems || "<li>(no items)</li>"}</ul>
      <p>We'll notify you when your order ships.</p>
    </div>
  `.trim();

  return { subject, html, text };
}

function buildWhatsAppBody(payload: OrderConfirmationPayload): string {
  const name = payload.customerName?.trim() || "there";
  return [
    `Hi ${name}, your BOOK MY TEES order is confirmed.`,
    `Order: ${payload.orderId.slice(0, 8)}…`,
    `Total: ${formatPrice(payload.total)}`,
    "Thank you for shopping with us!",
  ].join("\n");
}

function buildAdminEmailContent(payload: OrderConfirmationPayload): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `New paid order — ${payload.orderId.slice(0, 8)} (${formatPrice(payload.total)})`;
  const text = [
    "A new order was paid.",
    `Order ID: ${payload.orderId}`,
    `Customer: ${payload.customerName ?? "—"}`,
    `Email: ${payload.email ?? "—"}`,
    `Phone: ${payload.phone ?? "—"}`,
    `Total: ${formatPrice(payload.total)}`,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
      <h1 style="font-size: 18px;">New paid order</h1>
      <p><strong>Order ID:</strong> ${escapeHtml(payload.orderId)}<br/>
      <strong>Customer:</strong> ${escapeHtml(payload.customerName ?? "—")}<br/>
      <strong>Email:</strong> ${escapeHtml(payload.email ?? "—")}<br/>
      <strong>Phone:</strong> ${escapeHtml(payload.phone ?? "—")}<br/>
      <strong>Total:</strong> ${formatPrice(payload.total)}</p>
    </div>
  `.trim();

  return { subject, html, text };
}

/**
 * Sends order confirmation via email (Resend) and WhatsApp (Twilio),
 * respecting store_settings notification flags for customer + admin.
 */
export async function sendOrderConfirmation(
  payload: OrderConfirmationPayload,
  deps: OrderConfirmationNotifierDeps = {}
): Promise<{ emailSent: boolean; whatsappSent: boolean }> {
  const settings = await getStoreSettingsForRuntime();
  const emailProvider = deps.emailProvider ?? (await createEmailProvider());
  const whatsappProvider =
    deps.whatsappProvider ?? (await createWhatsAppProvider());

  let emailSent = false;
  let whatsappSent = false;

  if (settings.notify_email_customer && payload.email) {
    try {
      const content = buildEmailContent(payload);
      await emailProvider.send({
        to: payload.email,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });
      emailSent = true;
    } catch (error) {
      console.error(
        `[notifications:${emailProvider.name}] Failed to send order confirmation email:`,
        error
      );
    }
  } else if (!settings.notify_email_customer) {
    console.info(
      `[notifications] Customer email disabled for order ${payload.orderId}.`
    );
  } else {
    console.warn(
      `[notifications] No customer email for order ${payload.orderId}; skipping email.`
    );
  }

  const e164Phone = payload.phone ? toE164Phone(payload.phone) : null;
  if (settings.notify_whatsapp_customer && e164Phone) {
    try {
      await whatsappProvider.send({
        to: e164Phone,
        body: buildWhatsAppBody(payload),
      });
      whatsappSent = true;
    } catch (error) {
      console.error(
        `[notifications:${whatsappProvider.name}] Failed to send order confirmation WhatsApp:`,
        error
      );
    }
  } else if (!settings.notify_whatsapp_customer) {
    console.info(
      `[notifications] Customer WhatsApp disabled for order ${payload.orderId}.`
    );
  } else {
    console.warn(
      `[notifications] No usable customer phone for order ${payload.orderId}; skipping WhatsApp.`
    );
  }

  // Admin new-order alerts
  if (settings.notify_email_admin && settings.admin_notify_email) {
    try {
      const content = buildAdminEmailContent(payload);
      await emailProvider.send({
        to: settings.admin_notify_email,
        subject: content.subject,
        html: content.html,
        text: content.text,
      });
    } catch (error) {
      console.error(
        `[notifications:${emailProvider.name}] Failed to send admin new-order email:`,
        error
      );
    }
  }

  if (settings.notify_whatsapp_admin && settings.admin_notify_phone) {
    const adminPhone = toE164Phone(settings.admin_notify_phone);
    if (adminPhone) {
      try {
        await whatsappProvider.send({
          to: adminPhone,
          body: [
            "BOOK MY TEES — new paid order",
            `Order: ${payload.orderId.slice(0, 8)}…`,
            `Total: ${formatPrice(payload.total)}`,
            `Customer: ${payload.customerName ?? "—"}`,
          ].join("\n"),
        });
      } catch (error) {
        console.error(
          `[notifications:${whatsappProvider.name}] Failed to send admin new-order WhatsApp:`,
          error
        );
      }
    }
  }

  return { emailSent, whatsappSent };
}

/**
 * Loads the paid order and sends confirmation notifications.
 * Never throws — payment flow must not fail because of notification errors.
 */
export async function notifyOrderPaid(orderId: string): Promise<void> {
  try {
    const payload = await getOrderConfirmationPayload(orderId);
    if (!payload) {
      console.error(
        `[notifications] Could not build confirmation payload for order ${orderId}.`
      );
      return;
    }

    await sendOrderConfirmation(payload);
  } catch (error) {
    console.error(
      `[notifications] Unexpected error sending confirmation for order ${orderId}:`,
      error
    );
  }
}
