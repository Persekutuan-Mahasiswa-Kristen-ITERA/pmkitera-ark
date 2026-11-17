/**
 * ARK signs people in with their PI-CORE account (PI-CORE D-14/D-16). Accounts, passwords and
 * Google sign-in live in PI-CORE; ARK reads the caller's ARK roles from PI-CORE's
 * `my_app_roles('ark')`. ARK's own database (documents, categories, periods) is unchanged.
 *
 * Env (public, safe in the browser):
 *   NEXT_PUBLIC_PICORE_URL                       e.g. https://core.pmkitera.web.id
 *   NEXT_PUBLIC_PICORE_SUPABASE_URL              PI-CORE's Supabase API URL
 *   NEXT_PUBLIC_PICORE_SUPABASE_PUBLISHABLE_KEY  PI-CORE's publishable (anon) key
 */
export const PICORE_URL = (process.env.NEXT_PUBLIC_PICORE_URL || "https://core.pmkitera.web.id").replace(/\/+$/, "");
export const PICORE_CHANGE_PASSWORD_URL = `${PICORE_URL}/change-password`;

/** The app key ARK has in PI-CORE (apps.key, Google handoff list). */
export const ARK_APP_KEY = "ark";

export function picoreSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_PICORE_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_PICORE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_PICORE_SUPABASE_URL dan NEXT_PUBLIC_PICORE_SUPABASE_PUBLISHABLE_KEY (lihat .env.example)."
    );
  }
  return { url, key };
}
