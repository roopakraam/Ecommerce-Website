import { ReviewsFilters } from "@/components/admin/reviews-filters";
import { ReviewsTable } from "@/components/admin/reviews-table";
import { getAdminReviews } from "@/lib/db/admin-reviews";
import {
  REVIEW_STATUSES,
  type AdminReviewStatusFilter,
} from "@/lib/admin/reviews";

export const dynamic = "force-dynamic";

interface AdminReviewsPageProps {
  searchParams: {
    status?: string;
  };
}

function parseStatus(value: string | undefined): AdminReviewStatusFilter {
  if (value && (REVIEW_STATUSES as readonly string[]).includes(value)) {
    return value as AdminReviewStatusFilter;
  }
  return "pending";
}

export default async function AdminReviewsPage({
  searchParams,
}: AdminReviewsPageProps) {
  const status = parseStatus(searchParams.status);
  let reviews: Awaited<ReturnType<typeof getAdminReviews>> = [];
  let loadError: string | null = null;

  try {
    reviews = await getAdminReviews({ status });
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Failed to load reviews.";
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Reviews
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Moderate pending product reviews. Approve or reject, then jump to the
          product page.
        </p>
      </div>

      <div className="space-y-4">
        <ReviewsFilters status={status} />
        {loadError ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
            {loadError}
          </p>
        ) : (
          <ReviewsTable
            reviews={reviews}
            hasActiveFilter={status !== "all"}
          />
        )}
      </div>
    </main>
  );
}
