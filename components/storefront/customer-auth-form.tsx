"use client";

import { FormEvent, useEffect, useState } from "react";
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
  /** Visual wrapper: "page" (bordered card, used by /login and /signup) or "modal" (no card chrome, used inside AuthModal). */
  variant?: "page" | "modal";
  /** When provided (modal usage), called instead of navigating to nextPath on success. */
  onSuccess?: () => void;
  /** When provided (modal usage), switches the mode in place instead of linking to /login or /signup. */
  onSwitchMode?: (mode: "login" | "signup") => void;
}

const inputClass =
  "w-full rounded-xl border border-bone/15 bg-surface px-3.5 py-2.5 text-sm text-bone placeholder:text-dust outline-none ring-neon transition focus:border-neon focus:ring-2";
const labelClass =
  "mb-1.5 block font-mono text-xs font-semibold uppercase tracking-wide text-dust";

export function CustomerAuthForm({
  mode,
  nextPath,
  variant = "page",
  onSuccess,
  onSwitchMode,
}: CustomerAuthFormProps) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Switching modes in the shared modal reuses this same component instance —
  // clear stale messages from the previous mode's attempt.
  useEffect(() => {
    setErrorMessage(null);
    setInfoMessage(null);
  }, [mode]);

  async function ensureCustomerRow(params: {
    authUserId: string;
    fullName?: string | null;
    phone?: string | null;
    accessToken?: string | null;
  }) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (params.accessToken) {
      headers.Authorization = `Bearer ${params.accessToken}`;
    }

    const response = await fetch("/api/customers/ensure", {
      method: "POST",
      headers,
      body: JSON.stringify({
        authUserId: params.authUserId,
        fullName: params.fullName,
        phone: params.phone,
      }),
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
          accessToken: data.session?.access_token ?? null,
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

      if (onSuccess) {
        router.refresh();
        onSuccess();
      } else {
        router.replace(nextPath);
        router.refresh();
      }
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
        accessToken: data.session?.access_token ?? null,
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

    if (onSuccess) {
      router.refresh();
      onSuccess();
    } else {
      router.replace(nextPath);
      router.refresh();
    }
  }

  const isLogin = mode === "login";
  const isModal = variant === "modal";

  return (
    <div className={isModal ? "" : "rounded-2xl border border-bone/10 bg-surface p-6 sm:p-8"}>
      {isModal ? (
        <h2 className="text-2xl font-black uppercase tracking-tight text-bone">
          {isLogin ? "Sign in" : "Create account"}
        </h2>
      ) : (
        <h1 className="text-2xl font-black uppercase tracking-tight text-bone">
          {isLogin ? "Sign in" : "Create account"}
        </h1>
      )}
      <p className="mt-2 text-sm text-dust">
        {isLogin
          ? "Sign in to checkout and save your cart across devices."
          : "Create an account to checkout and track your orders."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {!isLogin && (
          <>
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={inputClass}
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={inputClass}
                placeholder="10-digit mobile number"
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
            placeholder="At least 6 characters"
          />
        </div>

        {!isLogin && (
          <div>
            <label htmlFor="confirmPassword" className={labelClass}>
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={inputClass}
              placeholder="Re-enter password"
            />
          </div>
        )}

        {errorMessage && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {errorMessage}
          </p>
        )}

        {infoMessage && (
          <p className="rounded-xl border border-neon/30 bg-neon/10 px-3 py-2 text-sm text-bone">
            {infoMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-neon px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone disabled:cursor-not-allowed disabled:opacity-60"
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

      <p className="mt-5 text-center text-sm text-dust">
        {isLogin ? (
          <>
            New here?{" "}
            {onSwitchMode ? (
              <button
                type="button"
                onClick={() => onSwitchMode("signup")}
                className="font-semibold text-bone underline-offset-4 hover:text-neon hover:underline"
              >
                Create an account
              </button>
            ) : (
              <Link
                href={`/signup?next=${encodeURIComponent(nextPath)}`}
                className="font-semibold text-bone underline-offset-4 hover:text-neon hover:underline"
              >
                Create an account
              </Link>
            )}
          </>
        ) : (
          <>
            Already have an account?{" "}
            {onSwitchMode ? (
              <button
                type="button"
                onClick={() => onSwitchMode("login")}
                className="font-semibold text-bone underline-offset-4 hover:text-neon hover:underline"
              >
                Sign in
              </button>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="font-semibold text-bone underline-offset-4 hover:text-neon hover:underline"
              >
                Sign in
              </Link>
            )}
          </>
        )}
      </p>
    </div>
  );
}
