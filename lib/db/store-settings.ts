import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_STORE_SETTINGS } from "@/lib/admin/settings";
import type { ShippingZone, StoreSettings } from "@/types";

function isMissingRelationError(message: string, relation: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(relation.toLowerCase()) &&
    (lower.includes("does not exist") || lower.includes("schema cache"))
  );
}

function defaultSettings(): StoreSettings {
  return {
    id: 1,
    ...DEFAULT_STORE_SETTINGS,
    updated_at: new Date().toISOString(),
  };
}

function toNumber(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

function normalizeZone(row: ShippingZone): ShippingZone {
  return {
    ...row,
    states: Array.isArray(row.states) ? row.states : [],
    flat_rate: toNumber(row.flat_rate),
    free_above: row.free_above == null ? null : toNumber(row.free_above),
    estimated_days_min:
      row.estimated_days_min == null ? null : Number(row.estimated_days_min),
    estimated_days_max:
      row.estimated_days_max == null ? null : Number(row.estimated_days_max),
  };
}

/**
 * Load store settings for notification / runtime use (service role).
 * Safe when migration is missing — returns defaults.
 */
export async function getStoreSettingsForRuntime(): Promise<StoreSettings> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      if (isMissingRelationError(error.message, "store_settings")) {
        return defaultSettings();
      }
      console.error("Failed to load store settings:", error.message);
      return defaultSettings();
    }

    if (!data) {
      return defaultSettings();
    }

    const row = data as StoreSettings;
    return {
      ...row,
      tax_rate: Number(row.tax_rate ?? 0),
      currency: row.currency === "USD" ? "USD" : "INR",
    };
  } catch (error) {
    console.error("Unexpected error loading store settings:", error);
    return defaultSettings();
  }
}

export interface PublicStoreCommerceSettings {
  storeName: string;
  currency: StoreSettings["currency"];
  taxRate: number;
  supportEmail: string | null;
  supportPhone: string | null;
  zones: ShippingZone[];
}

/**
 * Public commerce settings for checkout / packing slips (service role).
 * Used by Phase 3 checkout shipping/tax and print views.
 */
export async function getPublicStoreCommerceSettings(): Promise<PublicStoreCommerceSettings> {
  const settings = await getStoreSettingsForRuntime();

  let zones: ShippingZone[] = [];
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("shipping_zones")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      if (!isMissingRelationError(error.message, "shipping_zones")) {
        console.error("Failed to load shipping zones:", error.message);
      }
    } else {
      zones = ((data ?? []) as ShippingZone[]).map(normalizeZone);
    }
  } catch (error) {
    console.error("Unexpected error loading shipping zones:", error);
  }

  return {
    storeName: settings.store_name,
    currency: settings.currency,
    taxRate: Number(settings.tax_rate),
    supportEmail: settings.support_email,
    supportPhone: settings.support_phone,
    zones,
  };
}
