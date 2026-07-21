"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCartStore } from "@/lib/store/cart";
import {
  customerCheckoutFormSchema,
  guestCheckoutFormSchema,
} from "@/lib/validations/checkout";
import { formatPrice } from "@/lib/utils/format-price";
import type { Address } from "@/types";

interface CheckoutFormProps {
  isLoggedIn: boolean;
  savedAddresses: Address[];
  defaultEmail?: string | null;
  defaultPhone?: string | null;
  defaultFullName?: string | null;
}

interface CheckoutSubmitValues {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  saveAddress?: boolean;
  address: {
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
  };
}

export function CheckoutForm({
  isLoggedIn,
  savedAddresses,
  defaultEmail,
  defaultPhone,
  defaultFullName,
}: CheckoutFormProps) {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const [error, setError] = useState<string | null>(null);

  const resolver = useMemo(
    () =>
      zodResolver(
        isLoggedIn ? customerCheckoutFormSchema : guestCheckoutFormSchema
      ),
    [isLoggedIn]
  );

  const defaultAddress = savedAddresses.find((a) => a.is_default) ?? savedAddresses[0];

  const form = useForm({
    resolver,
    defaultValues: {
      fullName: defaultFullName ?? "",
      email: defaultEmail ?? "",
      phone: defaultPhone ?? "",
      saveAddress: isLoggedIn,
      address: {
        line1: defaultAddress?.line1 ?? "",
        line2: defaultAddress?.line2 ?? "",
        city: defaultAddress?.city ?? "",
        state: defaultAddress?.state ?? "",
        pincode: defaultAddress?.pincode ?? "",
      },
    },
  });

  const shippingFee = 0;
  const total = subtotal + shippingFee;

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

  async function onSubmit(rawValues: unknown) {
    const values = rawValues as CheckoutSubmitValues;
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setError(null);

    const payload = {
      isGuest: !isLoggedIn,
      fullName: values.fullName ?? null,
      email: values.email ?? null,
      phone: values.phone ?? null,
      address: {
        line1: values.address.line1,
        line2: values.address.line2 || null,
        city: values.address.city,
        state: values.address.state,
        pincode: values.address.pincode,
      },
      saveAddress: values.saveAddress ?? false,
      items: items.map((item) => ({
        productId: item.productId,
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

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-600">
        Your cart is empty. Add a few tees before checkout.
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        {!isLoggedIn && (
          <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-neutral-950">Contact details</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Continue as guest. We need your email and phone for order updates.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-neutral-700">Email</label>
                <input
                  type="email"
                  {...form.register("email")}
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none ring-lime-400 focus:border-lime-400 focus:ring-2"
                />
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.email?.message}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Phone</label>
                <input
                  type="tel"
                  {...form.register("phone")}
                  className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none ring-lime-400 focus:border-lime-400 focus:ring-2"
                />
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.phone?.message}</p>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-950">Shipping address</h2>
          {isLoggedIn && savedAddresses.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium text-neutral-700">Use saved address</label>
              <select
                className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none ring-lime-400 focus:border-lime-400 focus:ring-2"
                defaultValue=""
                onChange={(event) => applySavedAddress(event.target.value)}
              >
                <option value="">Select saved address</option>
                {savedAddresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.line1}, {address.city}, {address.state} {address.pincode}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-neutral-700">Full name</label>
              <input
                {...form.register("fullName")}
                className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none ring-lime-400 focus:border-lime-400 focus:ring-2"
              />
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.fullName?.message}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-neutral-700">Address line 1</label>
              <input
                {...form.register("address.line1")}
                className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none ring-lime-400 focus:border-lime-400 focus:ring-2"
              />
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.address?.line1?.message}
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-neutral-700">Address line 2 (optional)</label>
              <input
                {...form.register("address.line2")}
                className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none ring-lime-400 focus:border-lime-400 focus:ring-2"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">City</label>
              <input
                {...form.register("address.city")}
                className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none ring-lime-400 focus:border-lime-400 focus:ring-2"
              />
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.address?.city?.message}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">State</label>
              <input
                {...form.register("address.state")}
                className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none ring-lime-400 focus:border-lime-400 focus:ring-2"
              />
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.address?.state?.message}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-700">Pincode</label>
              <input
                {...form.register("address.pincode")}
                className="mt-1.5 w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none ring-lime-400 focus:border-lime-400 focus:ring-2"
              />
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.address?.pincode?.message}
              </p>
            </div>
          </div>

          {isLoggedIn && (
            <label className="mt-4 flex items-center gap-2 text-sm text-neutral-700">
              <input type="checkbox" {...form.register("saveAddress")} className="rounded" />
              Save this address for next time
            </label>
          )}
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-950">Order summary</h2>
        <ul className="space-y-2 text-sm text-neutral-700">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center justify-between gap-4">
              <span className="line-clamp-1">
                {item.name} x {item.quantity}
              </span>
              <span className="font-medium text-neutral-950">
                {formatPrice(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <hr className="my-4 border-neutral-200" />
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Subtotal</span>
            <span className="font-medium text-neutral-950">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">Shipping</span>
            <span className="text-neutral-950">{formatPrice(shippingFee)}</span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-neutral-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-lime-400 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {form.formState.isSubmitting ? "Creating order..." : "Continue to payment"}
        </button>
      </aside>
    </form>
  );
}
