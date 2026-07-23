import { NextResponse } from "next/server";

/**
 * Liveness probe — process is up. Does not check dependencies.
 * Aliases: /api/health, /api/healthz, /api/livez
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    check: "liveness",
    timestamp: new Date().toISOString(),
  });
}
