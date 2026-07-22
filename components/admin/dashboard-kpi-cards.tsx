import Link from "next/link";
import {
  AlertTriangle,
  IndianRupee,
  ShoppingBag,
  Users,
} from "lucide-react";
import type { DashboardMetrics } from "@/lib/db/admin-dashboard";
import { formatPrice } from "@/lib/utils/format-price";
import { cn } from "@/lib/utils/cn";

interface DashboardKpiCardsProps {
  metrics: DashboardMetrics;
}

interface KpiCard {
  key: string;
  label: string;
  value: string;
  hint: string;
  icon: typeof IndianRupee;
  href?: string;
  accent?: string;
}

export function DashboardKpiCards({ metrics }: DashboardKpiCardsProps) {
  const cards: KpiCard[] = [
    {
      key: "revenue-today",
      label: "Revenue today",
      value: formatPrice(metrics.revenueToday),
      hint: "Paid orders · IST",
      icon: IndianRupee,
    },
    {
      key: "revenue-7d",
      label: "Revenue 7d",
      value: formatPrice(metrics.revenue7d),
      hint: "Last 7 calendar days",
      icon: IndianRupee,
    },
    {
      key: "revenue-30d",
      label: "Revenue 30d",
      value: formatPrice(metrics.revenue30d),
      hint: "Last 30 calendar days",
      icon: IndianRupee,
    },
    {
      key: "orders-today",
      label: "Orders today",
      value: String(metrics.ordersToday),
      hint: "All payment statuses",
      icon: ShoppingBag,
      href: "/admin/orders",
    },
    {
      key: "low-stock",
      label: "Low stock",
      value: String(metrics.lowStockCount),
      hint: "Variants under 5 units",
      icon: AlertTriangle,
      href: "/admin/inventory",
      accent: metrics.lowStockCount > 0 ? "text-amber-300" : undefined,
    },
    {
      key: "new-customers",
      label: "New customers",
      value: String(metrics.newCustomers),
      hint: "Signed up today · IST",
      icon: Users,
      href: "/admin/customers",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const content = (
          <>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className={cn("h-4 w-4", card.accent)} />
              <p className="text-xs font-semibold uppercase tracking-wide">
                {card.label}
              </p>
            </div>
            <p
              className={cn(
                "mt-3 text-3xl font-bold tracking-tight text-foreground",
                card.accent
              )}
            >
              {card.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </>
        );

        const className =
          "rounded-xl border border-border bg-card p-5 transition-colors";

        if (card.href) {
          return (
            <Link
              key={card.key}
              href={card.href}
              className={cn(className, "hover:border-primary/40")}
            >
              {content}
            </Link>
          );
        }

        return (
          <div key={card.key} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
