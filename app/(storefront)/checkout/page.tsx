import type { Metadata } from "next";
import { CheckoutForm } from "@/components/storefront/checkout-form";
import { getCheckoutContext } from "@/lib/db/checkout";

export const metadata: Metadata = {
  title: "Checkout | BOOK MY TEES",
  description:
    "Complete your order with secure checkout and pan-India shipping from BOOK MY TEES.",
};

export default async function CheckoutPage() {
  const checkoutContext = await getCheckoutContext();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-neutral-600 sm:text-base">
          Enter shipping details to create your order. Payment is completed in the
          next step.
        </p>
      </div>

      <CheckoutForm
        isLoggedIn={Boolean(checkoutContext.user)}
        savedAddresses={checkoutContext.addresses}
        defaultEmail={checkoutContext.user?.email}
        defaultPhone={checkoutContext.customer?.phone}
        defaultFullName={checkoutContext.customer?.full_name}
      />
    </main>
  );
}
