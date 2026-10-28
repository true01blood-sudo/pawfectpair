-- 0044_adoptii_detail_fields.sql
-- Adaugă câmpuri pentru pagina de detalii adopție (galerie, traits, info rescuе)

alter table public.adoption_listings
  add column if not exists photo_urls    text[]   default '{}',
  add column if not exists traits        text[]   default '{}',
  add column if not exists adoption_fee  numeric  default null,
  add column if not exists rescue_org    text     default null,
  add column if not exists vaccinated    boolean  default false,
  add column if not exists neutered      boolean  default false,
  add column if not exists microchipped  boolean  default false,
  add column if not exists good_with_kids    boolean default null,
  add column if not exists good_with_pets    boolean default null,
  add column if not exists energy_level  text check (energy_level in ('low','medium','high')) default null;

-- Index pentru filtrare after fees
create index if not exists adoption_listings_fee_idx
  on public.adoption_listings (adoption_fee);
