export const ANALYTICS_TABS = ["sales", "inventory", "customers"] as const;

export type AnalyticsTab = (typeof ANALYTICS_TABS)[number];

export const ANALYTICS_SALES_DAYS = 30;
export const ANALYTICS_INVENTORY_DAYS = 30;
export const ANALYTICS_CUSTOMER_MONTHS = 6;
export const ANALYTICS_DEAD_STOCK_DAYS = 90;

export function parseAnalyticsTab(
  value: string | undefined
): AnalyticsTab {
  if (value && (ANALYTICS_TABS as readonly string[]).includes(value)) {
    return value as AnalyticsTab;
  }
  return "sales";
}
