"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import {
  createProductAction,
  updateProductAction,
} from "@/lib/actions/admin-products";
import {
  adminProductFormSchema,
  COMMON_PRODUCT_SIZES,
  type AdminProductFormInput,
} from "@/lib/validations/admin-product";
import { slugify } from "@/lib/utils/slugify";
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

function emptyVariant(): AdminProductFormInput["variants"][number] {
  return {
    size: "M",
    color: "Black",
    sku: "",
    stock_quantity: 0,
    price_override: null,
    is_active: true,
  };
}

function suggestSku(name: string, size: string, color: string): string {
  const base = slugify(name || "tee").toUpperCase().slice(0, 24);
  const sizePart = slugify(size || "sz").toUpperCase();
  const colorPart = slugify(color || "col").toUpperCase().slice(0, 12);
  return `${base}-${sizePart}-${colorPart}`;
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

  // Zod 4 + preprocess makes resolver input `unknown`; cast to output form type.
  const form = useForm<AdminProductFormInput>({
    resolver: zodResolver(
      adminProductFormSchema
    ) as Resolver<AdminProductFormInput>,
    defaultValues: {
      name: defaultValues?.name ?? "",
      description: defaultValues?.description ?? "",
      price: defaultValues?.price ?? 0,
      category_id: defaultValues?.category_id ?? "",
      is_active: defaultValues?.is_active ?? true,
      variants:
        defaultValues?.variants && defaultValues.variants.length > 0
          ? defaultValues.variants
          : [emptyVariant()],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variants",
    keyName: "fieldKey",
  });

  const isUploading = useMemo(
    () => images.some((image) => image.uploading),
    [images]
  );

  function firstFieldErrorMessage(
    errors: typeof form.formState.errors
  ): string | null {
    if (errors.name?.message) return String(errors.name.message);
    if (errors.description?.message) return String(errors.description.message);
    if (errors.price?.message) return String(errors.price.message);
    if (errors.category_id?.message) return String(errors.category_id.message);
    if (errors.variants?.message) return String(errors.variants.message);
    if (errors.variants?.root?.message) return String(errors.variants.root.message);

    const variantErrors = errors.variants;
    if (Array.isArray(variantErrors)) {
      for (let i = 0; i < variantErrors.length; i += 1) {
        const variant = variantErrors[i];
        if (!variant) continue;
        const message =
          variant.size?.message ||
          variant.color?.message ||
          variant.sku?.message ||
          variant.stock_quantity?.message ||
          variant.price_override?.message ||
          variant.id?.message ||
          variant.is_active?.message;
        if (message) {
          return `Variant ${i + 1}: ${String(message)}`;
        }
      }
    }

    return null;
  }

  function onInvalid(errors: typeof form.formState.errors) {
    const detail = firstFieldErrorMessage(errors);
    setFormError(
      detail
        ? `Please fix: ${detail}`
        : "Please fix the highlighted fields before saving."
    );
  }

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

    if (!Number.isFinite(values.price)) {
      setFormError("Enter a valid base price.");
      return;
    }

    const payloadImages = images.map((image, index) => ({
      url: image.url,
      position: index,
    }));

    const usedSkus = new Set<string>();
    const normalized: AdminProductFormInput = {
      ...values,
      variants: values.variants.map((variant) => {
        let sku =
          variant.sku.trim() ||
          suggestSku(values.name, variant.size, variant.color);
        const baseSku = sku;
        let suffix = 2;
        while (usedSkus.has(sku.toLowerCase())) {
          sku = `${baseSku}-${suffix}`;
          suffix += 1;
        }
        usedSkus.add(sku.toLowerCase());

        return {
          ...variant,
          sku,
          stock_quantity: Number.isFinite(variant.stock_quantity)
            ? variant.stock_quantity
            : 0,
          price_override:
            variant.price_override == null || Number.isNaN(variant.price_override)
              ? null
              : variant.price_override,
        };
      }),
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProductAction({ form: normalized, images: payloadImages })
          : await updateProductAction({
              productId: productId!,
              form: normalized,
              images: payloadImages,
            });

      if (!result.success) {
        setFormError(result.error);
        return;
      }

      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      className="space-y-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="name"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-300"
          >
            Title
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
            Base price (INR)
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
          <p className="mt-1 text-xs text-neutral-500">
            Used when a variant has no price override.
          </p>
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

        <div className="flex items-end sm:col-span-2">
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

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">
              Size &amp; colour variants
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Sellable stock lives on each variant. Leave override blank to use
              the base price.
            </p>
          </div>
          <button
            type="button"
            onClick={() => append(emptyVariant())}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition hover:border-lime-400 hover:text-lime-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Add variant
          </button>
        </div>

        {form.formState.errors.variants?.root && (
          <p className="text-xs text-red-300">
            {form.formState.errors.variants.root.message}
          </p>
        )}
        {typeof form.formState.errors.variants?.message === "string" && (
          <p className="text-xs text-red-300">
            {form.formState.errors.variants.message}
          </p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.fieldKey}
              className="grid gap-3 rounded-xl border border-neutral-800 bg-neutral-950/60 p-3 sm:grid-cols-12"
            >
              <input
                type="hidden"
                {...form.register(`variants.${index}.id`, {
                  setValueAs: (value) =>
                    value === "" || value == null ? undefined : value,
                })}
              />

              <div className="sm:col-span-2">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Size
                </label>
                <input
                  list="common-sizes"
                  {...form.register(`variants.${index}.size`)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-sm text-white outline-none focus:border-lime-400"
                />
                {form.formState.errors.variants?.[index]?.size && (
                  <p className="mt-1 text-[10px] text-red-300">
                    {form.formState.errors.variants[index]?.size?.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Colour
                </label>
                <input
                  {...form.register(`variants.${index}.color`)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-sm text-white outline-none focus:border-lime-400"
                />
                {form.formState.errors.variants?.[index]?.color && (
                  <p className="mt-1 text-[10px] text-red-300">
                    {form.formState.errors.variants[index]?.color?.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  SKU
                </label>
                <input
                  {...form.register(`variants.${index}.sku`)}
                  placeholder="Auto if blank"
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-sm text-white outline-none focus:border-lime-400"
                />
                {form.formState.errors.variants?.[index]?.sku && (
                  <p className="mt-1 text-[10px] text-red-300">
                    {form.formState.errors.variants[index]?.sku?.message}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Stock
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  {...form.register(`variants.${index}.stock_quantity`, {
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-sm text-white outline-none focus:border-lime-400"
                />
                {form.formState.errors.variants?.[index]?.stock_quantity && (
                  <p className="mt-1 text-[10px] text-red-300">
                    {
                      form.formState.errors.variants[index]?.stock_quantity
                        ?.message
                    }
                  </p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Override ₹
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  {...form.register(`variants.${index}.price_override`, {
                    setValueAs: (value) => {
                      if (value === "" || value == null) return null;
                      const num = Number(value);
                      return Number.isNaN(num) ? null : num;
                    },
                  })}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-sm text-white outline-none focus:border-lime-400"
                />
              </div>

              <div className="flex items-end justify-between gap-2 sm:col-span-1 sm:flex-col sm:items-stretch sm:justify-end">
                <label className="inline-flex items-center gap-1.5 text-[11px] text-neutral-300">
                  <input
                    type="checkbox"
                    {...form.register(`variants.${index}.is_active`)}
                    className="h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-950 text-lime-400"
                  />
                  On
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (fields.length <= 1) return;
                    remove(index);
                  }}
                  disabled={fields.length <= 1}
                  className="inline-flex items-center justify-center rounded-lg border border-neutral-700 p-2 text-neutral-400 transition hover:border-red-700 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Remove variant"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <datalist id="common-sizes">
          {COMMON_PRODUCT_SIZES.map((size) => (
            <option key={size} value={size} />
          ))}
        </datalist>
      </section>

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
          href="/admin/products"
          className="rounded-full border border-neutral-700 px-5 py-2.5 text-sm font-semibold text-neutral-200 transition hover:border-neutral-500"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
