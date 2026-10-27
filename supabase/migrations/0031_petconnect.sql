-- ============================================================
-- 0031_petconnect.sql — Modulul PetConnect (aplicația MOBILĂ)
--   * forum_posts / forum_comments: comunitatea PawfectPair
--   * Tabelele există din 0001; această migrație re-confirmă politicile RLS,
--     adaugă constrângeri de lungime, indexuri și realtime
--   * Idempotent: poate rula pe DB nou SAU peste migratiile 0001-0030
-- ============================================================

-- 1) Tabele (idempotente — compatibile cu definiția din 0001)
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.forum_posts enable row level security;
alter table public.forum_comments enable row level security;

-- 2) Politici RLS (drop & create = idempotent, aceleași nume ca 0001)
drop policy if exists "Forum posts are viewable by everyone" on public.forum_posts;
create policy "Forum posts are viewable by everyone"
  on public.forum_posts for select
  using (true);

drop policy if exists "Authors manage their own posts" on public.forum_posts;
create policy "Authors manage their own posts"
  on public.forum_posts for all
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "Forum comments are viewable by everyone" on public.forum_comments;
create policy "Forum comments are viewable by everyone"
  on public.forum_comments for select
  using (true);

drop policy if exists "Authors manage their own comments" on public.forum_comments;
create policy "Authors manage their own comments"
  on public.forum_comments for all
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- 3) Constrângeri suplimentare (idempotente, DO block)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'forum_posts_title_len'
  ) then
    alter table public.forum_posts
      add constraint forum_posts_title_len
      check (char_length(trim(title)) between 3 and 100);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'forum_posts_body_len'
  ) then
    alter table public.forum_posts
      add constraint forum_posts_body_len
      check (char_length(trim(body)) between 10 and 2000);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'forum_comments_body_len'
  ) then
    alter table public.forum_comments
      add constraint forum_comments_body_len
      check (char_length(trim(body)) between 2 and 500);
  end if;
end $$;

-- 4) Indexuri
create index if not exists forum_posts_created_idx
  on public.forum_posts (created_at desc);
create index if not exists forum_posts_category_idx
  on public.forum_posts (category);
create index if not exists forum_posts_author_idx
  on public.forum_posts (author_id);
create index if not exists forum_comments_post_idx
  on public.forum_comments (post_id, created_at);
create index if not exists forum_comments_author_idx
  on public.forum_comments (author_id);

-- 5) Realtime (postări noi apar live în feed)
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'forum_posts'
  ) then
    alter publication supabase_realtime add table public.forum_posts;
  end if;
end $$;

comment on table public.forum_posts is
  'PetConnect: postari pe forumul comunitatii (categorie libera; mobilul mapeaza pe categorii fixe)';
comment on table public.forum_comments is
  'PetConnect: comentarii la postari (max 500 caractere)';
