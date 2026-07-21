import { notFound } from "next/navigation";
import Link from "next/link";
import { RazorpayCheckout } from "@/components/storefront/razorpay-checkout";
import { getOrderForPayment } from "@/lib/db/orders";
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
      <main className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-neutral-950">Missing order</h1>
        <p className="mt-3 text-sm text-neutral-600">
          No order was provided for payment. Return to checkout and try again.
        </p>
        <Link
          href="/checkout"
          className="mt-8 inline-flex rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white hover:bg-lime-400 hover:text-neutral-950"
        >
          Back to checkout
        </Link>
      </main>
    );
  }

  const order = await getOrderForPayment(orderId);

  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950">
          Complete payment
        </h1>
        <p className="mt-2 text-sm text-neutral-600 sm:text-base">
          Pay securely with Razorpay. Your order is reserved while you complete
          checkout.
        </p>
      </div>

      <RazorpayCheckout
        orderId={order.id}
        orderTotal={order.total}
        initialPaymentStatus={order.payment_status}
      />

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/products"
          className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:border-neutral-950"
        >
          Continue shopping
        </Link>
        <Link
          href="/cart"
          className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-950 hover:border-neutral-950"
        >
          Back to cart
        </Link>
      </div>
    </main>
  );
}
