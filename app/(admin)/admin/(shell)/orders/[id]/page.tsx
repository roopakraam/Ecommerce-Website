import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderAuditTimeline } from "@/components/admin/order-audit-timeline";
import { OrderInternalNotes } from "@/components/admin/order-internal-notes";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { Button } from "@/components/ui/button";
import { taxFromOrderAmounts } from "@/lib/checkout/order-totals";
import {
  getAdminOrderAuditLogs,
  getAdminOrderById,
} from "@/lib/db/admin-orders";
import { ADMIN_ORDERS_PATH } from "@/lib/admin/orders";
import { formatPrice } from "@/lib/utils/format-price";
import type { OrderStatus, PaymentStatus } from "@/types";

export const dynamic = "force-dynamic";

interface OrderDetailPageProps {
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
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminOrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const order = await getAdminOrderById(params.id);

  if (!order) {
    notFound();
  }

  const auditEntries = await getAdminOrderAuditLogs(order.id);
  const taxAmount = taxFromOrderAmounts({
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shipping_fee),
    total: Number(order.total),
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href={ADMIN_ORDERS_PATH}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Back to orders
        </Link>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Order detail
            </h1>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
              {order.id}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Placed {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${ORDER_STATUS_CLASS[order.status]}`}
            >
              {order.status}
            </span>
            <span
              className={`inline-flex rounded-full border border-border px-3 py-1 text-xs font-semibold capitalize ${PAYMENT_STATUS_CLASS[order.payment_status]}`}
            >
              Payment: {order.payment_status}
            </span>
            <Button variant="outline" asChild>
              <Link href={`${ADMIN_ORDERS_PATH}/${order.id}/print`}>
                Packing slip
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <OrderStatusControl
          key={order.status}
          orderId={order.id}
          currentStatus={order.status}
        />

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">Customer</h2>
            <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between gap-3">
                <dt>Name</dt>
                <dd className="text-right text-foreground">
                  {order.customers?.full_name || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Phone</dt>
                <dd className="text-right text-foreground">
                  {order.customers?.phone || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">
              Shipping address
            </h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-muted-foreground">
              {order.shipping_address.line1}
              <br />
              {order.shipping_address.line2 ? (
                <>
                  {order.shipping_address.line2}
                  <br />
                </>
              ) : null}
              {order.shipping_address.city}, {order.shipping_address.state}{" "}
              {order.shipping_address.pincode}
            </address>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Line items</h2>
          </div>
          <ul className="divide-y divide-border">
            {order.order_items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 px-5 py-4 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {item.product_name_snapshot}
                  </p>
                  {(item.size_snapshot || item.color_snapshot) && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[item.size_snapshot, item.color_snapshot]
                        .filter(Boolean)
                        .join(" / ")}
                      {item.sku_snapshot ? ` · ${item.sku_snapshot}` : ""}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatPrice(Number(item.unit_price))} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-foreground">
                  {formatPrice(Number(item.unit_price) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-5 py-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="text-foreground">
                  {formatPrice(Number(order.subtotal))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="text-foreground">
                  {formatPrice(Number(order.shipping_fee))}
                </dd>
              </div>
              {taxAmount > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="text-foreground">{formatPrice(taxAmount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-2 text-base">
                <dt className="font-semibold text-foreground">Total</dt>
                <dd className="font-bold text-foreground">
                  {formatPrice(Number(order.total))}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">
            Payment & shipping summary
          </h2>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Payment status</dt>
              <dd
                className={`font-semibold capitalize sm:mt-1 ${PAYMENT_STATUS_CLASS[order.payment_status]}`}
              >
                {order.payment_status}
              </dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Provider</dt>
              <dd className="text-foreground sm:mt-1">
                {order.payment_provider ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3 sm:col-span-2 sm:block">
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="break-all font-mono text-xs text-foreground sm:mt-1">
                {order.payment_reference ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Shipping fee</dt>
              <dd className="text-foreground sm:mt-1">
                {formatPrice(Number(order.shipping_fee))}
              </dd>
            </div>
            <div className="flex justify-between gap-3 sm:block">
              <dt className="text-muted-foreground">Inventory reserved</dt>
              <dd className="text-foreground sm:mt-1">
                {order.inventory_reserved ? "Yes" : "No"}
              </dd>
            </div>
          </dl>
        </section>

        <OrderInternalNotes
          key={order.internal_notes}
          orderId={order.id}
          initialNotes={order.internal_notes ?? ""}
        />

        <OrderAuditTimeline entries={auditEntries} />
      </div>
    </main>
  );
}
