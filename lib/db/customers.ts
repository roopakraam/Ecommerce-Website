import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@/lib/supabase/server";
import type { Customer } from "@/types";

type EnsureCustomerParams = {
  authUserId: string;
  fullName?: string | null;
  phone?: string | null;
  /** Optional bearer from client sign-in — avoids cookie race right after login. */
  accessToken?: string | null;
};

function createUserClientFromAccessToken(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Ensures a `customers` row for the signed-in user.
 * Uses the user JWT (cookies or accessToken) so RLS `customers_insert_own` applies.
 * Does not require the service role key.
 */
export async function ensureCustomerProfile(
  params: EnsureCustomerParams
): Promise<{ customer: Customer } | { error: string }> {
  const supabase = params.accessToken
    ? createUserClientFromAccessToken(params.accessToken)
    : await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser(
    params.accessToken ? params.accessToken : undefined
  );

  if (!user) {
    return { error: "Please sign in first." };
  }

  if (user.id !== params.authUserId) {
    return { error: "Unauthorized." };
  }

  const { data: existing, error: existingError } = await supabase
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
      const { data: updated, error: updateError } = await supabase
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
        return { customer: existing as Customer };
      }

      return { customer: updated as Customer };
    }

    return { customer: existing as Customer };
  }

  const { data: created, error: createError } = await supabase
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
      error: mapCustomerWriteError(createError?.message),
    };
  }

  return { customer: created as Customer };
}

function mapCustomerWriteError(message: string | undefined): string {
  if (message?.toLowerCase().includes("row-level security")) {
    return "Could not create your customer profile (database permission). Please refresh and try again, or contact support.";
  }
  return message ?? "Failed to create customer profile. Please try again.";
}
