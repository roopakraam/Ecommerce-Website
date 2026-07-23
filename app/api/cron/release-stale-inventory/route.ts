import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { releaseStaleReservedOrders } from "@/lib/db/orders";
import { logger } from "@/lib/logger";

const STALE_TTL_MINUTES = 45;

function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return false;
  }

  const token = header.slice("Bearer ".length);
  const expected = Buffer.from(secret);
  const actual = Buffer.from(token);

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await releaseStaleReservedOrders({
      olderThanMinutes: STALE_TTL_MINUTES,
    });

    logger.info("release-stale-inventory cron completed", {
      ...result,
      olderThanMinutes: STALE_TTL_MINUTES,
    });

    return NextResponse.json({
      ok: true,
      olderThanMinutes: STALE_TTL_MINUTES,
      ...result,
    });
  } catch (error) {
    logger.error("release-stale-inventory cron failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to release stale reserved inventory." },
      { status: 500 }
    );
  }
}
