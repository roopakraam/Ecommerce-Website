import { IntegrationsPanel } from "@/components/admin/integrations-panel";
import { getAdminIntegrations } from "@/lib/db/admin-integrations";

export const dynamic = "force-dynamic";

export default async function AdminIntegrationsPage() {
  let data: Awaited<ReturnType<typeof getAdminIntegrations>> | null = null;
  let loadError: string | null = null;

  try {
    data = await getAdminIntegrations();
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Failed to load integrations.";
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Integrations
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure Razorpay, Resend, and Twilio WhatsApp. Secrets are encrypted
          at rest; environment variables remain a fallback.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {loadError}
        </p>
      ) : data ? (
        <IntegrationsPanel data={data} />
      ) : null}
    </main>
  );
}
