"use server";

import { revalidatePath } from "next/cache";
import { ADMIN_SETTINGS_PATH } from "@/lib/admin/settings";
import {
  changeAdminPassword,
  createShippingZone,
  deleteShippingZone,
  updateAdminProfile,
  updateNotificationPreferences,
  updateShippingZone,
  updateStoreDetails,
} from "@/lib/db/admin-settings";
import {
  adminPasswordSchema,
  adminProfileSchema,
  notificationPreferencesSchema,
  parseStatesText,
  shippingZoneFormSchema,
  storeDetailsSchema,
} from "@/lib/validations/admin-settings";

export type SettingsMutationResult =
  | { success: true }
  | { success: false; error: string };

function revalidateSettings() {
  revalidatePath(ADMIN_SETTINGS_PATH);
  revalidatePath("/admin/dashboard/settings");
}

export async function updateStoreDetailsAction(input: {
  form: unknown;
}): Promise<SettingsMutationResult> {
  const parsed = storeDetailsSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid store details.",
    };
  }

  try {
    await updateStoreDetails(parsed.data);
    revalidateSettings();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to save store details.",
    };
  }
}

export async function updateNotificationPreferencesAction(input: {
  form: unknown;
}): Promise<SettingsMutationResult> {
  const parsed = notificationPreferencesSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error:
        parsed.error.issues[0]?.message ?? "Invalid notification preferences.",
    };
  }

  try {
    await updateNotificationPreferences(parsed.data);
    revalidateSettings();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to save notification preferences.",
    };
  }
}

export async function createShippingZoneAction(input: {
  form: unknown;
}): Promise<SettingsMutationResult> {
  const parsed = shippingZoneFormSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid shipping zone.",
    };
  }

  try {
    await createShippingZone({
      name: parsed.data.name,
      states: parseStatesText(parsed.data.states_text),
      flat_rate: parsed.data.flat_rate,
      free_above: parsed.data.free_above,
      estimated_days_min: parsed.data.estimated_days_min,
      estimated_days_max: parsed.data.estimated_days_max,
      is_active: parsed.data.is_active,
      sort_order: parsed.data.sort_order,
    });
    revalidateSettings();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create shipping zone.",
    };
  }
}

export async function updateShippingZoneAction(input: {
  zoneId: string;
  form: unknown;
}): Promise<SettingsMutationResult> {
  const parsed = shippingZoneFormSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid shipping zone.",
    };
  }

  try {
    await updateShippingZone(input.zoneId, {
      name: parsed.data.name,
      states: parseStatesText(parsed.data.states_text),
      flat_rate: parsed.data.flat_rate,
      free_above: parsed.data.free_above,
      estimated_days_min: parsed.data.estimated_days_min,
      estimated_days_max: parsed.data.estimated_days_max,
      is_active: parsed.data.is_active,
      sort_order: parsed.data.sort_order,
    });
    revalidateSettings();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update shipping zone.",
    };
  }
}

export async function deleteShippingZoneAction(
  zoneId: string
): Promise<SettingsMutationResult> {
  try {
    await deleteShippingZone(zoneId);
    revalidateSettings();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete shipping zone.",
    };
  }
}

export async function updateAdminProfileAction(input: {
  form: unknown;
}): Promise<SettingsMutationResult> {
  const parsed = adminProfileSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid profile details.",
    };
  }

  try {
    await updateAdminProfile(parsed.data.display_name);
    revalidateSettings();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update profile.",
    };
  }
}

export async function changeAdminPasswordAction(input: {
  form: unknown;
}): Promise<SettingsMutationResult> {
  const parsed = adminPasswordSchema.safeParse(input.form);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid password details.",
    };
  }

  try {
    await changeAdminPassword({
      currentPassword: parsed.data.current_password,
      newPassword: parsed.data.new_password,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to change password.",
    };
  }
}
