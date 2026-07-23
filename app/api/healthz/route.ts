import { GET as healthGet } from "@/app/api/health/route";

/** Alias for liveness: /api/healthz */
export const GET = healthGet;
