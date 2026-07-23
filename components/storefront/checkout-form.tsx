"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  computeOrderTotals,
  type ShippingZoneLike,
} from "@/lib/checkout/order-totals";
import { useCartHasHydrated, useCartStore } from "@/lib/store/cart";
import { customerCheckoutFormSchema } from "@/lib/validations/checkout";
import { formatPrice } from "@/lib/utils/format-price";
import type { Address } from "@/types";

export interface CheckoutCommerceProps {
  taxRate: number;
  zones: ShippingZoneLike[];
}

interface CheckoutFormProps {
  isLoggedIn: boolean;
  savedAddresses: Address[];
  defaultEmail?: string | null;
  defaultPhone?: string | null;
  defaultFullName?: string | null;
  commerce: CheckoutCommerceProps;
}

interface CheckoutSubmitValues {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  saveAddress?: boolean;
  couponCode?: string | null;
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
}

interface AppliedCouponPreview {
  code: string;
  discountAmount: number;
  description: string;
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-bone/15 bg-surface px-3.5 py-2.5 text-sm text-bone placeholder:text-dust outline-none ring-neon focus:border-neon focus:ring-2";
const labelClass = "text-sm font-medium text-bone/75";

export function CheckoutForm({
  savedAddresses,
  defaultEmail,
  defaultPhone,
  defaultFullName,
  commerce,
}: CheckoutFormProps) {
  const router = useRouter();
  const hasHydrated = useCartHasHydrated();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const [error, setError] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [appliedCoupon, setAppliedCoupon] =
    useState<AppliedCouponPreview | null>(null);
  const cartItems = hasHydrated ? items : [];

  const resolver = useMemo(() => zodResolver(customerCheckoutFormSchema), []);

  const defaultAddress =
    savedAddresses.find((a) => a.is_default) ?? savedAddresses[0];

  const form = useForm({
    resolver,
    defaultValues: {
      fullName: defaultFullName ?? "",
      email: defaultEmail ?? "",
      phone: defaultPhone ?? "",
      saveAddress: true,
      couponCode: "",
      address: {
        line1: defaultAddress?.line1 ?? "",
        line2: defaultAddress?.line2 ?? "",
        city: defaultAddress?.city ?? "",
        state: defaultAddress?.state ?? "",
        pincode: defaultAddress?.pincode ?? "",
      },
    },
  });

  const watchedState = form.watch("address.state");
  const watchedCouponCode = form.watch("couponCode");
  const totals = useMemo(
    () =>
      computeOrderTotals({
        subtotal,
        taxRatePercent: commerce.taxRate,
        zones: commerce.zones,
        state: watchedState,
        discountAmount: appliedCoupon?.discountAmount ?? 0,
      }),
    [
      subtotal,
      commerce.taxRate,
      commerce.zones,
      watchedState,
      appliedCoupon?.discountAmount,
    ]
  );

  const { shippingFee, taxAmount, total, discountAmount, zone } = totals;
  const freeShippingApplied =
    zone != null &&
    zone.free_above != null &&
    subtotal >= zone.free_above &&
    shippingFee === 0;

  function applySavedAddress(addressId: string) {
    const selected = savedAddresses.find((address) => address.id === addressId);
    if (!selected) {
      return;
    }

    form.setValue("address.line1", selected.line1);
    form.setValue("address.line2", selected.line2 ?? "");
    form.setValue("address.city", selected.city);
    form.setValue("address.state", selected.state);
    form.setValue("address.pincode", selected.pincode);
  }

  async function applyCoupon() {
    const code = (watchedCouponCode ?? "").trim();
    if (!code) {
      setCouponError("Enter a coupon code.");
      setAppliedCoupon(null);
      return;
    }

    setCouponBusy(true);
    setCouponError(null);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });

      const result = (await response.json()) as
        | { error: string }
        | {
            code: string;
            discountAmount: number;
            description: string;
          };

      if (!response.ok || !("discountAmount" in result)) {
        setAppliedCoupon(null);
        setCouponError(
          ("error" in result && result.error) || "Invalid coupon code."
        );
        return;
      }

