import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { RazorpayCheckout } from "@/components/storefront/razorpay-checkout";
import { PageHero } from "@/components/storefront/page-hero";
import { requireOrderOwnerOrAdmin } from "@/lib/db/orders";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "Complete Payment",
  description:
    "Pay securely for your BOOK MY TEES order with Razorpay checkout.",
  path: "/checkout/payment",
  noIndex: true,
});

interface PaymentPageProps {
  searchParams: {
    orderId?: string;
  };
}

export default async function CheckoutPaymentPage({
  searchParams,
}: PaymentPageProps) {
  const orderId = searchParams.orderId;

  if (!orderId) {
    return (
      <main>
        <PageHero eyebrow="Checkout" title="Missing order" />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <p className="text-sm text-dust">
            No order was provided for payment. Return to checkout and try again.
          </p>
          <Link
            href="/checkout"
            className="mt-8 inline-flex rounded-full bg-neon px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink hover:bg-bone"
          >
            Back to checkout
          </Link>
        </div>
      </main>
    );
  }

  const access = await requireOrderOwnerOrAdmin(orderId);

  if (!access.ok) {
    if (access.status === 401) {
      redirect(`/login?next=${encodeURIComponent(`/checkout/payment?orderId=${orderId}`)}`);
    }
    notFound();
  }

  const order = access.order!;

  return (
    <main>
      <PageHero
        eyebrow="Checkout"
        title="Complete payment"
        description={
          order.inventory_reserved
            ? "Pay securely with Razorpay. Stock for this order is held while you complete checkout."
            : "Pay securely with Razorpay to confirm your BOOK MY TEES order."
        }
      />

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        <RazorpayCheckout
          orderId={order.id}
          orderTotal={order.total}
          initialPaymentStatus={order.payment_status}
        />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="rounded-full border border-bone/20 px-5 py-2.5 text-sm font-semibold text-bone hover:border-neon hover:text-neon"
          >
            Continue shopping
          </Link>
          <Link
            href="/cart"
            className="rounded-full border border-bone/20 px-5 py-2.5 text-sm font-semibold text-bone hover:border-neon hover:text-neon"
          >
            Back to cart
          </Link>
        </div>
      </div>
    </main>
  );
}
