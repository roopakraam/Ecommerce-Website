import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { getAdminProductById } from "@/lib/db/admin-products";
import { getAllCategories } from "@/lib/db/categories";
import { ADMIN_PRODUCTS_PATH } from "@/lib/admin/products";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: {
    id: string;
  };
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const [product, categories] = await Promise.all([
    getAdminProductById(params.id),
    getAllCategories(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link
          href={ADMIN_PRODUCTS_PATH}
          className="text-sm text-muted-foreground transition hover:text-foreground"
        >
          ← Back to products
        </Link>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Edit product
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{product.name}</p>
      </div>

      <ProductForm
        mode="edit"
        productId={product.id}
        categories={categories}
        defaultValues={{
          name: product.name,
          description: product.description ?? "",
          price: Number(product.price),
          category_id: product.category_id ?? "",
          is_active: product.is_active,
          variants: product.product_variants.map((variant) => ({
            id: variant.id,
            size: variant.size,
            color: variant.color,
            sku: variant.sku,
            stock_quantity: variant.stock_quantity,
            price_override:
              variant.price_override != null
                ? Number(variant.price_override)
                : null,
            is_active: variant.is_active,
          })),
        }}
        initialImages={product.product_images.map((image) => ({
          id: image.id,
          url: image.url,
        }))}
      />
    </main>
  );
}
