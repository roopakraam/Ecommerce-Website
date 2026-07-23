import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/storefront/page-hero";
import { getAccountOrders, getAccountProfile } from "@/lib/db/account";
import { formatPrice } from "@/lib/utils/format-price";
import { buildPageMetadata } from "@/lib/seo/site";
import type { OrderStatus, PaymentStatus } from "@/types";

export const metadata = buildPageMetadata({
  title: "My Orders",
  description: "View your BOOK MY TEES order history.",
  path: "/account/orders",
  noIndex: true,
});

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  refunded: "Refunded",
};

export default async function AccountOrdersPage() {
  const profile = await getAccountProfile();

  if (!profile) {
    redirect("/login?next=/account/orders");
  }

  const orders = await getAccountOrders(100);

  return (
    <main>
      <PageHero
        eyebrow="Account"
        title="Your orders"
        breadcrumbs={[{ label: "Account", href: "/account" }, { label: "Orders" }]}
      />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-bone/15 px-6 py-14 text-center">
            <p className="text-sm text-dust">You haven&apos;t placed any orders yet.</p>
            <Link
              href="/products"
              className="mt-4 inline-flex rounded-full bg-neon px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-bone/10 rounded-2xl border border-bone/10 bg-surface">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/order-confirmation/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface2"
                >
                  <div>
                    <p className="font-mono text-xs text-dust">{order.id.slice(0, 8)}…</p>
                    <p className="mt-1 text-sm text-bone">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}
                      {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] uppercase tracking-wide text-dust">
                      {STATUS_LABEL[order.status]} · {PAYMENT_LABEL[order.paymentStatus]}
                    </span>
                    <span className="font-mono text-sm font-bold text-neon">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
