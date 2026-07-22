import { createServerClient } from "@/lib/supabase/server";
import type {
  Address,
  Customer,
  Order,
  OrderStatus,
  PaymentStatus,
} from "@/types";

export interface AdminCustomerListItem extends Customer {
  order_count: number;
  total_spend: number;
}

export interface AdminCustomerOrderSummary {
  id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  created_at: string;
}

export interface AdminCustomerDetail extends Customer {
  order_count: number;
  total_spend: number;
  addresses: Address[];
  orders: AdminCustomerOrderSummary[];
}

export interface AdminCustomerListOptions {
  search?: string;
}

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
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !adminRow) {
    throw new Error("You do not have admin access.");
  }

  return { supabase, user };
}

function isMissingColumnError(message: string, column: string): boolean {
  return message.toLowerCase().includes(column.toLowerCase());
}

function sanitizeSearch(value: string): string {
  return value.trim().replace(/[%_,]/g, " ").replace(/\s+/g, " ").slice(0, 80);
}

function toNumber(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

function aggregateOrderStats(
  orders: Array<{
    customer_id: string;
    total: number | string;
    payment_status: PaymentStatus;
  }>
) {
  const stats = new Map<string, { order_count: number; total_spend: number }>();

  for (const order of orders) {
    const current = stats.get(order.customer_id) ?? {
      order_count: 0,
      total_spend: 0,
    };
    current.order_count += 1;
    if (order.payment_status === "paid") {
      current.total_spend += toNumber(order.total);
    }
    stats.set(order.customer_id, current);
  }

  return stats;
}

async function writeCustomerAuditLog(
  supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"],
  input: {
    customerId: string;
    action: string;
    actorAuthUserId: string;
    actorEmail: string | null;
    previousValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
  }
) {
  const { error } = await supabase.from("audit_logs").insert({
    entity_type: "customer",
    entity_id: input.customerId,
    action: input.action,
    actor_auth_user_id: input.actorAuthUserId,
    previous_values: input.previousValues ?? null,
    new_values: input.newValues ?? null,
    metadata: { actor_email: input.actorEmail },
  });

  if (error) {
    // Notes save should still succeed if audit table isn't migrated yet.
    console.error("Failed to write customer audit log:", error.message);
  }
}

export async function getAdminCustomers(
  options: AdminCustomerListOptions = {}
): Promise<AdminCustomerListItem[]> {
  const { supabase } = await assertAdmin();
  const search = options.search ? sanitizeSearch(options.search) : "";

  let customersQuery = supabase
    .from("customers")
    .select("id, auth_user_id, full_name, phone, created_at")
    .order("created_at", { ascending: false });

  if (search) {
    customersQuery = customersQuery.or(
      `full_name.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }

  const [customersResult, ordersResult] = await Promise.all([
    customersQuery,
    supabase.from("orders").select("customer_id, total, payment_status"),
  ]);

  if (customersResult.error) {
    console.error(
      "Failed to load admin customers:",
      customersResult.error.message
    );
    throw new Error("Failed to load customers.");
  }

  if (ordersResult.error) {
    console.error(
      "Failed to load customer order stats:",
      ordersResult.error.message
    );
    throw new Error("Failed to load customers.");
  }

  const stats = aggregateOrderStats(
    (ordersResult.data ?? []) as Array<{
      customer_id: string;
      total: number | string;
      payment_status: PaymentStatus;
    }>
  );

  return ((customersResult.data ?? []) as Customer[]).map((customer) => {
    const customerStats = stats.get(customer.id);
    return {
      ...customer,
      admin_notes: "",
      order_count: customerStats?.order_count ?? 0,
      total_spend: customerStats?.total_spend ?? 0,
    };
  });
}

export async function getAdminCustomerById(
  id: string
): Promise<AdminCustomerDetail | null> {
  const { supabase } = await assertAdmin();

  const [customerResult, ordersResult, addressesResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, auth_user_id, full_name, phone, created_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("orders")
      .select("id, status, payment_status, total, created_at")
      .eq("customer_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", id)
      .order("is_default", { ascending: false }),
  ]);

  if (customerResult.error) {
    console.error(
      "Failed to load admin customer:",
      customerResult.error.message
    );
    throw new Error("Failed to load customer.");
  }

  if (!customerResult.data) {
    return null;
  }

  if (ordersResult.error) {
    console.error(
      "Failed to load customer orders:",
      ordersResult.error.message
    );
    throw new Error("Failed to load customer.");
  }

  if (addressesResult.error) {
    console.error(
      "Failed to load customer addresses:",
      addressesResult.error.message
    );
    throw new Error("Failed to load customer.");
  }

  const orders = ((ordersResult.data ?? []) as Array<
    Pick<Order, "id" | "status" | "payment_status" | "total" | "created_at">
  >).map((order) => ({
    id: order.id,
    status: order.status,
    payment_status: order.payment_status,
    total: toNumber(order.total),
    created_at: order.created_at,
  }));

  const totalSpend = orders
    .filter((order) => order.payment_status === "paid")
    .reduce((sum, order) => sum + order.total, 0);

  const customer = customerResult.data as Customer;

  let adminNotes = "";
  const notesResult = await supabase
    .from("customers")
    .select("admin_notes")
    .eq("id", id)
    .maybeSingle();

  if (!notesResult.error) {
    adminNotes =
      (notesResult.data as { admin_notes?: string | null } | null)
        ?.admin_notes ?? "";
  } else if (!isMissingColumnError(notesResult.error.message, "admin_notes")) {
    console.error("Failed to load customer notes:", notesResult.error.message);
  }

  return {
    ...customer,
    admin_notes: adminNotes,
    order_count: orders.length,
    total_spend: totalSpend,
    addresses: (addressesResult.data ?? []) as Address[],
    orders,
  };
}

export async function updateAdminCustomerNotes(
  customerId: string,
  adminNotes: string
): Promise<AdminCustomerDetail> {
  const { supabase, user } = await assertAdmin();

  const existing = await getAdminCustomerById(customerId);
  if (!existing) {
    throw new Error("Customer not found.");
  }

  const nextNotes = adminNotes.trim();
  const previousNotes = existing.admin_notes ?? "";

  if (previousNotes === nextNotes) {
    return existing;
  }

  const { error } = await supabase
    .from("customers")
    .update({ admin_notes: nextNotes })
    .eq("id", customerId);

  if (error) {
    console.error("Failed to update customer notes:", error.message);
    if (isMissingColumnError(error.message, "admin_notes")) {
      throw new Error(
        "Admin notes require migration 20260722095000_customer_admin_notes.sql."
      );
    }
    throw new Error("Failed to update admin notes.");
  }

  await writeCustomerAuditLog(supabase, {
    customerId,
    action: "notes_updated",
    actorAuthUserId: user.id,
    actorEmail: user.email ?? null,
    previousValues: { admin_notes: previousNotes },
    newValues: { admin_notes: nextNotes },
  });

  const updated = await getAdminCustomerById(customerId);
  if (!updated) {
    throw new Error("Customer not found after notes update.");
  }

  return updated;
}
