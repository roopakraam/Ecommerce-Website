import type { ReactNode } from "react";
import Link from "next/link";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  containerClassName?: string;
}

/**
 * Shared banner used at the top of every interior storefront page so the
 * site reads consistently. The homepage keeps its own bespoke marketing
 * hero (components/storefront/hero-section.tsx) since it needs a product
 * photo + big headline; everything else (shop, cart, checkout, auth, legal,
 * contact, order confirmation) renders this instead.
 */
export function PageHero({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
  containerClassName = "max-w-6xl",
}: PageHeroProps) {
  return (
    <section className="border-b border-bone/10 bg-surface">
      <div className={`mx-auto px-4 py-10 sm:px-6 sm:py-14 ${containerClassName}`}>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4 font-mono text-xs text-dust" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.label}>
                {index > 0 && <span className="mx-2">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-bone">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-bone">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        {eyebrow && (
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-neon">
            {eyebrow}
          </p>
        )}

        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="font-display text-3xl uppercase leading-[0.95] tracking-tight text-bone sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>

        {description && (
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-dust sm:text-base">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
