import { createServerClient } from "@/lib/supabase/server";
import type { Address } from "@/types";

export interface CheckoutCustomerProfile {
  id: string;
  auth_user_id: string;
  full_name: string | null;
  phone: string | null;
}

export interface CheckoutContext {
  user: { id: string; email: string | null } | null;
  customer: CheckoutCustomerProfile | null;
  addresses: Address[];
}

export async function getCheckoutContext(): Promise<CheckoutContext> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      customer: null,
      addresses: [],
    };
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, auth_user_id, full_name, phone")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!customer) {
    return {
      user: { id: user.id, email: user.email ?? null },
      customer: null,
      addresses: [],
    };
  }

  const { data: addresses, error: addressError } = await supabase
    .from("addresses")
    .select("*")
    .eq("customer_id", customer.id)
    .order("is_default", { ascending: false });

  if (addressError) {
    console.error("Failed to load saved addresses:", addressError.message);
  }

  return {
    user: { id: user.id, email: user.email ?? null },
    customer,
    addresses: addresses ?? [],
  };
}
