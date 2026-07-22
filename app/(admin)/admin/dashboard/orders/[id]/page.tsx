import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { getAdminOrderById } from "@/lib/db/admin-orders";
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

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href="/admin/dashboard/orders"
          className="text-sm text-neutral-400 transition hover:text-white"
        >
          ← Back to orders
        </Link>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Order detail
            </h1>
            <p className="mt-1 break-all font-mono text-xs text-neutral-500">
              {order.id}
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              Placed {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${ORDER_STATUS_CLASS[order.status]}`}
            >
              {order.status}
            </span>
            <span
              className={`inline-flex rounded-full border border-neutral-700 px-3 py-1 text-xs font-semibold capitalize ${PAYMENT_STATUS_CLASS[order.payment_status]}`}
            >
              Payment: {order.payment_status}
            </span>
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
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold text-white">Customer</h2>
            <dl className="mt-3 space-y-2 text-sm text-neutral-300">
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">Name</dt>
                <dd className="text-right text-white">
                  {order.customers?.full_name || "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-neutral-500">Phone</dt>
                <dd className="text-right text-white">
                  {order.customers?.phone || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
            <h2 className="text-sm font-semibold text-white">
              Shipping address
            </h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-neutral-300">
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

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900">
          <div className="border-b border-neutral-800 px-5 py-4">
            <h2 className="text-sm font-semibold text-white">Items</h2>
          </div>
          <ul className="divide-y divide-neutral-800">
            {order.order_items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 px-5 py-4 text-sm"
              >
                <div>
                  <p className="font-medium text-white">
                    {item.product_name_snapshot}
                  </p>
                  {(item.size_snapshot || item.color_snapshot) && (
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {[item.size_snapshot, item.color_snapshot]
                        .filter(Boolean)
                        .join(" / ")}
                      {item.sku_snapshot ? ` · ${item.sku_snapshot}` : ""}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {formatPrice(Number(item.unit_price))} × {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-white">
                  {formatPrice(Number(item.unit_price) * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t border-neutral-800 px-5 py-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-400">Subtotal</dt>
                <dd className="text-neutral-200">
                  {formatPrice(Number(order.subtotal))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-400">Shipping</dt>
                <dd className="text-neutral-200">
                  {formatPrice(Number(order.shipping_fee))}
                </dd>
              </div>
              <div className="flex justify-between border-t border-neutral-800 pt-2 text-base">
                <dt className="font-semibold text-white">Total</dt>
                <dd className="font-bold text-white">
                  {formatPrice(Number(order.total))}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          <h2 className="text-sm font-semibold text-white">Payment</h2>
          <dl className="mt-3 space-y-2 text-sm text-neutral-300">
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">Provider</dt>
              <dd className="text-right text-white">
                {order.payment_provider ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-neutral-500">Reference</dt>
              <dd className="break-all text-right font-mono text-xs text-white">
                {order.payment_reference ?? "—"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
