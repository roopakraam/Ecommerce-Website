"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  createProductAction,
  updateProductAction,
} from "@/lib/actions/admin-products";
import {
  adminProductFormSchema,
  type AdminProductFormInput,
} from "@/lib/validations/admin-product";
import type { Category } from "@/types";
import {
  ProductImageUploader,
  type ProductFormImage,
} from "@/components/admin/product-image-uploader";

interface ProductFormProps {
  mode: "create" | "edit";
  productId?: string;
  categories: Category[];
  defaultValues?: Partial<AdminProductFormInput>;
  initialImages?: ProductFormImage[];
}

export function ProductForm({
  mode,
  productId,
  categories,
  defaultValues,
  initialImages = [],
}: ProductFormProps) {
  const router = useRouter();
  const [images, setImages] = useState<ProductFormImage[]>(initialImages);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AdminProductFormInput>({
    resolver: zodResolver(adminProductFormSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      price: defaultValues?.price ?? 0,
      stock_quantity: defaultValues?.stock_quantity ?? 0,
      category_id: defaultValues?.category_id ?? "",
      is_active: defaultValues?.is_active ?? true,
    },
  });

  const isUploading = useMemo(
    () => images.some((image) => image.uploading),
    [images]
  );

  function onSubmit(values: AdminProductFormInput) {
    setFormError(null);

    if (images.some((image) => image.uploading)) {
      setFormError("Wait for image uploads to finish.");
      return;
    }

    if (images.some((image) => image.error)) {
      setFormError("Remove failed uploads before saving.");
      return;
    }

    const payloadImages = images.map((image, index) => ({
      url: image.url,
      position: index,
    }));

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProductAction({ form: values, images: payloadImages })
          : await updateProductAction({
              productId: productId!,
              form: values,
              images: payloadImages,
            });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      router.push("/admin/dashboard/products");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="name"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-300"
          >
            Name
          </label>
          <input
            id="name"
            {...form.register("name")}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none ring-lime-400 transition focus:border-lime-400 focus:ring-2"
            placeholder="Neon Oversized Tee"
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-xs text-red-300">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="description"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-300"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={5}
            {...form.register("description")}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none ring-lime-400 transition focus:border-lime-400 focus:ring-2"
            placeholder="Soft cotton drop-shoulder tee with neon print..."
          />
          {form.formState.errors.description && (
            <p className="mt-1 text-xs text-red-300">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="price"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-300"
          >
            Price (INR)
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            {...form.register("price", { valueAsNumber: true })}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none ring-lime-400 transition focus:border-lime-400 focus:ring-2"
          />
          {form.formState.errors.price && (
            <p className="mt-1 text-xs text-red-300">
              {form.formState.errors.price.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="stock_quantity"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-300"
          >
            Stock
          </label>
          <input
            id="stock_quantity"
            type="number"
            step="1"
            min="0"
            {...form.register("stock_quantity", { valueAsNumber: true })}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none ring-lime-400 transition focus:border-lime-400 focus:ring-2"
          />
          {form.formState.errors.stock_quantity && (
            <p className="mt-1 text-xs text-red-300">
              {form.formState.errors.stock_quantity.message}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="category_id"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-300"
          >
            Category
          </label>
          <select
            id="category_id"
            {...form.register("category_id")}
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none ring-lime-400 transition focus:border-lime-400 focus:ring-2"
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {form.formState.errors.category_id && (
            <p className="mt-1 text-xs text-red-300">
              {form.formState.errors.category_id.message}
            </p>
          )}
        </div>

        <div className="flex items-end">
          <label className="inline-flex items-center gap-2 text-sm text-neutral-200">
            <input
              type="checkbox"
              {...form.register("is_active")}
              className="h-4 w-4 rounded border-neutral-600 bg-neutral-950 text-lime-400 focus:ring-lime-400"
            />
            Active on storefront
          </label>
        </div>
      </div>

      <ProductImageUploader images={images} onChange={setImages} />

      {formError && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {formError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending || isUploading}
          className="rounded-full bg-lime-400 px-5 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending
            ? "Saving..."
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </button>
        <Link
          href="/admin/dashboard/products"
          className="rounded-full border border-neutral-700 px-5 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-neutral-500"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
