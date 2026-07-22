"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  customerLoginSchema,
  customerSignupSchema,
} from "@/lib/validations/customer-auth";

interface CustomerAuthFormProps {
  mode: "login" | "signup";
  nextPath: string;
}

export function CustomerAuthForm({ mode, nextPath }: CustomerAuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  async function ensureCustomerRow(params: {
    authUserId: string;
    fullName?: string | null;
    phone?: string | null;
  }) {
    const response = await fetch("/api/customers/ensure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      throw new Error(result.error ?? "Failed to create customer profile.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const supabase = createBrowserClient();

    if (mode === "login") {
      const parsed = customerLoginSchema.safeParse({ email, password });
      if (!parsed.success) {
        setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid details.");
        setIsSubmitting(false);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (error || !data.user) {
        setErrorMessage(error?.message || "Unable to sign in. Try again.");
        setIsSubmitting(false);
        return;
      }

      try {
        await ensureCustomerRow({
          authUserId: data.user.id,
          fullName:
            (data.user.user_metadata?.full_name as string | undefined) ?? null,
          phone: (data.user.user_metadata?.phone as string | undefined) ?? null,
        });
      } catch (ensureError) {
        setErrorMessage(
          ensureError instanceof Error
            ? ensureError.message
            : "Signed in, but profile setup failed."
        );
        setIsSubmitting(false);
        return;
      }

      router.replace(nextPath);
      router.refresh();
      return;
    }

    const parsed = customerSignupSchema.safeParse({
      fullName,
      email,
      phone,
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid details.");
      setIsSubmitting(false);
      return;
    }

    const phoneValue = parsed.data.phone?.trim() || null;

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
          phone: phoneValue,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (!data.session || !data.user) {
      setInfoMessage(
        "Account created. Check your email to confirm, then sign in."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      await ensureCustomerRow({
        authUserId: data.user.id,
        fullName: parsed.data.fullName,
        phone: phoneValue,
      });
    } catch (ensureError) {
      setErrorMessage(
        ensureError instanceof Error
          ? ensureError.message
          : "Account created, but profile setup failed."
      );
      setIsSubmitting(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  const isLogin = mode === "login";

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
        {isLogin ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        {isLogin
          ? "Sign in to add items to your cart and checkout."
          : "Create an account to shop and track your orders."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {!isLogin && (
          <>
            <div>
              <label
                htmlFor="fullName"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600"
              >
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-950 outline-none ring-lime-400 transition focus:border-lime-400 focus:ring-2"
                placeholder="Your name"
              />
            </div>
            <div>
              <label
                htmlFor="phone"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600"
              >
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-950 outline-none ring-lime-400 transition focus:border-lime-400 focus:ring-2"
                placeholder="10-digit mobile number"
              />
            </div>
          </>
        )}

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-950 outline-none ring-lime-400 transition focus:border-lime-400 focus:ring-2"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-950 outline-none ring-lime-400 transition focus:border-lime-400 focus:ring-2"
            placeholder="At least 6 characters"
          />
        </div>

        {!isLogin && (
          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-600"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-950 outline-none ring-lime-400 transition focus:border-lime-400 focus:ring-2"
              placeholder="Re-enter password"
            />
          </div>
        )}

        {errorMessage && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        {infoMessage && (
          <p className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-sm text-neutral-800">
            {infoMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-lime-400 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting
            ? isLogin
              ? "Signing in..."
              : "Creating account..."
            : isLogin
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-neutral-600">
        {isLogin ? (
          <>
            New here?{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(nextPath)}`}
              className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={`/login?next=${encodeURIComponent(nextPath)}`}
              className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