      setAppliedCoupon({
        code: result.code,
        discountAmount: result.discountAmount,
        description: result.description,
      });
      form.setValue("couponCode", result.code);
    } catch {
      setAppliedCoupon(null);
      setCouponError("Failed to validate coupon.");
    } finally {
      setCouponBusy(false);
    }
  }

  function clearCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
    form.setValue("couponCode", "");
  }

  async function onSubmit(rawValues: unknown) {
    const values = rawValues as CheckoutSubmitValues;
    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setError(null);

    const couponCode =
      appliedCoupon?.code ??
      (values.couponCode?.trim() ? values.couponCode.trim().toUpperCase() : null);

    const payload = {
      fullName: values.fullName ?? null,
      email: defaultEmail ?? values.email ?? null,
      phone: values.phone ?? null,
      address: {
        line1: values.address.line1,
        line2: values.address.line2 || null,
        city: values.address.city,
        state: values.address.state,
        pincode: values.address.pincode,
      },
      saveAddress: values.saveAddress ?? false,
      couponCode,
      items: cartItems.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    };

    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as
      | { error: string }
      | { orderId: string; redirectTo: string };

    if (!response.ok || !("redirectTo" in result)) {
      setError(("error" in result && result.error) || "Failed to create order");
      return;
    }

    router.push(result.redirectTo);
  }

  if (!hasHydrated || cartItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-bone/20 bg-surface p-8 text-center text-sm text-dust">
        Your cart is empty. Add a few tees before checkout.
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-8 lg:grid-cols-[1fr_360px]"
    >
      <div className="space-y-8">
        <section className="rounded-2xl border border-bone/10 bg-surface p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-bone">
            Shipping address
          </h2>
          {defaultEmail && (
            <p className="mt-2 text-sm text-dust">
              Signed in as{" "}
              <span className="font-medium text-bone">{defaultEmail}</span>
            </p>
          )}

          {savedAddresses.length > 0 && (
            <div className="mt-4">
              <label className={labelClass}>Use saved address</label>
              <select
                className={inputClass}
                defaultValue=""
                onChange={(event) => applySavedAddress(event.target.value)}
              >
                <option value="">Select saved address</option>
                {savedAddresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.line1}, {address.city}, {address.state}{" "}
                    {address.pincode}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Full name</label>
              <input {...form.register("fullName")} className={inputClass} />
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.fullName?.message}
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Phone</label>
              <input
                type="tel"
                {...form.register("phone")}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.phone?.message}
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address line 1</label>
              <input
                {...form.register("address.line1")}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.address?.line1?.message}
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address line 2 (optional)</label>
              <input
                {...form.register("address.line2")}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input
                {...form.register("address.city")}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.address?.city?.message}
              </p>
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input
                {...form.register("address.state")}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.address?.state?.message}
              </p>
            </div>
            <div>
              <label className={labelClass}>Pincode</label>
              <input
                {...form.register("address.pincode")}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-red-400">
                {form.formState.errors.address?.pincode?.message}
              </p>
            </div>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm text-bone/75">
            <input
              type="checkbox"
              {...form.register("saveAddress")}
              className="rounded accent-neon"
            />
            Save this address for next time
          </label>
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-bone/10 bg-surface p-6">
        <h2 className="mb-4 text-lg font-semibold text-bone">
          Order summary
        </h2>
        <ul className="space-y-2 text-sm text-bone/75">
          {cartItems.map((item) => (
            <li
              key={item.variantId}
              className="flex items-center justify-between gap-4"
            >
              <span className="line-clamp-2">
                {item.name} ({item.size}/{item.color}) × {item.quantity}
              </span>
              <span className="font-medium text-bone">
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <hr className="my-4 border-bone/10" />

        <div className="mb-4">
          <label className={labelClass} htmlFor="couponCode">
            Promo code
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              id="couponCode"
              {...form.register("couponCode", {
                onChange: () => {
                  if (appliedCoupon) {
                    setAppliedCoupon(null);
                  }
                  if (couponError) {
                    setCouponError(null);
                  }
                },
              })}
              className={inputClass + " mt-0"}
              placeholder="CODE"
              autoComplete="off"
              disabled={couponBusy || form.formState.isSubmitting}
            />
            {appliedCoupon ? (
              <button
                type="button"
                onClick={clearCoupon}
                className="shrink-0 rounded-xl border border-bone/20 px-3 py-2.5 text-sm font-medium text-bone/80 transition hover:border-bone/40 hover:text-bone"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponBusy || form.formState.isSubmitting}
                className="shrink-0 rounded-xl border border-neon/40 bg-neon/10 px-3 py-2.5 text-sm font-semibold text-neon transition hover:bg-neon/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {couponBusy ? "…" : "Apply"}
              </button>
            )}
          </div>
          {appliedCoupon ? (
            <p className="mt-1.5 text-xs text-emerald-300">
              {appliedCoupon.code} applied · {appliedCoupon.description}
            </p>
          ) : null}
          {couponError ? (
            <p className="mt-1.5 text-xs text-red-400">{couponError}</p>
          ) : null}
          {form.formState.errors.couponCode?.message ? (
            <p className="mt-1.5 text-xs text-red-400">
              {form.formState.errors.couponCode.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-bone/75">Subtotal</span>
            <span className="font-medium text-bone">
              {formatPrice(subtotal)}
            </span>
          </div>
          {discountAmount > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-bone/75">
                Discount
                {appliedCoupon ? (
                  <span className="mt-0.5 block text-xs font-normal text-dust">
                    {appliedCoupon.code}
                  </span>
                ) : null}
              </span>
              <span className="font-medium text-emerald-300">
                −{formatPrice(discountAmount)}
              </span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-bone/75">
              Shipping
              {zone ? (
                <span className="mt-0.5 block text-xs font-normal text-dust">
                  {zone.name}
                  {freeShippingApplied ? " · free shipping" : ""}
                </span>
              ) : null}
            </span>
            <span className="text-bone">{formatPrice(shippingFee)}</span>
          </div>
          {commerce.taxRate > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-bone/75">
                Tax ({commerce.taxRate}%)
              </span>
              <span className="text-bone">{formatPrice(taxAmount)}</span>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex items-center justify-between text-base font-semibold text-bone">
          <span>Total</span>
          <span className="font-mono text-neon">{formatPrice(total)}</span>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-neon px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone disabled:cursor-not-allowed disabled:opacity-60"
        >
          {form.formState.isSubmitting
            ? "Creating order..."
            : "Continue to payment"}
        </button>
      </aside>
    </form>
  );
}
