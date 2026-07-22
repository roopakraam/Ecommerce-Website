import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerAdminNotes } from "@/components/admin/customer-admin-notes";
import { getAdminCustomerById } from "@/lib/db/admin-customers";
import { ADMIN_CUSTOMERS_PATH } from "@/lib/admin/customers";
import { ADMIN_ORDERS_PATH } from "@/lib/admin/orders";
import { formatPrice } from "@/lib/utils/format-price";
import { EmptyState } from "@/components/ui/empty-state";
import type { OrderStatus, PaymentStatus } from "@/types";

export const dynamic = "force-dynamic";

interface CustomerDetailPageProps {
  params: {
    id: string;
  };
}

const ORDER_STATUS_CLASS: Record<OrderStatus, string> = {
  pending: "border-amber-700 bg-amber-950 text-amber-300",
  confirmed: "border-emerald-700 bg-emerald-950 text-emerald-300",
  shipped: "border-blue-700 bg-blue-950 text-blue-300",
  delivered: "border-lime-700 bg-lime-950 text-lime-300",
  cancelled: "border-red-800 bg-red-950 text-red-300",
};

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
  pending: "text-amber-300",
  paid: "text-emerald-300",
  failed: "text-red-300",
  refunded: "text-neutral-400",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminCustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const customer = await getAdminCustomerById(params.id);

  if (!customer) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href={ADMIN_CUSTOMERS_PATH}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Back to customers
        </Link>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {customer.full_name || "Unnamed customer"}
            </h1>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
              {customer.id}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Joined{" "}
              {new Date(customer.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground">
              {customer.order_count} order{customer.order_count === 1 ? "" : "s"}
            </span>
            <span className="inline-flex rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground">
              {formatPrice(customer.total_spend)} spent
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Profile</h2>
            <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between gap-3">
                <dt>Name</dt>
                <dd className="text-right text-foreground">
                  {customer.full_name || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Phone</dt>
                <dd className="text-right text-foreground">
                  {customer.phone || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Auth user</dt>
                <dd className="break-all text-right font-mono text-xs text-foreground">
                  {customer.auth_user_id}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Addresses</h2>
            {customer.addresses.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No saved addresses.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {customer.addresses.map((address) => (
                  <li
                    key={address.id}
                    className="rounded-lg border border-border/70 px-3 py-2 text-sm text-muted-foreground"
                  >
                    {address.is_default ? (
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        Default
                      </p>
                    ) : null}
                    <p>
                      {address.line1}
                      {address.line2 ? `, ${address.line2}` : ""}
                    </p>
                    <p>
                      {address.city}, {address.state} {address.pincode}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Order history
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Total spend counts paid orders only.
            </p>
          </div>

          {customer.orders.length === 0 ? (
            <div className="p-5">
              <EmptyState
                tone="dark"
                title="No orders yet"
                description="This customer has not placed any orders."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-left text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Order</th>
                    <th className="px-5 py-3 font-semibold">Total</th>
                    <th className="px-5 py-3 font-semibold">Payment</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customer.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/20">
                      <td className="px-5 py-3">
                        <Link
                          href={`${ADMIN_ORDERS_PATH}/${order.id}`}
                          className="font-mono text-xs text-foreground hover:text-primary"
                        >
                          {order.id.slice(0, 8)}…
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(order.created_at)}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-foreground">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs font-semibold capitalize ${PAYMENT_STATUS_CLASS[order.payment_status]}`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${ORDER_STATUS_CLASS[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <CustomerAdminNotes
          key={customer.admin_notes}
          customerId={customer.id}
          initialNotes={customer.admin_notes ?? ""}
        />
      </div>
    </main>
  );
}
