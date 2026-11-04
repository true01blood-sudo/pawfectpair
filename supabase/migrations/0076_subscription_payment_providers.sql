-- ──────────────────────────────────────────
-- 0076: configurare admin pentru procesatorii de plată ai abonamentelor
-- (Premium useri + Pro furnizori) — separat de payment_config (0040), care
-- e pentru checkout-ul de comenzi one-time din magazin (COD/card/transfer),
-- un flux diferit (produse fizice, nu abonamente recurente).
--
-- payment_config (0040) e de altfel complet orfan — schema există, dar
-- nicio pagină admin nu o citește/scrie vreodată (verificat: zero
-- referințe în web/src). Nu repetăm greșeala aici — construim și UI-ul
-- admin în aceeași sesiune (vezi web/src/app/admin/plati).
--
-- Design: un rând per procesator (nu un singur "provider activ" ca la
-- payment_config) — userul a cerut explicit sa poata activa Stripe SI
-- PayU simultan (bifa + completezi cheile), nu doar unul singur.
--
-- RevenueCat exclus intentionat: are produs de "Web Billing", dar e in
-- beta, doar USD (nu EUR), necesita plan platit RevenueCat, si rezolva
-- o problema (unificare mobil+web) care nu se aplica aici — nu vom avea
-- plata in aplicatia mobila, doar pe web (decizie explicita a userului).
--
-- Securitate: cheile secrete stau in acest tabel (RLS strict admin-only),
-- acelasi nivel de protectie ca payment_config.public_key. Pentru o
-- varianta mai dura (criptare la repaus / Supabase Vault) ar fi nevoie
-- de o trecere separata — semnalat userului, nu blocam pe asta acum.
-- ──────────────────────────────────────────

create table if not exists public.subscription_payment_providers (
  provider        text primary key check (provider in ('stripe', 'payu', 'netopia', 'revolut')),
  enabled         boolean not null default false,
  test_mode       boolean not null default true,
  public_key      text,
  secret_key      text,
  webhook_secret  text,
  extra           jsonb not null default '{}',
  updated_at      timestamptz not null default now()
);

alter table public.subscription_payment_providers enable row level security;

drop policy if exists "Admin manages subscription payment providers" on public.subscription_payment_providers;
create policy "Admin manages subscription payment providers"
  on public.subscription_payment_providers for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.subscription_payment_providers (provider)
values ('stripe'), ('payu'), ('netopia'), ('revolut')
on conflict (provider) do nothing;
