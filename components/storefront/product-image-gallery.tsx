"use client";

import Image from "next/image";
import { useState } from "react";
import { Camera } from "lucide-react";
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
      <div className="relative flex aspect-square items-center justify-center rounded-2xl bg-surface">
        <div className="absolute inset-4 rounded-2xl border border-dashed border-bone/20" />
        <div className="text-center">
          <Camera className="mx-auto h-6 w-6 text-dust" />
          <p className="mt-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-bone">
            Photo Coming Soon
          </p>
          <p className="mt-1.5 font-mono text-[10px] text-dust">
            {productName} · Square 1:1
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
        <Image
          src={activeImage.url}
          alt={`${productName} — image ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 560px"
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
                    ? "border-neon"
                    : "border-transparent hover:border-bone/30"
                }`}
                aria-label={`View image ${index + 1}`}
                aria-current={index === activeIndex}
              >
                <Image
                  src={image.url}
                  alt={`${productName} thumbnail ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 20vw, 80px"
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
