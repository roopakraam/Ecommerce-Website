import { SettingsPanel } from "@/components/admin/settings-panel";
import { parseSettingsTab } from "@/lib/admin/settings";
import { getAdminSettings } from "@/lib/db/admin-settings";

export const dynamic = "force-dynamic";

interface AdminSettingsPageProps {
  searchParams: {
    tab?: string;
  };
}

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const tab = parseSettingsTab(searchParams.tab);
  let data: Awaited<ReturnType<typeof getAdminSettings>> | null = null;
  let loadError: string | null = null;

  try {
    data = await getAdminSettings();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Failed to load settings.";
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Store details, shipping zones, notifications, and your admin account.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {loadError}
        </p>
      ) : data ? (
        <SettingsPanel tab={tab} data={data} />
      ) : null}
    </main>
  );
}
