"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import {
  deleteProductAction,
  toggleProductActiveAction,
} from "@/lib/actions/admin-products";
import type { AdminProductListItem } from "@/lib/db/admin-products";
import { formatPrice } from "@/lib/utils/format-price";

interface ProductsTableProps {
  products: AdminProductListItem[];
}

function getCoverUrl(product: AdminProductListItem): string | null {
  const sorted = [...product.product_images].sort(
    (a, b) => a.position - b.position
  );
  return sorted[0]?.url ?? null;
}

export function ProductsTable({ products }: ProductsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function runAction(productId: string, action: () => Promise<void>) {
    setErrorMessage(null);
    setPendingId(productId);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Something went wrong."
        );
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleToggle(product: AdminProductListItem) {
    runAction(product.id, async () => {
      const result = await toggleProductActiveAction(
        product.id,
        !product.is_active
      );
      if (!result.success) {
        throw new Error(result.error);
      }
    });
  }

  function handleDelete(product: AdminProductListItem) {
    const confirmed = window.confirm(
      `Delete “${product.name}”? This cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    runAction(product.id, async () => {
      const result = await deleteProductAction(product.id);
      if (!result.success) {
        throw new Error(result.error);
      }
    });
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-700 bg-neutral-900/50 px-6 py-16 text-center">
        <p className="text-sm text-neutral-400">No products yet.</p>
        <Link
          href="/admin/dashboard/products/new"
          className="mt-4 inline-flex rounded-full bg-lime-400 px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-lime-300"
        >
          Add your first product
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {errorMessage}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-neutral-800">
        <table className="min-w-full divide-y divide-neutral-800 text-left text-sm">
          <thead className="bg-neutral-900 text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Category</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 bg-neutral-950">
            {products.map((product) => {
              const cover = getCoverUrl(product);
              const busy = isPending && pendingId === product.id;

              return (
                <tr key={product.id} className="align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-neutral-800">
                        {cover ? (
                          <Image
                            src={cover}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-500">
                            No img
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="text-xs text-neutral-500">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-neutral-300">
                    {product.categories?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-neutral-200">
                    {formatPrice(Number(product.price))}
                  </td>
                  <td className="px-4 py-3 text-neutral-200">
                    {product.stock_quantity}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleToggle(product)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
                        product.is_active
                          ? "border-emerald-700 bg-emerald-950 text-emerald-300"
                          : "border-neutral-700 bg-neutral-900 text-neutral-400"
                      }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/dashboard/products/${product.id}/edit`}
                        className="inline-flex items-center gap-1 rounded-full border border-neutral-700 px-3 py-1.5 text-xs font-semibold text-neutral-200 transition hover:border-lime-400 hover:text-lime-300"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(product)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-900 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-950 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
