"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/db/products";

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 text-sm font-medium text-neutral-400">
        Photo coming soon
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
        <Image
          src={activeImage.url}
          alt={`${productName} — image ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {images.map((image, index) => (
            <li key={`${image.url}-${index}`}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative aspect-square w-full overflow-hidden rounded-xl border-2 transition ${
                  index === activeIndex
                    ? "border-lime-400"
                    : "border-transparent hover:border-neutral-300"
                }`}
                aria-label={`View image ${index + 1}`}
                aria-current={index === activeIndex}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
