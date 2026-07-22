import { AnalyticsTabs } from "@/components/admin/analytics-tabs";
import { parseAnalyticsTab } from "@/lib/admin/analytics";
import { getAdminAnalyticsData } from "@/lib/db/admin-analytics";

export const dynamic = "force-dynamic";

interface AdminAnalyticsPageProps {
  searchParams: {
    tab?: string;
  };
}

export default async function AdminAnalyticsPage({
  searchParams,
}: AdminAnalyticsPageProps) {
  const tab = parseAnalyticsTab(searchParams.tab);
  let data: Awaited<ReturnType<typeof getAdminAnalyticsData>> | null = null;
  let loadError: string | null = null;

  try {
    data = await getAdminAnalyticsData();
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Failed to load analytics.";
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sales, inventory turnover, and customer repeat behavior for BOOK MY
          TEES.
        </p>
      </div>

      {loadError ? (
        <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
          {loadError}
        </p>
      ) : data ? (
        <AnalyticsTabs
          tab={tab}
          sales={data.sales}
          inventory={data.inventory}
          customers={data.customers}
        />
      ) : null}
    </main>
  );
}
