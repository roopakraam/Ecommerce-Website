import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  Package,
  CreditCard,
} from "lucide-react";
import {
  getOrderConfirmation,
  requireOrderOwnerOrAdmin,
} from "@/lib/db/orders";
import { taxFromOrderAmounts } from "@/lib/checkout/order-totals";
import { formatPrice } from "@/lib/utils/format-price";
import { ClearCartOnMount } from "@/components/storefront/clear-cart-on-mount";
import { buildPageMetadata } from "@/lib/seo/site";
import type { OrderStatus, PaymentStatus } from "@/types";

interface PageProps {
  params: {
    orderId: string;
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  return buildPageMetadata({
    title: `Order ${params.orderId.slice(0, 8)}…`,
    description:
      "View your BOOK MY TEES order summary, items, shipping address, and payment status.",
    path: `/order-confirmation/${params.orderId}`,
    noIndex: true,
  });
}

const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    icon: <Clock className="h-4 w-4" />,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  shipped: {
    label: "Shipped",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: <Truck className="h-4 w-4" />,
  },
  delivered: {
    label: "Delivered",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: <Package className="h-4 w-4" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-50 text-red-700 border-red-200",
    icon: <XCircle className="h-4 w-4" />,
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200" },
  paid: { label: "Paid", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  failed: { label: "Failed", color: "text-red-700 bg-red-50 border-red-200" },
  refunded: { label: "Refunded", color: "text-neutral-700 bg-neutral-50 border-neutral-200" },
};

export default async function OrderConfirmationPage({ params }: PageProps) {
  const access = await requireOrderOwnerOrAdmin(params.orderId);
  if (!access.ok) {
    if (access.status === 401) {
      redirect(
        `/login?next=${encodeURIComponent(`/order-confirmation/${params.orderId}`)}`
      );
    }
    notFound();
  }

  const order = await getOrderConfirmation(params.orderId);

  if (!order) {
    notFound();
  }

  const orderStatus = ORDER_STATUS_CONFIG[order.status];
  const paymentStatus = PAYMENT_STATUS_CONFIG[order.payment_status];
  const formattedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const taxAmount = taxFromOrderAmounts({
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shipping_fee),
    total: Number(order.total),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <ClearCartOnMount />

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {order.payment_status === "paid" && (
            <div className="mb-3 flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
              <span className="text-sm font-semibold uppercase tracking-wider">
                Order confirmed
              </span>
            </div>
          )}
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950">
            Order summary
          </h1>
          <p className="mt-1 font-mono text-xs text-neutral-500">{order.id}</p>
          <p className="mt-1 text-sm text-neutral-600">{formattedDate}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${orderStatus.color}`}
          >
            {orderStatus.icon}
            {orderStatus.label}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${paymentStatus.color}`}
          >
            <CreditCard className="h-3.5 w-3.5" />
            {paymentStatus.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <section className="rounded-2xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4">
          <h2 className="font-semibold text-neutral-950">Items ordered</h2>
        </div>
        <ul className="divide-y divide-neutral-100">
          {order.order_items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-neutral-950">
                  {item.product_name_snapshot}
                </p>
                {(item.size_snapshot || item.color_snapshot) && (
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {[item.size_snapshot, item.color_snapshot]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-neutral-500">
                  {formatPrice(item.unit_price)} × {item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-neutral-950">
                {formatPrice(item.unit_price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <div className="border-t border-neutral-200 px-5 py-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd className="font-medium text-neutral-950">
                {formatPrice(order.subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-600">Shipping</dt>
              <dd className="font-medium text-neutral-950">
                {formatPrice(order.shipping_fee)}
              </dd>
            </div>
            {taxAmount > 0 ? (
              <div className="flex justify-between">
                <dt className="text-neutral-600">Tax</dt>
                <dd className="font-medium text-neutral-950">
                  {formatPrice(taxAmount)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-base">
              <dt className="font-semibold text-neutral-950">Total</dt>
              <dd className="font-bold text-neutral-950">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Shipping address */}
      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-neutral-950">
          Shipping address
        </h2>
        <address className="text-sm not-italic leading-relaxed text-neutral-700">
          {order.shipping_address.line1}
          <br />
          {order.shipping_address.line2 && (
            <>
              {order.shipping_address.line2}
              <br />
            </>
          )}
          {order.shipping_address.city}, {order.shipping_address.state}{" "}
          {order.shipping_address.pincode}
        </address>
      </section>

      {/* Payment info */}
      <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-neutral-950">
          Payment details
        </h2>
        <dl className="space-y-1 text-sm text-neutral-700">
          <div className="flex justify-between">
            <dt>Provider</dt>
            <dd className="font-medium text-neutral-950">
              {order.payment_provider ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Reference</dt>
            <dd className="break-all font-mono text-xs text-neutral-950">
              {order.payment_reference ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Retry payment if failed */}
      {order.payment_status === "failed" && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="text-sm font-semibold text-red-800">
            Payment failed for this order.
          </p>
          <Link
            href={`/checkout/payment?orderId=${order.id}`}
            className="mt-3 inline-flex rounded-full bg-neutral-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-lime-400 hover:text-neutral-950"
          >
            Retry payment
          </Link>
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/products"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-950"
        >
          ← Continue shopping
        </Link>
      </div>
    </main>
  );
}
