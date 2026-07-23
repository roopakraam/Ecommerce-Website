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
import { PageHero } from "@/components/storefront/page-hero";
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
    color: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    icon: <Clock className="h-4 w-4" />,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  shipped: {
    label: "Shipped",
    color: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    icon: <Truck className="h-4 w-4" />,
  },
  delivered: {
    label: "Delivered",
    color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    icon: <Package className="h-4 w-4" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500/10 text-red-300 border-red-500/30",
    icon: <XCircle className="h-4 w-4" />,
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  pending: { label: "Pending", color: "text-amber-300 bg-amber-500/10 border-amber-500/30" },
  paid: { label: "Paid", color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
  failed: { label: "Failed", color: "text-red-300 bg-red-500/10 border-red-500/30" },
  refunded: { label: "Refunded", color: "text-bone/70 bg-surface border-bone/15" },
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
  const discountAmount = Number(order.discount_amount ?? 0);
  const taxAmount = taxFromOrderAmounts({
    subtotal: Number(order.subtotal),
    shippingFee: Number(order.shipping_fee),
    total: Number(order.total),
    discountAmount,
  });

  return (
    <main>
      <ClearCartOnMount />

      <PageHero
        eyebrow={order.payment_status === "paid" ? "Order confirmed" : "Order details"}
        title="Order summary"
        description={`${order.id} · ${formattedDate}`}
        containerClassName="max-w-3xl"
        actions={
          <>
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
          </>
        }
      />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">

      {/* Items */}
      <section className="rounded-2xl border border-bone/10 bg-surface">
        <div className="border-b border-bone/10 px-5 py-4">
          <h2 className="font-semibold text-bone">Items ordered</h2>
        </div>
        <ul className="divide-y divide-bone/10">
          {order.order_items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 px-5 py-4"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold text-bone">
                  {item.product_name_snapshot}
                </p>
                {(item.size_snapshot || item.color_snapshot) && (
                  <p className="mt-0.5 font-mono text-xs text-dust">
                    {[item.size_snapshot, item.color_snapshot]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                )}
                <p className="mt-0.5 font-mono text-xs text-dust">
                  {formatPrice(item.unit_price)} × {item.quantity}
                </p>
              </div>
              <p className="font-mono text-sm font-bold text-bone">
                {formatPrice(item.unit_price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>
        <div className="border-t border-bone/10 px-5 py-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-bone/75">Subtotal</dt>
              <dd className="font-medium text-bone">
                {formatPrice(order.subtotal)}
              </dd>
            </div>
            {discountAmount > 0 ? (
              <div className="flex justify-between">
                <dt className="text-bone/75">
                  Discount
                  {order.coupon_code ? (
                    <span className="mt-0.5 block text-xs font-normal text-dust">
                      {order.coupon_code}
                    </span>
                  ) : null}
                </dt>
                <dd className="font-medium text-emerald-300">
                  −{formatPrice(discountAmount)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-bone/75">Shipping</dt>
              <dd className="font-medium text-bone">
                {formatPrice(order.shipping_fee)}
              </dd>
            </div>
            {taxAmount > 0 ? (
              <div className="flex justify-between">
                <dt className="text-bone/75">Tax</dt>
                <dd className="font-medium text-bone">
                  {formatPrice(taxAmount)}
                </dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-bone/10 pt-2 text-base">
              <dt className="font-semibold text-bone">Total</dt>
              <dd className="font-mono font-bold text-neon">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Shipping address */}
      <section className="mt-6 rounded-2xl border border-bone/10 bg-surface p-5">
        <h2 className="mb-3 font-semibold text-bone">
          Shipping address
        </h2>
        <address className="text-sm not-italic leading-relaxed text-bone/75">
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
      <section className="mt-6 rounded-2xl border border-bone/10 bg-surface p-5">
        <h2 className="mb-3 font-semibold text-bone">
          Payment details
        </h2>
        <dl className="space-y-1 text-sm text-bone/75">
          <div className="flex justify-between">
            <dt>Provider</dt>
            <dd className="font-medium text-bone">
              {order.payment_provider ?? "—"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Reference</dt>
            <dd className="break-all font-mono text-xs text-bone">
              {order.payment_reference ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Retry payment if failed */}
      {order.payment_status === "failed" && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-center">
          <p className="text-sm font-semibold text-red-300">
            Payment failed for this order.
          </p>
          <Link
            href={`/checkout/payment?orderId=${order.id}`}
            className="mt-3 inline-flex rounded-full bg-neon px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-ink hover:bg-bone"
          >
            Retry payment
          </Link>
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/products"
          className="text-sm font-medium text-dust hover:text-bone"
        >
          ← Continue shopping
        </Link>
      </div>
      </div>
    </main>
  );
}
