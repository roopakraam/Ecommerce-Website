import { ADMIN_LOW_STOCK_THRESHOLD } from "@/lib/admin/products";
import { getStoreSettingsForRuntime } from "@/lib/db/store-settings";
import { createEmailProvider } from "@/lib/notifications/providers/email";
import {
  createWhatsAppProvider,
  toE164Phone,
} from "@/lib/notifications/providers/whatsapp";

export interface LowStockAlertItem {
  variantId: string;
  productName: string;
  size: string;
  color: string;
  sku: string;
  quantityAfter: number;
}

/**
 * Notify admin when stock crosses below the low-stock threshold.
 * Call only when quantity moved from >= threshold to < threshold (debounce).
 * Never throws.
 */
export async function notifyLowStock(
  items: LowStockAlertItem[]
): Promise<void> {
  try {
    if (items.length === 0) {
      return;
    }

    const settings = await getStoreSettingsForRuntime();
    if (!settings.notify_low_stock) {
      return;
    }

    const emailProvider = await createEmailProvider();
    const whatsappProvider = await createWhatsAppProvider();

    const lines = items.map(
      (item) =>
        `${item.productName} (${item.size}/${item.color}, ${item.sku}) — ${item.quantityAfter} left`
    );

    if (settings.admin_notify_email) {
      try {
        const subject =
          items.length === 1
            ? `Low stock — ${items[0].productName}`
            : `Low stock — ${items.length} variants`;
        const text = [
          "The following variants are below the low-stock threshold:",
          "",
          ...lines,
          "",
          `Threshold: < ${ADMIN_LOW_STOCK_THRESHOLD}`,
        ].join("\n");
        const html = `
          <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">
            <h1 style="font-size: 18px;">Low stock alert</h1>
            <ul>${items
              .map(
                (item) =>
                  `<li>${item.productName} (${item.size}/${item.color}, ${item.sku}) — <strong>${item.quantityAfter}</strong> left</li>`
              )
              .join("")}</ul>
            <p>Threshold: &lt; ${ADMIN_LOW_STOCK_THRESHOLD}</p>
          </div>
        `.trim();

        await emailProvider.send({
          to: settings.admin_notify_email,
          subject,
          html,
          text,
        });
      } catch (error) {
        console.error(
          `[notifications:${emailProvider.name}] Failed low-stock email:`,
          error
        );
      }
    }

    if (settings.admin_notify_phone) {
      const phone = toE164Phone(settings.admin_notify_phone);
      if (phone) {
        try {
          await whatsappProvider.send({
            to: phone,
            body: [
              "BOOK MY TEES — low stock",
              ...lines.slice(0, 5),
              items.length > 5 ? `…and ${items.length - 5} more` : "",
            ]
              .filter(Boolean)
              .join("\n"),
          });
        } catch (error) {
          console.error(
            `[notifications:${whatsappProvider.name}] Failed low-stock WhatsApp:`,
            error
          );
        }
      }
    }
  } catch (error) {
    console.error("[notifications] Unexpected low-stock alert error:", error);
  }
}

/** True when stock crossed from at-or-above threshold into low-stock. */
export function crossedIntoLowStock(
  quantityBefore: number,
  quantityAfter: number,
  threshold = ADMIN_LOW_STOCK_THRESHOLD
): boolean {
  return quantityBefore >= threshold && quantityAfter < threshold;
}
