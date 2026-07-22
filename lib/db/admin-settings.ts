import { DEFAULT_STORE_SETTINGS } from "@/lib/admin/settings";
import { createServerClient } from "@/lib/supabase/server";
import type {
  AdminUser,
  ShippingZone,
  ShippingZoneInsert,
  ShippingZoneUpdate,
  StoreSettings,
  StoreSettingsUpdate,
} from "@/types";

export interface AdminAccountProfile {
  id: string;
  authUserId: string;
  email: string;
  role: AdminUser["role"];
  displayName: string | null;
}

export interface AdminSettingsBundle {
  store: StoreSettings;
  zones: ShippingZone[];
  account: AdminAccountProfile;
  settingsAvailable: boolean;
}

const SETTINGS_MIGRATION_HINT =
  "Store settings require migration 20260722099000_store_settings.sql.";

async function assertAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: adminRow, error } = await supabase
    .from("admin_users")
    .select("id, auth_user_id, role, display_name")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error.message, "display_name")) {
      const { data: legacyAdmin, error: legacyError } = await supabase
        .from("admin_users")
        .select("id, auth_user_id, role")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (legacyError || !legacyAdmin) {
        throw new Error("You do not have admin access.");
      }

      return {
        supabase,
        user,
        admin: {
          id: legacyAdmin.id,
          auth_user_id: legacyAdmin.auth_user_id,
          role: legacyAdmin.role,
          display_name: null,
        } as AdminUser,
      };
    }
    throw new Error("You do not have admin access.");
  }

  if (!adminRow) {
    throw new Error("You do not have admin access.");
  }

  return {
    supabase,
    user,
    admin: adminRow as AdminUser,
  };
}

function isMissingRelationError(message: string, relation: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(relation.toLowerCase()) &&
    (lower.includes("does not exist") || lower.includes("schema cache"))
  );
}

function isMissingColumnError(message: string, column: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes(column.toLowerCase()) &&
    (lower.includes("does not exist") || lower.includes("schema cache"))
  );
}

