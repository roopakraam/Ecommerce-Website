"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  createCouponAction,
  deleteCouponAction,
  updateCouponAction,
} from "@/lib/actions/admin-discounts";
import {
  adminCouponFormSchema,
  toDatetimeLocalValue,
  type AdminCouponFormInput,
  type AdminCouponFormValues,
} from "@/lib/validations/admin-discount";
import { formatPrice } from "@/lib/utils/format-price";
import type { Coupon } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DiscountsManagerProps {
  coupons: Coupon[];
}

function emptyForm(): AdminCouponFormInput {
  return {
    code: "",
    discount_type: "percentage",
    discount_value: 10,
    starts_at: "",
    ends_at: "",
    usage_limit: "",
    per_customer_limit: "",
    min_order_amount: "",
    is_active: true,
  };
}

function formatRange(coupon: Coupon): string {
  if (!coupon.starts_at && !coupon.ends_at) {
    return "No date limit";
  }
  const start = coupon.starts_at
    ? new Date(coupon.starts_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "…";
  const end = coupon.ends_at
    ? new Date(coupon.ends_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "…";
  return `${start} → ${end}`;
}

function formatValue(coupon: Coupon): string {
  if (coupon.discount_type === "percentage") {
    return `${Number(coupon.discount_value)}%`;
  }
  return formatPrice(Number(coupon.discount_value));
}

export function DiscountsManager({ coupons }: DiscountsManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AdminCouponFormInput, unknown, AdminCouponFormValues>({
    resolver: zodResolver(adminCouponFormSchema),
    defaultValues: emptyForm(),
  });

  function startCreate() {
    setEditingId(null);
    setErrorMessage(null);
    form.reset(emptyForm());
  }

  function startEdit(coupon: Coupon) {
    setEditingId(coupon.id);
    setErrorMessage(null);
    form.reset({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: Number(coupon.discount_value),
      starts_at: toDatetimeLocalValue(coupon.starts_at),
      ends_at: toDatetimeLocalValue(coupon.ends_at),
      usage_limit: coupon.usage_limit ?? "",
      per_customer_limit: coupon.per_customer_limit ?? "",
      min_order_amount:
        coupon.min_order_amount != null
          ? Number(coupon.min_order_amount)
          : "",
      is_active: coupon.is_active,
    });
  }

  function onSubmit(values: AdminCouponFormValues) {
    setErrorMessage(null);
    startTransition(async () => {
      const result = editingId
        ? await updateCouponAction({ couponId: editingId, form: values })
        : await createCouponAction({ form: values });

      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }

      startCreate();
      router.refresh();
    });
  }

  function handleDelete(coupon: Coupon) {
    const confirmed = window.confirm(
      `Delete coupon “${coupon.code}”? This cannot be undone.`
    );
    if (!confirmed) return;

    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteCouponAction(coupon.id);
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }
      if (editingId === coupon.id) {
        startCreate();
      }
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        {errorMessage ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
            {errorMessage}
          </p>
        ) : null}

        {coupons.length === 0 ? (
          <EmptyState
            tone="dark"
            title="No coupons yet"
            description="Create a percentage or fixed-amount coupon with the form on the right."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Value</th>
                  <th className="px-4 py-3 font-semibold">Dates</th>
                  <th className="px-4 py-3 font-semibold">Usage</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                      {coupon.code}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatValue(coupon)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatRange(coupon)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {coupon.usage_count}
                      {coupon.usage_limit != null
                        ? ` / ${coupon.usage_limit}`
                        : " / ∞"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          coupon.is_active
                            ? "border-emerald-700 bg-emerald-950 text-emerald-300"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {coupon.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => startEdit(coupon)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleDelete(coupon)}
                          className="border-destructive/40 text-red-300 hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <aside className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            {editingId ? "Edit coupon" : "New coupon"}
          </h2>
          {editingId ? (
            <Button type="button" size="sm" variant="ghost" onClick={startCreate}>
              <Plus className="h-3.5 w-3.5" />
              New
            </Button>
          ) : null}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" {...form.register("code")} placeholder="TEE10" />
            {form.formState.errors.code ? (
              <p className="text-xs text-red-300">
                {form.formState.errors.code.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="discount_type">Type</Label>
              <select
                id="discount_type"
                {...form.register("discount_type")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none ring-ring focus-visible:ring-2"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount_value">Value</Label>
              <Input
                id="discount_value"
                type="number"
                step="0.01"
                min="0"
                {...form.register("discount_value", { valueAsNumber: true })}
              />
              {form.formState.errors.discount_value ? (
                <p className="text-xs text-red-300">
                  {form.formState.errors.discount_value.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="starts_at">Starts</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                {...form.register("starts_at")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ends_at">Ends</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                {...form.register("ends_at")}
              />
              {form.formState.errors.ends_at ? (
                <p className="text-xs text-red-300">
                  {form.formState.errors.ends_at.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="usage_limit">Usage limit</Label>
              <Input
                id="usage_limit"
                type="number"
                min="1"
                step="1"
                placeholder="Unlimited"
                {...form.register("usage_limit")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="per_customer_limit">Per customer</Label>
              <Input
                id="per_customer_limit"
                type="number"
                min="1"
                step="1"
                placeholder="Unlimited"
                {...form.register("per_customer_limit")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="min_order_amount">Min order (INR)</Label>
            <Input
              id="min_order_amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="None"
              {...form.register("min_order_amount")}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              {...form.register("is_active")}
              className="h-4 w-4 rounded border-input"
            />
            Active
          </label>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? "Saving..."
              : editingId
                ? "Save coupon"
                : "Create coupon"}
          </Button>
        </form>
      </aside>
    </div>
  );
}
