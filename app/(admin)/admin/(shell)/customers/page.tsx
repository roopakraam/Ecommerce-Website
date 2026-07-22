import { CustomersSearch } from "@/components/admin/customers-search";
import { CustomersTable } from "@/components/admin/customers-table";
import { getAdminCustomers } from "@/lib/db/admin-customers";

export const dynamic = "force-dynamic";

interface AdminCustomersPageProps {
  searchParams: {
    q?: string;
  };
}

export default async function AdminCustomersPage({
  searchParams,
}: AdminCustomersPageProps) {
  const search = searchParams.q?.trim() ?? "";
  const customers = await getAdminCustomers({
    search: search || undefined,
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Customers
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Search accounts and review spend, order volume, and profile details.
        </p>
      </div>

      <div className="space-y-4">
        <CustomersSearch search={search} />
        <CustomersTable
          customers={customers}
          hasActiveSearch={Boolean(search)}
        />
      </div>
    </main>
  );
}