function toNumber(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

function defaultStoreSettings(): StoreSettings {
  return {
    id: 1,
    ...DEFAULT_STORE_SETTINGS,
    tax_rate: DEFAULT_STORE_SETTINGS.tax_rate,
    updated_at: new Date().toISOString(),
  };
}

function normalizeStore(row: StoreSettings): StoreSettings {
  return {
    ...row,
    tax_rate: toNumber(row.tax_rate),
    currency: row.currency === "USD" ? "USD" : "INR",
  };
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

export async function getAdminSettings(): Promise<AdminSettingsBundle> {
  const { supabase, user, admin } = await assertAdmin();

  const account: AdminAccountProfile = {
    id: admin.id,
    authUserId: admin.auth_user_id,
    email: user.email ?? "",
    role: admin.role,
    displayName: admin.display_name,
  };

  const [storeResult, zonesResult] = await Promise.all([
    supabase.from("store_settings").select("*").eq("id", 1).maybeSingle(),
    supabase
      .from("shipping_zones")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  const settingsMissing =
    (storeResult.error &&
      isMissingRelationError(storeResult.error.message, "store_settings")) ||
    (zonesResult.error &&
      isMissingRelationError(zonesResult.error.message, "shipping_zones"));

  if (settingsMissing) {
    return {
      store: defaultStoreSettings(),
      zones: [],
      account,
      settingsAvailable: false,
    };
  }

  if (storeResult.error) {
    console.error("Failed to load store settings:", storeResult.error.message);
    throw new Error(storeResult.error.message);
  }

  if (zonesResult.error) {
    console.error("Failed to load shipping zones:", zonesResult.error.message);
    throw new Error(zonesResult.error.message);
  }

  let store = storeResult.data
    ? normalizeStore(storeResult.data as StoreSettings)
    : null;

  if (!store) {
    const { data: inserted, error: insertError } = await supabase
      .from("store_settings")
      .insert({ id: 1 })
      .select("*")
      .single();

    if (insertError || !inserted) {
      store = defaultStoreSettings();
    } else {
      store = normalizeStore(inserted as StoreSettings);
    }
  }

  return {
    store,
    zones: ((zonesResult.data ?? []) as ShippingZone[]).map(normalizeZone),
    account,
    settingsAvailable: true,
  };
}

export async function updateStoreDetails(
  input: StoreSettingsUpdate
): Promise<StoreSettings> {
  const { supabase } = await assertAdmin();

  const { data, error } = await supabase
    .from("store_settings")
    .upsert(
      {
        id: 1,
        store_name: input.store_name,
        currency: input.currency,
        tax_rate: input.tax_rate,
        support_email: input.support_email ?? null,
        support_phone: input.support_phone ?? null,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error || !data) {
    if (error && isMissingRelationError(error.message, "store_settings")) {
      throw new Error(SETTINGS_MIGRATION_HINT);
    }
    throw new Error(error?.message ?? "Failed to save store details.");
  }

  return normalizeStore(data as StoreSettings);
}

export async function updateNotificationPreferences(
  input: StoreSettingsUpdate
): Promise<StoreSettings> {
  const { supabase } = await assertAdmin();

  const { data, error } = await supabase
    .from("store_settings")
    .upsert(
      {
        id: 1,
        notify_email_customer: input.notify_email_customer,
        notify_whatsapp_customer: input.notify_whatsapp_customer,
        notify_email_admin: input.notify_email_admin,
        notify_whatsapp_admin: input.notify_whatsapp_admin,
        notify_low_stock: input.notify_low_stock,
        admin_notify_email: input.admin_notify_email ?? null,
        admin_notify_phone: input.admin_notify_phone ?? null,
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();

  if (error || !data) {
    if (error && isMissingRelationError(error.message, "store_settings")) {
      throw new Error(SETTINGS_MIGRATION_HINT);
    }
    throw new Error(
      error?.message ?? "Failed to save notification preferences."
    );
  }

  return normalizeStore(data as StoreSettings);
}

export async function createShippingZone(
  input: ShippingZoneInsert
): Promise<ShippingZone> {
  const { supabase } = await assertAdmin();

  const { data, error } = await supabase
    .from("shipping_zones")
    .insert({
      name: input.name,
      states: input.states ?? [],
      flat_rate: input.flat_rate ?? 0,
      free_above: input.free_above ?? null,
      estimated_days_min: input.estimated_days_min ?? null,
      estimated_days_max: input.estimated_days_max ?? null,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? 0,
    })
    .select("*")
    .single();

  if (error || !data) {
    if (error && isMissingRelationError(error.message, "shipping_zones")) {
      throw new Error(SETTINGS_MIGRATION_HINT);
    }
    throw new Error(error?.message ?? "Failed to create shipping zone.");
  }

  return normalizeZone(data as ShippingZone);
}

export async function updateShippingZone(
  zoneId: string,
  input: ShippingZoneUpdate
): Promise<ShippingZone> {
  const { supabase } = await assertAdmin();

  const { data, error } = await supabase
    .from("shipping_zones")
    .update({
      name: input.name,
      states: input.states,
      flat_rate: input.flat_rate,
      free_above: input.free_above,
      estimated_days_min: input.estimated_days_min,
      estimated_days_max: input.estimated_days_max,
      is_active: input.is_active,
      sort_order: input.sort_order,
    })
    .eq("id", zoneId)
    .select("*")
    .single();

  if (error || !data) {
    if (error && isMissingRelationError(error.message, "shipping_zones")) {
      throw new Error(SETTINGS_MIGRATION_HINT);
    }
    throw new Error(error?.message ?? "Failed to update shipping zone.");
  }

  return normalizeZone(data as ShippingZone);
}

export async function deleteShippingZone(zoneId: string): Promise<void> {
  const { supabase } = await assertAdmin();

  const { error } = await supabase
    .from("shipping_zones")
    .delete()
    .eq("id", zoneId);

  if (error) {
    if (isMissingRelationError(error.message, "shipping_zones")) {
      throw new Error(SETTINGS_MIGRATION_HINT);
    }
    throw new Error(error.message);
  }
}

export async function updateAdminProfile(displayName: string | null): Promise<
  AdminAccountProfile
> {
  const { supabase, user, admin } = await assertAdmin();

  const { data, error } = await supabase
    .from("admin_users")
    .update({ display_name: displayName })
    .eq("id", admin.id)
    .select("id, auth_user_id, role, display_name")
    .single();

  if (error || !data) {
    if (error && isMissingColumnError(error.message, "display_name")) {
      throw new Error(SETTINGS_MIGRATION_HINT);
    }
    throw new Error(error?.message ?? "Failed to update profile.");
  }

  return {
    id: data.id,
    authUserId: data.auth_user_id,
    email: user.email ?? "",
    role: data.role,
    displayName: data.display_name,
  };
}

export async function changeAdminPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const { supabase, user } = await assertAdmin();

  if (!user.email) {
    throw new Error("Your account has no email address.");
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: input.currentPassword,
  });

  if (signInError) {
    throw new Error("Current password is incorrect.");
  }

  const { error } = await supabase.auth.updateUser({
    password: input.newPassword,
  });

  if (error) {
    throw new Error(error.message || "Failed to update password.");
  }
}
