"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ExternalLink, X } from "lucide-react";
import { updateReviewStatusAction } from "@/lib/actions/admin-reviews";
import type { AdminReviewListItem } from "@/lib/db/admin-reviews";
import { ADMIN_PRODUCTS_PATH } from "@/lib/admin/products";
import { ADMIN_REVIEWS_PATH } from "@/lib/admin/reviews";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { ReviewStatus } from "@/types";

interface ReviewsTableProps {
  reviews: AdminReviewListItem[];
  hasActiveFilter: boolean;
}

const STATUS_CLASS: Record<ReviewStatus, string> = {
  pending: "border-amber-700 bg-amber-950 text-amber-300",
  approved: "border-emerald-700 bg-emerald-950 text-emerald-300",
  rejected: "border-red-800 bg-red-950 text-red-300",
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="font-semibold tracking-tight text-primary" aria-label={`${rating} out of 5`}>
      {"★".repeat(rating)}
      <span className="text-muted-foreground">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ReviewsTable({
  reviews,
  hasActiveFilter,
}: ReviewsTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function moderate(reviewId: string, status: ReviewStatus) {
    setErrorMessage(null);
    setPendingId(reviewId);
    startTransition(async () => {
      const result = await updateReviewStatusAction({ reviewId, status });
      if (!result.success) {
        setErrorMessage(result.error);
        setPendingId(null);
        return;
      }
      setPendingId(null);
      router.refresh();
    });
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        tone="dark"
        title={
          hasActiveFilter
            ? "No reviews in this queue"
            : "No reviews yet"
        }
        description={
          hasActiveFilter
            ? "Try another status filter."
            : "Customer reviews will appear here for moderation once submitted."
        }
        actionHref={hasActiveFilter ? ADMIN_REVIEWS_PATH : undefined}
        actionLabel={hasActiveFilter ? "Show all" : undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
          {errorMessage}
        </p>
      ) : null}

      <div className="space-y-3">
        {reviews.map((review) => {
          const busy = isPending && pendingId === review.id;
          const productHref = review.products
            ? `/products/${review.products.slug}`
            : null;
          const adminProductHref = `${ADMIN_PRODUCTS_PATH}/${review.product_id}/edit`;
          const author =
            review.reviewer_name ||
            review.customers?.full_name ||
            "Anonymous";

          return (
            <article
              key={review.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars rating={review.rating} />
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[review.status]}`}
                    >
                      {review.status}
                    </span>
                  </div>
                  {review.title ? (
                    <h2 className="text-sm font-semibold text-foreground">
                      {review.title}
                    </h2>
                  ) : null}
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {review.body}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {author} · {formatDate(review.created_at)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {review.status === "pending" ? (
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => moderate(review.id, "approved")}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => moderate(review.id, "rejected")}
                        className="border-destructive/40 text-red-300 hover:bg-destructive/10"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-2">
                      {review.status !== "approved" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => moderate(review.id, "approved")}
                        >
                          Approve
                        </Button>
                      ) : null}
                      {review.status !== "rejected" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => moderate(review.id, "rejected")}
                        >
                          Reject
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => moderate(review.id, "pending")}
                      >
                        Requeue
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-medium text-foreground">
                  {review.products?.name ?? "Unknown product"}
                </span>
                {productHref ? (
                  <Link
                    href={productHref}
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View product
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : null}
                <Link
                  href={adminProductHref}
                  className="font-semibold text-muted-foreground hover:text-foreground hover:underline"
                >
                  Edit in admin
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
