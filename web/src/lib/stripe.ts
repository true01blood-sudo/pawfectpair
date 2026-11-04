/**
 * Client Stripe configurat dinamic din subscription_payment_providers
 * (panou admin /admin/plati) — nu din variabile de mediu fixe, ca
 * adminul să poată activa/dezactiva și schimba cheile fără redeploy.
 */
import Stripe from "stripe";
import { createAdminClient } from "./supabase/admin";

export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe nu e activat sau nu are cheie secretă setată în /admin/plati.");
    this.name = "StripeNotConfiguredError";
  }
}

export async function getStripeClient(): Promise<{ stripe: Stripe; testMode: boolean }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscription_payment_providers")
    .select("enabled, test_mode, secret_key")
    .eq("provider", "stripe")
    .single();

  if (error || !data || !data.enabled || !data.secret_key) {
    throw new StripeNotConfiguredError();
  }

  const stripe = new Stripe(data.secret_key, {
    apiVersion: "2026-10-28.endive",
  });

  return { stripe, testMode: data.test_mode };
}

export async function getStripeWebhookSecret(): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscription_payment_providers")
    .select("webhook_secret")
    .eq("provider", "stripe")
    .single();

  if (error || !data?.webhook_secret) {
    throw new StripeNotConfiguredError();
  }
  return data.webhook_secret;
}

/** Prețul anual Premium, generat dinamic (price_data) — nu are nevoie de Product/Price precreate în dashboard-ul Stripe. */
export const PREMIUM_YEARLY_PRICE_DATA = {
  currency: "eur",
  unit_amount: 1999, // 19,99€ — Stripe lucrează în cenți
  recurring: { interval: "year" as const },
  product_data: {
    name: "Pet Care+",
    description: "Acces complet la toate modulele Pet Care, un an.",
  },
};
