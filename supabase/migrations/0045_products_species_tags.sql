-- 0045_products_species_tags.sql
-- Adaugă species_tags pe products pentru filtrul "For Luna"

alter table public.products
  add column if not exists species_tags text[] default '{}';

create index if not exists products_species_tags_idx
  on public.products using gin(species_tags);
