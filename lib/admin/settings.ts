export const ADMIN_SETTINGS_PATH = "/admin/settings";

export const SETTINGS_TABS = [
  "store",
  "shipping",
  "notifications",
  "account",
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

export function parseSettingsTab(value: string | undefined): SettingsTab {
  if (value && (SETTINGS_TABS as readonly string[]).includes(value)) {
    return value as SettingsTab;
  }
  return "store";
}

export const DEFAULT_STORE_SETTINGS = {
  store_name: "BOOK MY TEES",
  currency: "INR" as const,
  tax_rate: 0,
  support_email: null as string | null,
  support_phone: null as string | null,
  notify_email_customer: true,
  notify_whatsapp_customer: true,
  notify_email_admin: true,
  notify_whatsapp_admin: false,
  notify_low_stock: true,
  admin_notify_email: null as string | null,
  admin_notify_phone: null as string | null,
};
