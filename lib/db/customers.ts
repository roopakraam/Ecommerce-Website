import { createAdminClient } from "@/lib/supabase/admin";
import type { Customer } from "@/types";

export async function ensureCustomerProfile(params: {
  authUserId: string;
  fullName?: string | null;
  phone?: string | null;
}): Promise<{ customer: Customer } | { error: string }> {
  const admin = createAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("customers")
    .select("*")
    .eq("auth_user_id", params.authUserId)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to fetch customer profile:", existingError.message);
    return { error: "Failed to fetch customer profile." };
  }

  if (existing) {
    const nextFullName = params.fullName ?? existing.full_name;
    const nextPhone = params.phone ?? existing.phone;

    if (
      nextFullName !== existing.full_name ||
      nextPhone !== existing.phone
    ) {
      const { data: updated, error: updateError } = await admin
        .from("customers")
        .update({
          full_name: nextFullName,
          phone: nextPhone,
        })
        .eq("id", existing.id)
        .select("*")
        .single();

      if (updateError || !updated) {
        console.error(
          "Failed to update customer profile:",
          updateError?.message
        );
        return { customer: existing };
      }

      return { customer: updated };
    }

    return { customer: existing };
  }

  const { data: created, error: createError } = await admin
    .from("customers")
    .insert({
      auth_user_id: params.authUserId,
      full_name: params.fullName ?? null,
      phone: params.phone ?? null,
    })
    .select("*")
    .single();

  if (createError || !created) {
    console.error("Failed to create customer profile:", createError?.message);
    return {
      error:
        createError?.message ??
        "Failed to create customer profile. Please try again.",
    };
  }

  return { customer: created };
}
