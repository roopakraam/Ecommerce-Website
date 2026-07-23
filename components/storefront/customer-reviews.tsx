"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { ProductReview } from "@/types";

function reviewerDisplayName(review: ProductReview): string {
  const name = review.reviewer_name?.trim();
  return name && name.length > 0 ? name : "Verified buyer";
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <div className="mb-4 flex items-center gap-1 text-ink" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < filled ? "fill-current" : "text-ink/20"}`}
        />
      ))}
    </div>
  );
}

interface CustomerReviewsProps {
  reviews: ProductReview[];
}

export function CustomerReviews({ reviews }: CustomerReviewsProps) {
  return (
    <section className="relative overflow-hidden border-t border-ink/10 bg-bone py-16 sm:py-20">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 flex flex-col gap-3">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-ink/40">
            Verified buyers
          </p>
          <h2 className="font-display text-4xl uppercase leading-[0.9] tracking-tight text-ink sm:text-5xl">
            Word on the street
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-ink/55">
            Don&apos;t just take our word for it. Here&apos;s what the community is saying about the fit, feel, and quality of our drops.
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-white/60 px-6 py-14 text-center">
            <p className="font-display text-xl uppercase tracking-tight text-ink/70">
              Reviews coming soon
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink/45">
              Be among the first to leave feedback after your order ships — approved reviews show up here.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, index) => {
              const name = reviewerDisplayName(review);

              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                  className="group relative flex flex-col justify-between rounded-2xl border border-ink/10 bg-white p-6 transition-colors duration-300 hover:border-ink/30"
                >
                  <div>
                    <StarRating rating={review.rating} />
                    {review.title && (
                      <p className="mb-2 text-sm font-bold text-ink">{review.title}</p>
                    )}
                    <p className="mb-6 text-sm font-medium leading-relaxed text-ink/80">
                      &quot;{review.body}&quot;
                    </p>
                  </div>
                  <div className="mt-auto flex items-center gap-3 border-t border-ink/10 pt-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/5 font-black uppercase text-ink">
                      {name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink">{name}</p>
                      <p className="font-mono text-xs text-ink/45">Verified buyer</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
