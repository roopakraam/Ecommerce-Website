import Link from "next/link";
import { ArrowRight, Shirt } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(163,230,53,0.15),_transparent_50%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 sm:px-6 sm:py-24 lg:flex-row lg:items-center lg:gap-12 lg:py-28">
        <div className="flex-1">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-lime-400">
            New drops every week
          </p>
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Tees that speak{" "}
            <span className="text-lime-400">louder than words</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-300 sm:text-lg">
            BOOK MY TEES brings bold graphic tees, everyday essentials, and limited
            runs in premium cotton — sized for comfort, styled for the street.
            Ships across India.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="#featured-products"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-400 px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-lime-300"
            >
              Shop new arrivals
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#featured-categories"
              className="inline-flex items-center justify-center rounded-full border border-neutral-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-lime-400 hover:text-lime-400"
            >
              Browse collections
            </Link>
          </div>
        </div>

        <div className="flex flex-1 justify-center lg:justify-end">
          <div className="relative flex h-64 w-full max-w-sm items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900 sm:h-80">
            <div className="absolute inset-4 rounded-2xl border border-dashed border-neutral-700" />
            <div className="relative flex flex-col items-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-400/10 text-lime-400">
                <Shirt className="h-8 w-8" />
              </div>
              <p className="text-sm font-medium text-neutral-400">
                Black · White · Neon
              </p>
              <p className="text-xs text-neutral-500">Premium cotton · Unisex fit</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
