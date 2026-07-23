import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountAddressBook } from "@/components/storefront/account-address-book";
import { AccountProfileForm } from "@/components/storefront/account-profile-form";
import { PageHero } from "@/components/storefront/page-hero";
import {
  getAccountAddresses,
  getAccountOrders,
  getAccountProfile,
} from "@/lib/db/account";
import { formatPrice } from "@/lib/utils/format-price";
import { buildPageMetadata } from "@/lib/seo/site";

export const metadata = buildPageMetadata({
  title: "My Account",
  description: "View your BOOK MY TEES account details and recent orders.",
  path: "/account",
  noIndex: true,
});

export default async function AccountPage() {
  const profile = await getAccountProfile();

  if (!profile) {
    redirect("/login?next=/account");
  }

  const [recentOrders, addresses] = await Promise.all([
    getAccountOrders(5),
    getAccountAddresses(),
  ]);

  return (
    <main>
      <PageHero
        eyebrow="Account"
        title={profile.fullName ? `Hi, ${profile.fullName.split(" ")[0]}` : "My account"}
        description="Update your details, manage saved addresses, and track BOOK MY TEES orders."
      />

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 sm:py-14">
        <AccountProfileForm
          fullName={profile.fullName}
          email={profile.email}
          phone={profile.phone}
        />

        <AccountAddressBook addresses={addresses} />

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl uppercase tracking-tight text-bone">
              Recent orders
            </h2>
            <Link
              href="/account/orders"
              className="text-sm font-medium text-neon hover:underline"
            >
              View all orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-bone/15 px-6 py-10 text-center">
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
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/order-confirmation/${order.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-surface2"
                  >
                    <div>
                      <p className="font-mono text-xs text-dust">
                        {order.id.slice(0, 8)}… · {order.itemCount} item
                        {order.itemCount === 1 ? "" : "s"}
                      </p>
                      <p className="mt-1 text-sm text-bone">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <p className="font-mono text-sm font-bold text-neon">
                      {formatPrice(order.total)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
