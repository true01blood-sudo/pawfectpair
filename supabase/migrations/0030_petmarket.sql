-- ============================================================
-- 0030_petmarket.sql — Modulul PetMarket (aplicația MOBILĂ)
--   * Extinde tabelul `products` (din 0001) cu: condition, city, status,
--     delivery_info (idempotent cu 0020)
--   * Trigger: la inserarea unei linii de comandă scade stocul; la stoc 0
--     produsul trece automat pe 'sold'
--   * Politici RLS noi: vânzătorul vede/updatează comenzile care conțin
--     produsele lui (necesar fluxului bilateral)
--   * Idempotent: poate rula pe DB nou SAU peste migratiile 0001-0029
-- ============================================================

-- 1) Coloane noi pe products
alter table public.products add column if not exists condition text;
alter table public.products add column if not exists city text;
alter table public.products add column if not exists status text not null default 'active';
alter table public.products add column if not exists delivery_info text;

-- 2) Constrângeri (idempotente, DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_condition_check'
  ) then
    alter table public.products
      add constraint products_condition_check
      check (condition is null or condition in ('new', 'like_new', 'used'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'products_status_check'
  ) then
    alter table public.products
      add constraint products_status_check
      check (status in ('active', 'sold'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'products_name_len'
  ) then
    alter table public.products
      add constraint products_name_len
      check (char_length(trim(name)) between 2 and 80);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'products_city_len'
  ) then
    alter table public.products
      add constraint products_city_len
      check (city is null or char_length(trim(city)) between 2 and 60);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'products_desc_len'
  ) then
    alter table public.products
      add constraint products_desc_len
      check (description is null or char_length(description) <= 800);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'products_delivery_len'
  ) then
    alter table public.products
      add constraint products_delivery_len
      check (delivery_info is null or char_length(delivery_info) <= 300);
  end if;
end $$;

-- 3) Trigger decrementare stoc la vânzare + trecere automată pe 'sold'
create or replace function public.marketplace_after_order_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.products
  set stock = greatest(stock - new.quantity, 0),
      status = case
        when greatest(stock - new.quantity, 0) <= 0 then 'sold'
        else status
      end,
      updated_at = now()
  where id = new.product_id;
  return new;
end;
$$;

drop trigger if exists trg_order_items_stock on public.order_items;
create trigger trg_order_items_stock
  after insert on public.order_items
  for each row execute function public.marketplace_after_order_item();

-- 4) Politici RLS pentru fluxul bilateral (vânzătorul vede comenzile lui)
--    Notă: drop & create = idempotent; păstrează politicile din 0001 pentru restul.

drop policy if exists "Sellers view orders with their products" on public.orders;
create policy "Sellers view orders with their products"
  on public.orders for select
  using (
    exists (
      select 1 from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = orders.id and p.seller_id = auth.uid()
    )
  );

drop policy if exists "Sellers update orders with their products" on public.orders;
create policy "Sellers update orders with their products"
  on public.orders for update
  using (
    exists (
      select 1 from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = orders.id and p.seller_id = auth.uid()
    )
  );

drop policy if exists "Sellers view their order items" on public.order_items;
create policy "Sellers view their order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_id and p.seller_id = auth.uid()
    )
  );

-- 5) Indexuri
create index if not exists products_category_idx on public.products (category);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_city_idx on public.products (city);
create index if not exists products_seller_idx on public.products (seller_id);
create index if not exists orders_buyer_idx on public.orders (buyer_id, created_at);
create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

-- 6) Realtime (anunțuri noi apar live în feed)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;
end $$;

comment on function public.marketplace_after_order_item() is
  'PetMarket: scade stocul la inserarea unei linii de comanda; stoc 0 => produsul devine sold';
comment on column public.products.condition is
  'PetMarket: new / like_new / used (null = produse doar din web)';
comment on column public.products.status is
  'PetMarket: active (anunt vizibil) / sold (vandut sau stoc epuizat)';
