import { NextResponse } from "next/server";

export interface ApiErrorBody {
  error: string;
  code?: string;
  traceId?: string;
}

export function apiError(
  status: number,
  error: string,
  options?: { code?: string; traceId?: string }
) {
  const body: ApiErrorBody = { error };
  if (options?.code) body.code = options.code;
  if (options?.traceId) body.traceId = options.traceId;
  return NextResponse.json(body, { status });
}

export function apiOk<T extends Record<string, unknown>>(
  data: T,
  init?: { status?: number }
) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}
