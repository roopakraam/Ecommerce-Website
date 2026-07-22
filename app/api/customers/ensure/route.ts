import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureCustomerProfile } from "@/lib/db/customers";
import { createServerClient } from "@/lib/supabase/server";

const ensureCustomerSchema = z.object({
  authUserId: z.string().uuid(),
  fullName: z.string().trim().max(120).nullable().optional(),
  phone: z.string().trim().max(20).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = ensureCustomerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payload." },
        { status: 400 }
      );
    }

    if (parsed.data.authUserId !== user.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const result = await ensureCustomerProfile({
      authUserId: user.id,
      fullName: parsed.data.fullName ?? null,
      phone: parsed.data.phone ?? null,
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
