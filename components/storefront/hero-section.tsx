"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Link2 } from "lucide-react";

const STATS = [
  { value: "50K+", label: "Tees Shipped" },
  { value: "12K+", label: "Happy Wearers" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-neon/10 blur-[110px]" />
        <div className="absolute -right-24 -top-20 h-96 w-96 rounded-full bg-neon/10 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 sm:py-14 lg:min-h-[calc(100vh-73px)] lg:py-16">
        <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1 className="font-display text-[15vw] leading-[0.9] uppercase tracking-tight text-bone sm:text-7xl lg:text-7xl xl:text-8xl">
              Book My
              <br />
              <span className="text-neon">Tees.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-dust">
              Discover a t-shirt experience that mirrors your personality and
              amplifies it. At Book My Tees, every piece is crafted to elevate
              your confidence, celebrate your individuality, and empower you
              to stand out — without saying a word.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center rounded-full bg-neon px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone"
              >
                Shop Now
              </Link>
              <Link
                href="/products?sort=newest"
                className="inline-flex items-center justify-center rounded-full border border-bone/25 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-bone transition hover:border-neon hover:text-neon"
              >
                New Arrivals
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-5 sm:gap-7">
              {STATS.map((stat, index) => (
                <div key={stat.label} className="flex items-center gap-5 sm:gap-7">
                  {index > 0 && (
                    <span className="h-8 w-px bg-bone/15" aria-hidden="true" />
                  )}
                  <div>
                    <div className="font-display text-2xl tracking-tight text-bone sm:text-3xl">
                      {stat.value}
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-widest text-dust">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
              <span className="h-8 w-px bg-bone/15" aria-hidden="true" />
              <div className="flex items-center gap-2 text-dust">
                <Link2 className="h-5 w-5 text-neon" />
                <span className="font-mono text-[11px] uppercase leading-tight tracking-widest">
                  Premium
                  <br />
                  Cotton
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15, ease: "easeOut" }}
            className="relative mx-auto h-[420px] w-full max-w-sm sm:h-[480px] lg:h-[560px] lg:max-w-none lg:justify-self-end"
          >
            {/* Large portrait — night streetwear shot */}
            <div className="absolute left-0 top-0 h-[64%] w-[58%] overflow-hidden rounded-[1.75rem] border border-bone/10 shadow-2xl shadow-black/60">
              <Image
                src="/images/hero.png"
                alt="Book My Tees streetwear model at night"
                fill
                priority
                sizes="(max-width: 1024px) 60vw, 30vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
            </div>

            {/* Top-right portrait — hoodie in concrete stairwell */}
            <div className="absolute right-0 top-[4%] h-[46%] w-[40%] overflow-hidden rounded-[1.75rem] border border-bone/10 shadow-2xl shadow-black/60">
              <Image
                src="/images/category-1.png"
                alt="Book My Tees hoodie lookbook"
                fill
                sizes="(max-width: 1024px) 40vw, 20vw"
                className="object-cover"
              />
            </div>

            {/* Bottom-right — folded tee stack */}
            <div className="absolute bottom-0 right-[2%] h-[40%] w-[48%] overflow-hidden rounded-[1.75rem] border border-bone/10 shadow-2xl shadow-black/60">
              <Image
                src="/images/category-2.png"
                alt="Folded Book My Tees stack"
                fill
                sizes="(max-width: 1024px) 48vw, 24vw"
                className="object-cover"
              />
            </div>

            {/* Arrow badge accent, echoes the top image's corner */}
            <div className="absolute left-[50%] top-[2%] flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-neon shadow-lg shadow-black/40">
              <ArrowUpRight className="h-5 w-5 text-ink" />
            </div>

            {/* Rating pill, floats between the collage tiles */}
            <div className="absolute left-[36%] top-[54%] flex items-center gap-2 rounded-full border border-bone/10 bg-surface2/95 px-4 py-2.5 shadow-xl shadow-black/50 backdrop-blur">
              <span className="text-sm text-neon" aria-hidden="true">
                ✦
              </span>
              <span className="whitespace-nowrap text-xs font-bold uppercase tracking-wide text-bone">
                4.9 Rated
              </span>
            </div>

            {/* Loose sparkle + dot accents */}
            <span
              className="absolute -left-3 bottom-[26%] text-2xl leading-none text-neon"
              aria-hidden="true"
            >
              ✦
            </span>
            <span
              className="absolute right-[10%] top-[52%] h-3 w-3 rounded-full bg-bone/30"
              aria-hidden="true"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
