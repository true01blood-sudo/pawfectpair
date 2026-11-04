-- ──────────────────────────────────────────
-- 0077: coloane pentru corelarea webhook-urilor Stripe cu profilul real.
--
-- Checkout Session-ul initial trimite client_reference_id = user.id, dar
-- evenimentele ulterioare (customer.subscription.updated/deleted — cand
-- se reinnoieste sau se anuleaza abonamentul) vin cu doar customer_id /
-- subscription_id Stripe, fara user.id — de-asta le stocam aici, ca sa
-- putem gasi profilul corect la orice eveniment ulterior.
-- ──────────────────────────────────────────

alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists profiles_stripe_subscription_id_key
  on public.profiles (stripe_subscription_id)
  where stripe_subscription_id is not null;
