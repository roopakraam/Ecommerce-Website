"use client";

import { useState } from "react";
import type { AdminInventoryRow } from "@/lib/db/admin-inventory";
import { ADMIN_LOW_STOCK_THRESHOLD } from "@/lib/admin/products";
import { InventoryAdjustDialog } from "@/components/admin/inventory-adjust-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ADMIN_INVENTORY_PATH } from "@/lib/admin/inventory";

interface InventoryTableProps {
  rows: AdminInventoryRow[];
  lowStockOnly: boolean;
  hasSearch: boolean;
}

export function InventoryTable({
  rows,
  lowStockOnly,
  hasSearch,
}: InventoryTableProps) {
  const [selected, setSelected] = useState<AdminInventoryRow | null>(null);
  const [open, setOpen] = useState(false);

  function openAdjust(row: AdminInventoryRow) {
    setSelected(row);
    setOpen(true);
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        tone="dark"
        title={
          hasSearch || lowStockOnly
            ? "No variants match your filters"
            : "No variants yet"
        }
        description={
          hasSearch || lowStockOnly
            ? "Try clearing the low-stock filter or search term."
            : "Add product variants to start tracking inventory."
        }
        actionHref={
          hasSearch || lowStockOnly ? ADMIN_INVENTORY_PATH : "/admin/products/new"
        }
        actionLabel={
          hasSearch || lowStockOnly ? "Clear filters" : "Add product"
        }
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">Variant</th>
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-background">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-medium text-foreground">
                  {row.product_name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.size} / {row.color}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {row.sku}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.is_low_stock
                        ? "font-semibold text-amber-300"
                        : "text-foreground"
                    }
                  >
                    {row.stock_quantity}
                  </span>
                  {row.is_low_stock ? (
                    <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-amber-400">
                      Low
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      row.is_active
                        ? "border-emerald-700 bg-emerald-950 text-emerald-300"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {row.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openAdjust(row)}
                  >
                    Adjust
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Low stock threshold: under {ADMIN_LOW_STOCK_THRESHOLD} units. Adjustments
        write to inventory_adjustments.
      </p>

      <InventoryAdjustDialog
        variant={selected}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
