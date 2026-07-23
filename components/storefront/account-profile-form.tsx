"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Mail } from "lucide-react";
import { updateAccountProfileAction } from "@/lib/actions/account";

const inputClass =
  "w-full rounded-xl border border-bone/15 bg-surface2 px-4 py-2.5 text-sm text-bone placeholder:text-dust outline-none ring-neon transition focus:border-neon focus:ring-2";
const labelClass =
  "font-mono text-xs uppercase tracking-wide text-dust";

interface AccountProfileFormProps {
  fullName: string | null;
  email: string | null;
  phone: string | null;
}

export function AccountProfileForm({
  fullName,
  email,
  phone,
}: AccountProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(fullName ?? "");
  const [phoneValue, setPhoneValue] = useState(phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateAccountProfileAction({
        fullName: name,
        phone: phoneValue,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-bone/10 bg-surface p-5 sm:p-6"
    >
      <h2 className="font-display text-xl uppercase tracking-tight text-bone">
        Profile
      </h2>
      <p className="mt-1 text-sm text-dust">
        Update the name and phone we use for orders and delivery.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="account-full-name" className={labelClass}>
            Full name
          </label>
          <input
            id="account-full-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setSaved(false);
            }}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="account-phone" className={labelClass}>
            Phone
          </label>
          <input
            id="account-phone"
            type="tel"
            autoComplete="tel"
            value={phoneValue}
            onChange={(event) => {
              setPhoneValue(event.target.value);
              setSaved(false);
            }}
            placeholder="10-digit mobile number"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className={labelClass}>Email</span>
          <div className="flex items-center gap-3 rounded-xl border border-bone/10 bg-surface2 px-4 py-2.5">
            <Mail className="h-4 w-4 shrink-0 text-dust" />
            <p className="truncate text-sm text-bone">{email ?? "—"}</p>
          </div>
          <p className="text-xs text-dust">
            Email comes from your sign-in and can&apos;t be edited here.
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-neon" role="status">
          <CheckCircle2 className="h-4 w-4" />
          Profile saved
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-neon px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone disabled:opacity-60"
      >
        {isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
