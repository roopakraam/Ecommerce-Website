import { NextResponse } from "next/server";
import { getAdminOrders } from "@/lib/db/admin-orders";
import { isOrderStatus } from "@/lib/orders/status";
import { csvDownloadResponse, rowsToCsv } from "@/lib/utils/csv";
import type { OrderStatus } from "@/types";

export const dynamic = "force-dynamic";

function isYmd(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function formatAddress(address: {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
}): string {
  return [
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.pincode}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status");
    const status: OrderStatus | "all" =
      statusParam && isOrderStatus(statusParam) ? statusParam : "all";
    const search = searchParams.get("q")?.trim() || undefined;
    const fromDateRaw = searchParams.get("from");
    const toDateRaw = searchParams.get("to");
    const fromDate = isYmd(fromDateRaw) ? fromDateRaw : undefined;
    const toDate = isYmd(toDateRaw) ? toDateRaw : undefined;

    const orders = await getAdminOrders({
      status,
      search,
      fromDate,
      toDate,
    });

    const csv = rowsToCsv(
      [
        "Order ID",
        "Created At",
        "Customer Name",
        "Customer Phone",
        "Status",
        "Payment Status",
        "Payment Provider",
        "Payment Reference",
        "Subtotal",
        "Shipping Fee",
        "Total",
        "Shipping Address",
        "Inventory Reserved",
      ],
      orders.map((order) => [
        order.id,
        order.created_at,
        order.customers?.full_name ?? "",
        order.customers?.phone ?? "",
        order.status,
        order.payment_status,
        order.payment_provider ?? "",
        order.payment_reference ?? "",
        Number(order.subtotal),
        Number(order.shipping_fee),
        Number(order.total),
        formatAddress(order.shipping_address),
        order.inventory_reserved ? "yes" : "no",
      ])
    );

    const stamp = new Date().toISOString().slice(0, 10);
    return csvDownloadResponse(`orders-${stamp}.csv`, csv);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to export orders.";
    const status =
      message.includes("signed in") || message.includes("admin access")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
