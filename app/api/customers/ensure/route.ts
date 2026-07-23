import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureCustomerProfile } from "@/lib/db/customers";
import { createServerClient } from "@/lib/supabase/server";

const ensureCustomerSchema = z.object({
  authUserId: z.string().uuid(),
  fullName: z.string().trim().max(120).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
});

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const token = header.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function POST(request: Request) {
  try {
    const accessToken = bearerToken(request);
    const supabase = await createServerClient();
    const {
      data: { user: cookieUser },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const parsed = ensureCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    // Prefer cookie session; fall back to Authorization bearer from client sign-in.
    let authUserId = cookieUser?.id ?? null;
    if (!authUserId && accessToken) {
      authUserId = parsed.data.authUserId;
    }

    if (!authUserId) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    if (parsed.data.authUserId !== authUserId && cookieUser) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const result = await ensureCustomerProfile({
      authUserId: parsed.data.authUserId,
      fullName: parsed.data.fullName ?? null,
      phone: parsed.data.phone ?? null,
      accessToken: accessToken ?? undefined,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ customerId: result.customer.id });
  } catch (error) {
    console.error("Ensure customer API failed:", error);
    return NextResponse.json(
      { error: "Unexpected error while creating customer profile." },
      { status: 500 }
    );
  }
}
