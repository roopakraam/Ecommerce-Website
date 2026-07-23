import { createServerClient } from "@/lib/supabase/server";
import type { Address, OrderStatus, PaymentStatus } from "@/types";

export interface AccountProfile {
  customerId: string | null;
  authUserId: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
}

export interface AccountOrderSummary {
  id: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  createdAt: string;
  itemCount: number;
}

async function requireAuthUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null as null };
  }

  return { supabase, user };
}

async function getOrCreateCustomerId(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  authUserId: string,
  seed?: { fullName?: string | null; phone?: string | null }
): Promise<{ customerId: string } | { error: string }> {
  const { data: existing, error: existingError } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to load customer for account:", existingError.message);
    return { error: "Failed to load your account." };
  }

  if (existing) {
    return { customerId: existing.id };
  }

  const { data: created, error: createError } = await supabase
    .from("customers")
    .insert({
      auth_user_id: authUserId,
      full_name: seed?.fullName ?? null,
      phone: seed?.phone ?? null,
    })
    .select("id")
    .single();

  if (createError || !created) {
    console.error("Failed to create customer for account:", createError?.message);
    return { error: "Failed to create your customer profile." };
  }

  return { customerId: created.id };
}

export async function getAccountProfile(): Promise<AccountProfile | null> {
  const { supabase, user } = await requireAuthUser();

  if (!user) {
    return null;
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, full_name, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return {
    customerId: customer?.id ?? null,
    authUserId: user.id,
    fullName:
      customer?.full_name ??
      (user.user_metadata?.full_name as string | undefined) ??
      null,
    email: user.email ?? null,
    phone: customer?.phone ?? null,
  };
}

export async function updateAccountProfile(params: {
  fullName: string;
  phone: string | null;
}): Promise<{ customerId: string } | { error: string }> {
  const { supabase, user } = await requireAuthUser();

  if (!user) {
    return { error: "Please sign in to update your profile." };
  }

  const customerResult = await getOrCreateCustomerId(supabase, user.id, {
    fullName: params.fullName,
    phone: params.phone,
  });

  if ("error" in customerResult) {
    return customerResult;
  }

  const { error: updateError } = await supabase
    .from("customers")
    .update({
      full_name: params.fullName,
      phone: params.phone,
    })
    .eq("id", customerResult.customerId);

  if (updateError) {
    console.error("Failed to update customer profile:", updateError.message);
    return { error: "Failed to update your profile." };
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      full_name: params.fullName,
      phone: params.phone,
    },
  });

  if (authError) {
    // Customers row is source of truth for account UI; log and continue.
    console.error("Failed to sync auth metadata:", authError.message);
  }

  return { customerId: customerResult.customerId };
}

export async function getAccountAddresses(): Promise<Address[]> {
  const { supabase, user } = await requireAuthUser();

  if (!user) {
    return [];
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!customer) {
    return [];
  }

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("customer_id", customer.id)
    .order("is_default", { ascending: false });

  if (error) {
    console.error("Failed to load account addresses:", error.message);
    return [];
  }

  return (data ?? []) as Address[];
}

export async function setDefaultAccountAddress(
  addressId: string
): Promise<{ ok: true } | { error: string }> {
  const { supabase, user } = await requireAuthUser();

  if (!user) {
    return { error: "Please sign in to update your addresses." };
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!customer) {
    return { error: "No customer profile found." };
  }

  const { data: address, error: addressError } = await supabase
    .from("addresses")
    .select("id")
    .eq("id", addressId)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (addressError || !address) {
    return { error: "Address not found." };
  }

  const { error: clearError } = await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("customer_id", customer.id)
    .eq("is_default", true);

  if (clearError) {
    console.error("Failed to clear default addresses:", clearError.message);
    return { error: "Failed to update default address." };
  }

  const { error: setError } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("customer_id", customer.id);

  if (setError) {
    console.error("Failed to set default address:", setError.message);
    return { error: "Failed to update default address." };
  }

  return { ok: true };
}

export async function deleteAccountAddress(
  addressId: string
): Promise<{ ok: true } | { error: string }> {
  const { supabase, user } = await requireAuthUser();

  if (!user) {
    return { error: "Please sign in to delete an address." };
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!customer) {
    return { error: "No customer profile found." };
  }

  const { data: deleted, error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", customer.id)
    .select("id");

  if (error) {
    console.error("Failed to delete address:", error.message);
    return { error: "Failed to delete address." };
  }

  if (!deleted || deleted.length === 0) {
    return { error: "Address not found." };
  }

  return { ok: true };
}

export async function getAccountOrders(limit = 50): Promise<AccountOrderSummary[]> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!customer) {
    return [];
  }

  const { data, error } = await supabase
    .from("orders")
    .select("id, status, payment_status, total, created_at, order_items(id)")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load customer orders:", error.message);
    return [];
  }

  type Row = {
    id: string;
    status: OrderStatus;
    payment_status: PaymentStatus;
    total: number | string;
    created_at: string;
    order_items: Array<{ id: string }> | null;
  };

  return ((data ?? []) as Row[]).map((row) => ({
    id: row.id,
    status: row.status,
    paymentStatus: row.payment_status,
    total: Number(row.total),
    createdAt: row.created_at,
    itemCount: Array.isArray(row.order_items) ? row.order_items.length : 0,
  }));
}
