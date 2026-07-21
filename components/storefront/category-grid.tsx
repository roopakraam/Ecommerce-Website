import Link from "next/link";
import type { Category } from "@/types";

const categoryAccents = [
  "from-neutral-900 to-neutral-800",
  "from-neutral-950 to-neutral-900",
  "from-lime-950 to-neutral-900",
  "from-neutral-900 to-lime-950",
  "from-neutral-950 to-neutral-800",
];

interface CategoryGridProps {
  categories: Category[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-10 text-center text-sm text-neutral-500">
        Collections are on the way — check back soon for graphic tees, basics, and
        limited drops.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
      {categories.map((category, index) => (
        <li key={category.id}>
          <Link
            href={`/products?category=${category.slug}`}
            className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-lime-400 hover:shadow-md"
          >
            <div
              className={`flex h-28 items-end bg-gradient-to-br p-4 sm:h-32 ${categoryAccents[index % categoryAccents.length]}`}
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-lime-400">
                Shop
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-neutral-950 group-hover:text-lime-600">
                {category.name}
              </h3>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
