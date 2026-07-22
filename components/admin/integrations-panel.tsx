"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Copy, PlugZap, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  disconnectIntegrationAction,
  saveIntegrationAction,
  testIntegrationAction,
} from "@/lib/actions/admin-integrations";
import type { AdminIntegrationsBundle } from "@/lib/db/admin-integrations";
import {
  razorpayIntegrationSchema,
  resendIntegrationSchema,
  twilioIntegrationSchema,
  type RazorpayIntegrationInput,
  type RazorpayIntegrationValues,
  type ResendIntegrationInput,
  type ResendIntegrationValues,
  type TwilioIntegrationInput,
  type TwilioIntegrationValues,
} from "@/lib/validations/admin-integrations";
import type {
  IntegrationConnectionStatus,
  IntegrationProviderCard,
} from "@/types/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface IntegrationsPanelProps {
  data: AdminIntegrationsBundle;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-destructive">{message}</p>;
}

function FormMessage({
  error,
  success,
}: {
  error: string | null;
  success: string | null;
}) {
  if (error) {
    return (
      <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
        {error}
      </p>
    );
  }
  if (success) {
    return (
      <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-foreground">
        {success}
      </p>
    );
  }
  return null;
}

function StatusBadge({ status }: { status: IntegrationConnectionStatus }) {
  const styles: Record<IntegrationConnectionStatus, string> = {
    configured:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    not_configured: "border-border bg-muted/40 text-muted-foreground",
    error: "border-destructive/40 bg-destructive/10 text-destructive-foreground",
  };
  const labels: Record<IntegrationConnectionStatus, string> = {
    configured: "Configured",
    not_configured: "Not configured",
    error: "Error",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status === "configured" ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : status === "error" ? (
        <XCircle className="h-3 w-3" />
      ) : (
        <PlugZap className="h-3 w-3" />
      )}
      {labels[status]}
    </span>
  );
}

function SourceHint({ card }: { card: IntegrationProviderCard }) {
  if (card.source === "database") {
    return <span className="text-xs text-muted-foreground">Using saved credentials</span>;
  }
  if (card.source === "env") {
    return (
      <span className="text-xs text-muted-foreground">
        Using environment variables (fallback)
      </span>
    );
  }
  return (
    <span className="text-xs text-muted-foreground">No credentials yet</span>
  );
}

function MaskHint({
  label,
  mask,
}: {
  label: string;
  mask?: string;
}) {
  if (!mask) return null;
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      Saved {label}: <span className="font-mono">{mask}</span> — leave blank to keep
    </p>
  );
}

function CopyWebhookUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <Label className="text-xs text-muted-foreground">Webhook URL</Label>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="block flex-1 break-all rounded-md bg-background px-2 py-1.5 font-mono text-xs text-foreground">
          {url}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={onCopy}>
          <Copy className="mr-1.5 h-3.5 w-3.5" />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Razorpay Dashboard → Settings → Webhooks → paste this URL → subscribe to{" "}
        <span className="font-mono">payment.captured</span>.
      </p>
    </div>
  );
}

function RazorpayCard({
  card,
  encryptionReady,
}: {
  card: IntegrationProviderCard;
  encryptionReady: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<RazorpayIntegrationInput, unknown, RazorpayIntegrationValues>({
    resolver: zodResolver(razorpayIntegrationSchema),
    defaultValues: {
      provider: "razorpay",
      is_enabled: card.isEnabled,
      key_id: "",
      key_secret: "",
      webhook_secret: "",
    },
  });

  function onSave(values: RazorpayIntegrationValues) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await saveIntegrationAction({ form: values });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(result.message ?? "Saved.");
      form.reset({
        provider: "razorpay",
        is_enabled: values.is_enabled,
        key_id: "",
        key_secret: "",
        webhook_secret: "",
      });
      router.refresh();
    });
  }

  function onTest() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await testIntegrationAction({ provider: "razorpay" });
      if (!result.success) {
        setError(result.error);
        router.refresh();
        return;
      }
      setSuccess(result.message ?? "Test passed.");
      router.refresh();
    });
  }

  function onDisconnect() {
    if (!window.confirm("Disconnect Razorpay saved credentials?")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await disconnectIntegrationAction({ provider: "razorpay" });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(result.message ?? "Disconnected.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{card.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={card.status} />
          <SourceHint card={card} />
        </div>
      </div>

      {card.webhookUrl ? (
        <div className="mt-4">
          <CopyWebhookUrl url={card.webhookUrl} />
        </div>
      ) : null}

      <form
        className="mt-4 space-y-4"
        onSubmit={form.handleSubmit(onSave)}
      >
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={form.watch("is_enabled")}
            onChange={(e) =>
              form.setValue("is_enabled", e.target.checked, { shouldDirty: true })
            }
          />
          Enabled
        </label>

        <div>
          <Label htmlFor="rzp_key_id">Key ID</Label>
          <Input
            id="rzp_key_id"
            autoComplete="off"
            placeholder={card.secretsMask.key_id ? "••••••••" : "rzp_live_…"}
            {...form.register("key_id")}
          />
          <MaskHint label="Key ID" mask={card.secretsMask.key_id} />
          <FieldError message={form.formState.errors.key_id?.message} />
        </div>

        <div>
          <Label htmlFor="rzp_key_secret">Key Secret</Label>
          <Input
            id="rzp_key_secret"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...form.register("key_secret")}
          />
          <MaskHint label="Key Secret" mask={card.secretsMask.key_secret} />
          <FieldError message={form.formState.errors.key_secret?.message} />
        </div>

        <div>
          <Label htmlFor="rzp_webhook_secret">Webhook Secret</Label>
          <Input
            id="rzp_webhook_secret"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...form.register("webhook_secret")}
          />
          <MaskHint
            label="Webhook Secret"
            mask={card.secretsMask.webhook_secret}
          />
          <FieldError message={form.formState.errors.webhook_secret?.message} />
        </div>

        <FormMessage error={error} success={success} />

        {card.lastTestedAt ? (
          <p className="text-xs text-muted-foreground">
            Last tested{" "}
            {new Date(card.lastTestedAt).toLocaleString()}
            {card.lastTestMessage ? ` — ${card.lastTestMessage}` : ""}
          </p>
        ) : null}

        {!encryptionReady ? (
          <p className="text-xs text-amber-300">
            Set <span className="font-mono">INTEGRATIONS_ENCRYPTION_KEY</span> to
            save secrets in the database. Env fallback still works.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending || !encryptionReady}>
            {isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onTest}
          >
            Test connection
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending || card.source !== "database"}
            onClick={onDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </form>
    </section>
  );
}

