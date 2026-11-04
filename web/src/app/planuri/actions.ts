"use server";

import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { getStripeClient, PREMIUM_YEARLY_PRICE_DATA, StripeNotConfiguredError } from "@/lib/stripe";

const SITE_URL = "https://pawfectpair.app";

export async function startPremiumCheckout() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let stripe, testMode;
  try {
    ({ stripe, testMode } = await getStripeClient());
  } catch (e) {
    if (e instanceof StripeNotConfiguredError) {
      redirect("/planuri?eroare=stripe_neconfigurat");
    }
    throw e;
  }
  void testMode;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : (user.email ?? undefined),
    client_reference_id: user.id,
    line_items: [{ price_data: PREMIUM_YEARLY_PRICE_DATA, quantity: 1 }],
    success_url: `${SITE_URL}/planuri?checkout=succes`,
    cancel_url: `${SITE_URL}/planuri?checkout=anulat`,
    metadata: { user_id: user.id, kind: "user_premium" },
  });

  if (!session.url) throw new Error("Stripe nu a întors un URL de checkout.");
  redirect(session.url);
}

/** Portal de gestionare abonament (anulare, schimbare metodă de plată) — Stripe Billing Portal. */
export async function openBillingPortal() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) redirect("/planuri");

  const { stripe } = await getStripeClient();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${SITE_URL}/planuri`,
  });

  redirect(portalSession.url);
}
