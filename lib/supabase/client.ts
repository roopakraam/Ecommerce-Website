import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client for Client Components only.
 * Uses document.cookie — never import this in server code.
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