function ResendCard({
  card,
  encryptionReady,
  adminEmail,
}: {
  card: IntegrationProviderCard;
  encryptionReady: boolean;
  adminEmail: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ResendIntegrationInput, unknown, ResendIntegrationValues>({
    resolver: zodResolver(resendIntegrationSchema),
    defaultValues: {
      provider: "resend",
      is_enabled: card.isEnabled,
      api_key: "",
      from_email: card.config.from_email || "",
    },
  });

  function onSave(values: ResendIntegrationValues) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await saveIntegrationAction({ form: values });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(result.message ?? "Saved.");
      form.reset({
        provider: "resend",
        is_enabled: values.is_enabled,
        api_key: "",
        from_email: values.from_email,
      });
      router.refresh();
    });
  }

  function onTest() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await testIntegrationAction({ provider: "resend" });
      if (!result.success) {
        setError(result.error);
        router.refresh();
        return;
      }
      setSuccess(result.message ?? "Test passed.");
      router.refresh();
    });
  }

  function onDisconnect() {
    if (!window.confirm("Disconnect Resend saved credentials?")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await disconnectIntegrationAction({ provider: "resend" });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(result.message ?? "Disconnected.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{card.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={card.status} />
          <SourceHint card={card} />
        </div>
      </div>

      <form className="mt-4 space-y-4" onSubmit={form.handleSubmit(onSave)}>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={form.watch("is_enabled")}
            onChange={(e) =>
              form.setValue("is_enabled", e.target.checked, { shouldDirty: true })
            }
          />
          Enabled
        </label>

        <div>
          <Label htmlFor="resend_api_key">API key</Label>
          <Input
            id="resend_api_key"
            type="password"
            autoComplete="new-password"
            placeholder="re_…"
            {...form.register("api_key")}
          />
          <MaskHint label="API key" mask={card.secretsMask.api_key} />
          <FieldError message={form.formState.errors.api_key?.message} />
        </div>

        <div>
          <Label htmlFor="resend_from">From email</Label>
          <Input
            id="resend_from"
            placeholder="BOOK MY TEES <orders@yourdomain.com>"
            {...form.register("from_email")}
          />
          <FieldError message={form.formState.errors.from_email?.message} />
        </div>

        <FormMessage error={error} success={success} />

        {card.lastTestedAt ? (
          <p className="text-xs text-muted-foreground">
            Last tested {new Date(card.lastTestedAt).toLocaleString()}
            {card.lastTestMessage ? ` — ${card.lastTestMessage}` : ""}
          </p>
        ) : null}

        <p className="text-xs text-muted-foreground">
          Test sends to your signed-in admin email
          {adminEmail ? ` (${adminEmail})` : ""}.
        </p>

        {!encryptionReady ? (
          <p className="text-xs text-amber-300">
            Set <span className="font-mono">INTEGRATIONS_ENCRYPTION_KEY</span> to
            save secrets in the database.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending || !encryptionReady}>
            {isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onTest}
          >
            Test connection
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending || card.source !== "database"}
            onClick={onDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </form>
    </section>
  );
}

function TwilioCard({
  card,
  encryptionReady,
}: {
  card: IntegrationProviderCard;
  encryptionReady: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<TwilioIntegrationInput, unknown, TwilioIntegrationValues>({
    resolver: zodResolver(twilioIntegrationSchema),
    defaultValues: {
      provider: "twilio_whatsapp",
      is_enabled: card.isEnabled,
      account_sid: "",
      auth_token: "",
      whatsapp_from: card.config.whatsapp_from || "",
      test_phone: "",
    },
  });

  function onSave(values: TwilioIntegrationValues) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await saveIntegrationAction({ form: values });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(result.message ?? "Saved.");
      form.reset({
        provider: "twilio_whatsapp",
        is_enabled: values.is_enabled,
        account_sid: "",
        auth_token: "",
        whatsapp_from: values.whatsapp_from,
        test_phone: values.test_phone ?? "",
      });
      router.refresh();
    });
  }

  function onTest() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await testIntegrationAction({
        provider: "twilio_whatsapp",
        test_phone: form.getValues("test_phone"),
      });
      if (!result.success) {
        setError(result.error);
        router.refresh();
        return;
      }
      setSuccess(result.message ?? "Test passed.");
      router.refresh();
    });
  }

  function onDisconnect() {
    if (!window.confirm("Disconnect Twilio WhatsApp saved credentials?")) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await disconnectIntegrationAction({
        provider: "twilio_whatsapp",
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSuccess(result.message ?? "Disconnected.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{card.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={card.status} />
          <SourceHint card={card} />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Production WhatsApp may require approved Twilio templates. Free-form
        messages work on the Twilio sandbox.
      </p>

      <form className="mt-4 space-y-4" onSubmit={form.handleSubmit(onSave)}>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={form.watch("is_enabled")}
            onChange={(e) =>
              form.setValue("is_enabled", e.target.checked, { shouldDirty: true })
            }
          />
          Enabled
        </label>

        <div>
          <Label htmlFor="twilio_sid">Account SID</Label>
          <Input
            id="twilio_sid"
            autoComplete="off"
            placeholder="AC…"
            {...form.register("account_sid")}
          />
          <MaskHint label="Account SID" mask={card.secretsMask.account_sid} />
          <FieldError message={form.formState.errors.account_sid?.message} />
        </div>

        <div>
          <Label htmlFor="twilio_token">Auth Token</Label>
          <Input
            id="twilio_token"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...form.register("auth_token")}
          />
          <MaskHint label="Auth Token" mask={card.secretsMask.auth_token} />
          <FieldError message={form.formState.errors.auth_token?.message} />
        </div>

        <div>
          <Label htmlFor="twilio_from">WhatsApp From</Label>
          <Input
            id="twilio_from"
            placeholder="whatsapp:+14155238886"
            {...form.register("whatsapp_from")}
          />
          <FieldError message={form.formState.errors.whatsapp_from?.message} />
        </div>

        <div>
          <Label htmlFor="twilio_test_phone">Test phone (optional)</Label>
          <Input
            id="twilio_test_phone"
            placeholder="+9198XXXXXXXX"
            {...form.register("test_phone")}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Falls back to Admin notify phone in Settings if blank.
          </p>
        </div>

        <FormMessage error={error} success={success} />

        {card.lastTestedAt ? (
          <p className="text-xs text-muted-foreground">
            Last tested {new Date(card.lastTestedAt).toLocaleString()}
            {card.lastTestMessage ? ` — ${card.lastTestMessage}` : ""}
          </p>
        ) : null}

        {!encryptionReady ? (
          <p className="text-xs text-amber-300">
            Set <span className="font-mono">INTEGRATIONS_ENCRYPTION_KEY</span> to
            save secrets in the database.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending || !encryptionReady}>
            {isPending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onTest}
          >
            Test connection
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isPending || card.source !== "database"}
            onClick={onDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </form>
    </section>
  );
}

export function IntegrationsPanel({ data }: IntegrationsPanelProps) {
  const byProvider = Object.fromEntries(
    data.providers.map((card) => [card.provider, card])
  ) as Record<string, IntegrationProviderCard>;

  return (
    <div className="space-y-6">
      {!data.integrationsAvailable ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Apply migration{" "}
          <span className="font-mono">
            20260722100000_integration_credentials.sql
          </span>{" "}
          to enable saved credentials. Env fallback still works for Test.
        </p>
      ) : null}

      <RazorpayCard
        card={byProvider.razorpay}
        encryptionReady={data.encryptionKeyConfigured}
      />
      <ResendCard
        card={byProvider.resend}
        encryptionReady={data.encryptionKeyConfigured}
        adminEmail={data.adminEmail}
      />
      <TwilioCard
        card={byProvider.twilio_whatsapp}
        encryptionReady={data.encryptionKeyConfigured}
      />
    </div>
  );
}
