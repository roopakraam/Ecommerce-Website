import { createClient } from "@supabase/supabase-js";

/**
 * Decodes the `role` claim from a Supabase JWT without verifying the signature.
 * Used only to catch the common misconfig of pasting the anon key as SERVICE_ROLE.
 */
function readJwtRole(token: string): string | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const padded =
      payloadPart.replace(/-/g, "+").replace(/_/g, "/") +
      "=".repeat((4 - (payloadPart.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(json) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  const role = readJwtRole(serviceRoleKey);
  if (role && role !== "service_role") {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY is wrong (JWT role is "${role}", expected "service_role"). ` +
        "In Supabase → Project Settings → API, copy the service_role secret — not the anon key. " +
        "Then restart the Next.js server."
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
