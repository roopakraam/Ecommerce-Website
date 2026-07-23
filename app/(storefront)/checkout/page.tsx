import { CheckoutForm } from "@/components/storefront/checkout-form";
import { PageHero } from "@/components/storefront/page-hero";
import { getCheckoutContext } from "@/lib/db/checkout";
import { getPublicStoreCommerceSettings } from "@/lib/db/store-settings";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "Checkout",
  description:
    "Complete your order with secure checkout and pan-India shipping from BOOK MY TEES.",
  path: "/checkout",
  noIndex: true,
});

export default async function CheckoutPage() {
  const [checkoutContext, commerce] = await Promise.all([
    getCheckoutContext(),
    getPublicStoreCommerceSettings(),
  ]);

  return (
    <main>
      <PageHero
        eyebrow="Checkout"
        title="Checkout"
        description="Enter shipping details to create your order. Payment is completed in the next step."
      />

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <CheckoutForm
        isLoggedIn={Boolean(checkoutContext.user)}
        savedAddresses={checkoutContext.addresses}
        defaultEmail={checkoutContext.user?.email}
        defaultPhone={checkoutContext.customer?.phone}
        defaultFullName={checkoutContext.customer?.full_name}
        commerce={{
          taxRate: commerce.taxRate,
          zones: commerce.zones.map((zone) => ({
            name: zone.name,
            states: zone.states,
            flat_rate: zone.flat_rate,
            free_above: zone.free_above,
            is_active: zone.is_active,
            sort_order: zone.sort_order,
          })),
        }}
      />
      </div>
    </main>
  );
}
