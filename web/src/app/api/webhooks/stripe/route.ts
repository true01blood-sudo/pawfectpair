/**
 * Webhook Stripe — actualizează profiles.plan pe baza evenimentelor reale
 * de abonament. Nu există sesiune de user aici (Stripe apelează direct
 * serverul), deci orice scriere în DB foloseşte clientul admin
 * (service_role, ocolește RLS).
 *
 * Config necesară în Stripe Dashboard → Developers → Webhooks:
 *   URL: https://pawfectpair.app/api/webhooks/stripe
 *   Evenimente: checkout.session.completed, customer.subscription.updated,
 *               customer.subscription.deleted
 * Secretul generat acolo se pune în /admin/plati, la Stripe → "Secret webhook".
 */
import type Stripe from "stripe";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Lipsește semnătura stripe-signature.", { status: 400 });
  }

  const { stripe } = await getStripeClient();
  const webhookSecret = await getStripeWebhookSecret();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "semnătură invalidă";
    return new Response(`Webhook invalid: ${message}`, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id ?? session.metadata?.user_id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

      if (userId && customerId) {
        await admin
          .from("profiles")
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId ?? null,
            plan: "premium",
            plan_source: "purchased",
          })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const active = subscription.status === "active" || subscription.status === "trialing";
      const periodEnd = subscription.items.data[0]?.current_period_end;

      await admin
        .from("profiles")
        .update({
          stripe_subscription_id: subscription.id,
          plan: active ? "premium" : "free",
          plan_source: active ? "purchased" : null,
          plan_expires_at: active && periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

      await admin
        .from("profiles")
        .update({ plan: "free", plan_source: null, plan_expires_at: null })
        .eq("stripe_customer_id", customerId);
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
