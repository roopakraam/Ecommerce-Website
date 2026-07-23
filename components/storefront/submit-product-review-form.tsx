"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { submitProductReviewAction } from "@/lib/actions/reviews";
import { useStorefrontAuth } from "@/lib/hooks/use-storefront-auth";
import { useAuthModalStore } from "@/lib/store/auth-modal";

interface SubmitProductReviewFormProps {
  productId: string;
  productSlug: string;
}

export function SubmitProductReviewForm({
  productId,
  productSlug,
}: SubmitProductReviewFormProps) {
  const { isLoggedIn, isLoading } = useStorefrontAuth();
  const openAuthModal = useAuthModalStore((s) => s.open);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [reviewerName, setReviewerName] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await submitProductReviewAction({
        productId,
        productSlug,
        rating,
        title,
        body,
        reviewerName,
      });

      if (result.success) {
        setSuccess(true);
        setTitle("");
        setBody("");
        setReviewerName("");
        setRating(5);
      } else {
        setError(result.error);
      }
    });
  }

  if (isLoading) {
    return (
      <p className="font-mono text-xs uppercase tracking-wide text-dust">
        Checking your account…
      </p>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="rounded-2xl border border-bone/10 bg-surface p-6">
        <p className="text-sm text-dust">
          Sign in to share your take on this drop. Reviews are moderated before they go live.
        </p>
        <button
          type="button"
          onClick={() => openAuthModal("login")}
          className="mt-4 inline-flex items-center justify-center rounded-full bg-neon px-6 py-2.5 text-xs font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
        >
          Sign in to review
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-start rounded-2xl border border-bone/10 bg-surface p-6">
        <CheckCircle2 className="h-8 w-8 text-neon" />
        <h3 className="mt-3 font-display text-lg uppercase tracking-tight text-bone">
          Review submitted
        </h3>
        <p className="mt-2 max-w-md text-sm text-dust">
          Thanks — your review is pending moderation and will appear once approved.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-4 text-sm font-medium text-dust underline underline-offset-4 hover:text-bone"
        >
          Write another review
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-bone/10 bg-surface p-6"
    >
      <div>
        <p className="font-mono text-xs uppercase tracking-wide text-dust">Your rating</p>
        <div className="mt-2 flex items-center gap-1" role="group" aria-label="Rating">
          {Array.from({ length: 5 }, (_, i) => {
            const value = i + 1;
            const active = value <= rating;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded p-0.5 text-bone transition hover:text-neon focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neon"
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                aria-pressed={active}
              >
                <Star className={`h-6 w-6 ${active ? "fill-neon text-neon" : "text-bone/25"}`} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="review-name" className="font-mono text-xs uppercase tracking-wide text-dust">
          Display name <span className="text-dust/60">(optional)</span>
        </label>
        <input
          id="review-name"
          type="text"
          value={reviewerName}
          onChange={(event) => setReviewerName(event.target.value)}
          maxLength={80}
          placeholder="How you want to appear"
          className="rounded-xl border border-bone/15 bg-surface2 px-4 py-2.5 text-sm text-bone outline-none ring-neon placeholder:text-dust/40 focus:border-neon focus:ring-2"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="review-title" className="font-mono text-xs uppercase tracking-wide text-dust">
          Title <span className="text-dust/60">(optional)</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          placeholder="Sum it up in a few words"
          className="rounded-xl border border-bone/15 bg-surface2 px-4 py-2.5 text-sm text-bone outline-none ring-neon placeholder:text-dust/40 focus:border-neon focus:ring-2"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="review-body" className="font-mono text-xs uppercase tracking-wide text-dust">
          Review
        </label>
        <textarea
          id="review-body"
          required
          rows={4}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={2000}
          placeholder="Fit, fabric, print quality — what stood out?"
          className="resize-none rounded-xl border border-bone/15 bg-surface2 px-4 py-2.5 text-sm text-bone outline-none ring-neon placeholder:text-dust/40 focus:border-neon focus:ring-2"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-neon px-6 py-3 text-xs font-bold uppercase tracking-wide text-ink transition hover:bg-bone disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
