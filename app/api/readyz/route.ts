import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Readiness probe — verifies critical dependency connectivity (Supabase).
 * Does not expose secrets or detailed internals.
 */
export async function GET() {
  const checks: Record<string, "ok" | "error" | "skipped"> = {
    supabase: "skipped",
    razorpayEnv: "skipped",
  };

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("store_settings").select("id").limit(1);
    checks.supabase = error ? "error" : "ok";
  } catch {
    checks.supabase = "error";
  }

  const hasRazorpay =
    Boolean(process.env.RAZORPAY_KEY_ID?.trim()) &&
    Boolean(process.env.RAZORPAY_KEY_SECRET?.trim());
  checks.razorpayEnv = hasRazorpay ? "ok" : "skipped";

  const ready = checks.supabase === "ok";

  return NextResponse.json(
    {
      status: ready ? "ready" : "not_ready",
      check: "readiness",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: ready ? 200 : 503 }
  );
}
