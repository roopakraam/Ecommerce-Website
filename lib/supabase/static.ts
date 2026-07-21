import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types";

/**
 * Cookieless Supabase client for public data at build time (generateStaticParams, ISR).
 * Use createServerClient() when auth/session context is required.
 */
export function createStaticClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
