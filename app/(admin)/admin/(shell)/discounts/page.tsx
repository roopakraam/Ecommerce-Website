import { DiscountsManager } from "@/components/admin/discounts-manager";
import { getAdminCoupons } from "@/lib/db/admin-discounts";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  let coupons: Awaited<ReturnType<typeof getAdminCoupons>> = [];
  let loadError: string | null = null;

  try {
    coupons = await getAdminCoupons();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Failed to load coupons.";
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Discounts
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create and manage coupon codes with percentage or fixed discounts,
          date ranges, and usage limits.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {loadError}
        </p>
      ) : (
        <DiscountsManager coupons={coupons} />
      )}
    </main>
  );
}
