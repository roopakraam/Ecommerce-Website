import type { ProductDetail } from "@/lib/db/products";
import { absoluteUrl } from "@/lib/seo/site";

interface ProductJsonLdProps {
  product: ProductDetail;
  images: Array<{ url: string }>;
}

export function ProductJsonLd({ product, images }: ProductJsonLdProps) {
  const availability =
    product.stock_quantity > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.description ??
      `${product.name} from BOOK MY TEES — premium cotton tee with pan-India delivery.`,
    sku: product.id,
    url: absoluteUrl(`/products/${product.slug}`),
    image: images.map((image) => image.url),
    brand: {
      "@type": "Brand",
      name: "BOOK MY TEES",
    },
    category: product.categories?.name,
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: "INR",
      price: Number(product.price).toFixed(2),
      availability,
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
