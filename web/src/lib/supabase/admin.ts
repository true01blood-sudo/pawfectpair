/**
 * Client Supabase cu rol de serviciu (service_role) — ocolește RLS.
 * Folosit DOAR server-side, pentru operații care au nevoie de acces la
 * date dincolo de ce poate vedea userul curent (ex: cheia secretă Stripe
 * din subscription_payment_providers, care are RLS admin-only — un user
 * obișnuit care cumpără Premium nu e admin, dar serverul tot trebuie să
 * citească cheia ca să creeze sesiunea de checkout).
 *
 * Nu importa acest fișier din cod care rulează în browser — cheia de
 * service_role are acces total la baza de date, fără RLS.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY lipsește din variabilele de mediu. Adaug-o în web/.env.local " +
        "(Supabase Dashboard → Settings → API → service_role key) și în mediul de producție (Vercel)."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
