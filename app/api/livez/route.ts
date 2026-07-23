import { GET as healthGet } from "@/app/api/health/route";

/** Alias for liveness: /api/livez */
export const GET = healthGet;
