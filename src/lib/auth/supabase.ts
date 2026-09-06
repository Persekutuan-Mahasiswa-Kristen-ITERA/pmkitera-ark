import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createBrowserClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "example-anon-key";

// Server-side Supabase client (digunakan di Server Components, Route Handlers, Server Actions)
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component tidak bisa set cookie; abaikan error ini jika dipanggil dari Server Component.
        }
      },
    },
  });
}

// Browser-side Supabase client (digunakan di Client Components)
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
