import { InventoryFilters } from "@/components/admin/inventory-filters";
import { InventoryTable } from "@/components/admin/inventory-table";
import { getAdminInventory } from "@/lib/db/admin-inventory";

export const dynamic = "force-dynamic";

interface AdminInventoryPageProps {
  searchParams: {
    q?: string;
    low?: string;
  };
}

export default async function AdminInventoryPage({
  searchParams,
}: AdminInventoryPageProps) {
  const search = searchParams.q?.trim() ?? "";
  const lowStockOnly = searchParams.low === "1";

  const rows = await getAdminInventory({
    search: search || undefined,
    lowStockOnly,
  });

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Inventory
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Current variant stock with low-stock filtering and manual adjustments.
        </p>
      </div>

      <div className="space-y-4">
        <InventoryFilters search={search} lowStockOnly={lowStockOnly} />
        <InventoryTable
          rows={rows}
          lowStockOnly={lowStockOnly}
          hasSearch={Boolean(search)}
        />
      </div>
    </main>
  );
}
