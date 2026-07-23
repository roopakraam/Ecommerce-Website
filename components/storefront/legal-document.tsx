import type { ReactNode } from "react";
import { PageHero } from "@/components/storefront/page-hero";

interface LegalDocumentProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalDocument({
  title,
  lastUpdated,
  children,
}: LegalDocumentProps) {
  return (
    <main>
      <PageHero
        eyebrow="Legal"
        title={title}
        description={`Last updated: ${lastUpdated}`}
        containerClassName="max-w-3xl"
      />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="space-y-8 text-sm leading-relaxed text-bone/80">
          {children}
        </div>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold tracking-tight text-bone">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-bone/80">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
