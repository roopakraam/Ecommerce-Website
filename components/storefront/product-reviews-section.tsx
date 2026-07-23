import { Star } from "lucide-react";
import { SubmitProductReviewForm } from "@/components/storefront/submit-product-review-form";
import type { ProductReview } from "@/types";

function reviewerDisplayName(review: ProductReview): string {
  const name = review.reviewer_name?.trim();
  return name && name.length > 0 ? name : "Verified buyer";
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <div className="flex items-center gap-1 text-neon" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < filled ? "fill-current" : "text-bone/20"}`}
        />
      ))}
    </div>
  );
}

interface ProductReviewsSectionProps {
  productId: string;
  productSlug: string;
  reviews: ProductReview[];
}

export function ProductReviewsSection({
  productId,
  productSlug,
  reviews,
}: ProductReviewsSectionProps) {
  return (
    <section className="mt-16 border-t border-bone/10 pt-12 sm:mt-20 sm:pt-16">
      <div className="mb-8 flex flex-col gap-2">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-dust">
          Customer reviews
        </p>
        <h2 className="font-display text-3xl uppercase tracking-tight text-bone sm:text-4xl">
          What buyers say
        </h2>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
        <div className="flex flex-col gap-4">
          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-bone/15 px-6 py-12 text-center">
              <p className="text-sm text-dust">
                No approved reviews yet. Be the first to share how this tee holds up.
              </p>
            </div>
          ) : (
            reviews.map((review) => {
              const name = reviewerDisplayName(review);
              return (
                <article
                  key={review.id}
                  className="rounded-2xl border border-bone/10 bg-surface p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StarRating rating={review.rating} />
                    <p className="text-sm font-semibold text-bone">{name}</p>
                  </div>
                  {review.title && (
                    <h3 className="mt-3 text-sm font-bold text-bone">{review.title}</h3>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-dust">{review.body}</p>
                </article>
              );
            })
          )}
        </div>

        <div>
          <h3 className="mb-4 font-mono text-xs uppercase tracking-wide text-dust">
            Leave a review
          </h3>
          <SubmitProductReviewForm productId={productId} productSlug={productSlug} />
        </div>
      </div>
    </section>
  );
}
