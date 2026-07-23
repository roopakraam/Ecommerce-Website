"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitContactMessageAction } from "@/lib/actions/contact";

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await submitContactMessageAction({ name, email, message });
      if (result.success) {
        setSuccess(true);
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setError(result.error);
      }
    });
  }

  if (success) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-bone/10 bg-surface p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-neon" />
        <h3 className="mt-4 font-display text-xl uppercase tracking-tight text-bone">
          Message sent
        </h3>
        <p className="mt-2 max-w-sm text-sm text-dust">
          Thanks for reaching out — our team will get back to you soon.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-6 text-sm font-medium text-dust underline underline-offset-4 hover:text-bone"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-bone/10 bg-surface p-6 sm:p-8">
      <div className="flex flex-col gap-2">
        <label htmlFor="contact-name" className="font-mono text-xs uppercase tracking-wide text-dust">
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-xl border border-bone/15 bg-surface2 px-4 py-2.5 text-sm text-bone outline-none ring-neon focus:border-neon focus:ring-2"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contact-email" className="font-mono text-xs uppercase tracking-wide text-dust">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-xl border border-bone/15 bg-surface2 px-4 py-2.5 text-sm text-bone outline-none ring-neon focus:border-neon focus:ring-2"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="contact-message" className="font-mono text-xs uppercase tracking-wide text-dust">
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="resize-none rounded-xl border border-bone/15 bg-surface2 px-4 py-2.5 text-sm text-bone outline-none ring-neon focus:border-neon focus:ring-2"
        />
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-neon px-6 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-bone disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
