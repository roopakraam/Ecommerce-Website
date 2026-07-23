import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { taxFromOrderAmounts } from "@/lib/checkout/order-totals";
import { ADMIN_ORDERS_PATH } from "@/lib/admin/orders";
import { getAdminOrderById } from "@/lib/db/admin-orders";
import { getPublicStoreCommerceSettings } from "@/lib/db/store-settings";
import { formatPrice } from "@/lib/utils/format-price";

export const dynamic = "force-dynamic";

interface PackingSlipPageProps {
  params: {
    id: string;
  };
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminOrderPackingSlipPage({
  params,
}: PackingSlipPageProps) {
  const [order, commerce] = await Promise.all([
    getAdminOrderById(params.id),
    getPublicStoreCommerceSettings(),
  ]);

  if (!order) {
    notFound();
  }

  const discountAmount = Number(order.discount_amount ?? 0);
  const taxAmount = taxFromOrderAmounts({
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shipping_fee),
    total: Number(order.total),
    discountAmount,
  });

  const shortId = order.id.slice(0, 8).toUpperCase();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 text-neutral-950 sm:px-6 print:max-w-none print:px-0 print:py-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`${ADMIN_ORDERS_PATH}/${order.id}`}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Back to order
        </Link>
        <PrintButton label="Print packing slip" />
      </div>

      <article className="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-950 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Packing slip / invoice
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">
              {commerce.storeName}
            </h1>
            {(commerce.supportEmail || commerce.supportPhone) && (
              <p className="mt-2 text-sm text-neutral-600">
                {[commerce.supportEmail, commerce.supportPhone]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold">Order #{shortId}</p>
            <p className="mt-1 font-mono text-xs text-neutral-500">{order.id}</p>
            <p className="mt-2 text-neutral-600">{formatDate(order.created_at)}</p>
            <p className="mt-1 capitalize text-neutral-600">
              Status: {order.status} · Payment: {order.payment_status}
            </p>
          </div>
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Ship to
            </h2>
            <div className="mt-2 text-sm leading-relaxed">
              <p className="font-semibold">
                {order.customers?.full_name || "Customer"}
              </p>
              {order.customers?.phone ? (
                <p className="text-neutral-600">{order.customers.phone}</p>
              ) : null}
              <address className="mt-2 not-italic text-neutral-700">
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
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Summary
            </h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Items</dt>
                <dd className="font-medium">
                  {order.order_items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-neutral-600">Payment</dt>
                <dd className="font-medium capitalize">
                  {order.payment_provider ?? "—"} / {order.payment_status}
                </dd>
              </div>
              {order.payment_reference ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-600">Reference</dt>
                  <dd className="max-w-[14rem] break-all font-mono text-xs">
                    {order.payment_reference}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>

        <section className="mt-8">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-xs uppercase tracking-wide text-neutral-500">
                <th className="pb-2 pr-3 font-semibold">Item</th>
                <th className="pb-2 pr-3 font-semibold">SKU</th>
                <th className="pb-2 pr-3 text-right font-semibold">Qty</th>
                <th className="pb-2 pr-3 text-right font-semibold">Unit</th>
                <th className="pb-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100">
                  <td className="py-3 pr-3 align-top">
                    <p className="font-medium">{item.product_name_snapshot}</p>
                    {(item.size_snapshot || item.color_snapshot) && (
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {[item.size_snapshot, item.color_snapshot]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    )}
                  </td>
                  <td className="py-3 pr-3 align-top font-mono text-xs text-neutral-600">
                    {item.sku_snapshot || "—"}
                  </td>
                  <td className="py-3 pr-3 text-right align-top">
                    {item.quantity}
                  </td>
                  <td className="py-3 pr-3 text-right align-top">
                    {formatPrice(Number(item.unit_price))}
                  </td>
                  <td className="py-3 text-right align-top font-medium">
                    {formatPrice(Number(item.unit_price) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between gap-6">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd>{formatPrice(Number(order.subtotal))}</dd>
            </div>
            {discountAmount > 0 ? (
              <div className="flex justify-between gap-6">
                <dt className="text-neutral-600">
                  Discount
                  {order.coupon_code ? ` (${order.coupon_code})` : ""}
                </dt>
                <dd>−{formatPrice(discountAmount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-6">
              <dt className="text-neutral-600">Shipping</dt>
              <dd>{formatPrice(Number(order.shipping_fee))}</dd>
            </div>
            {taxAmount > 0 ? (
              <div className="flex justify-between gap-6">
                <dt className="text-neutral-600">Tax</dt>
                <dd>{formatPrice(taxAmount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-6 border-t border-neutral-200 pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(Number(order.total))}</dd>
            </div>
          </dl>
        </section>

        <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-500">
          Thank you for your order. Keep this slip with the package for
          fulfillment.
        </footer>
      </article>
    </main>
  );
}
