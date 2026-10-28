-- ============================================================
-- 0043_social_posts.sql — Social feed (PetConnect web + mobile)
--   * social_posts: postări în feed (tip/lesson/question/event/photo)
--   * social_post_reactions: reacții per user per post (heart/thumbup/smile)
--   * Idempotent, compatibil cu schema existentă
-- ============================================================

-- 1) Tabela social_posts
create table if not exists public.social_posts (
  id           uuid        primary key default gen_random_uuid(),
  author_id    uuid        not null references public.profiles (id) on delete cascade,
  post_type    text        not null default 'tip'
                           check (post_type in ('tip','lesson','question','event','photo','update')),
  body         text        not null,
  title        text,
  media_url    text,
  media_type   text        check (media_type in ('image','video')),
  video_duration text,
  location     text,
  is_public    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.social_posts enable row level security;

drop policy if exists "Social posts viewable by everyone" on public.social_posts;
create policy "Social posts viewable by everyone"
  on public.social_posts for select
  using (is_public = true or auth.uid() = author_id);

drop policy if exists "Authors manage own social posts" on public.social_posts;
create policy "Authors manage own social posts"
  on public.social_posts for all
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- 2) Tabela reactions
create table if not exists public.social_post_reactions (
  post_id    uuid  not null references public.social_posts (id) on delete cascade,
  user_id    uuid  not null references public.profiles (id) on delete cascade,
  reaction   text  not null check (reaction in ('heart','thumbup','smile')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, reaction)
);

alter table public.social_post_reactions enable row level security;

drop policy if exists "Reactions viewable by everyone" on public.social_post_reactions;
create policy "Reactions viewable by everyone"
  on public.social_post_reactions for select using (true);

drop policy if exists "Users manage own reactions" on public.social_post_reactions;
create policy "Users manage own reactions"
  on public.social_post_reactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3) Tabel comment_counts (view pentru performanță)
create table if not exists public.social_post_comments (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references public.social_posts (id) on delete cascade,
  author_id  uuid        not null references public.profiles (id) on delete cascade,
  body       text        not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.social_post_comments enable row level security;

drop policy if exists "Comments viewable by everyone" on public.social_post_comments;
create policy "Comments viewable by everyone"
  on public.social_post_comments for select using (true);

drop policy if exists "Authors manage own comments" on public.social_post_comments;
create policy "Authors manage own comments"
  on public.social_post_comments for all
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- 4) Indexuri
create index if not exists social_posts_created_idx on public.social_posts (created_at desc);
create index if not exists social_posts_author_idx  on public.social_posts (author_id);
create index if not exists social_posts_type_idx    on public.social_posts (post_type);
create index if not exists social_reactions_post_idx on public.social_post_reactions (post_id);
create index if not exists social_comments_post_idx  on public.social_post_comments (post_id, created_at);

-- 5) Realtime pentru feed live
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'social_posts'
  ) then
    alter publication supabase_realtime add table public.social_posts;
  end if;
end $$;

-- 6) Seed — câteva postări demo (insert only if table is empty)
do $$
declare
  first_profile uuid;
begin
  select id into first_profile from public.profiles limit 1;
  if first_profile is not null and not exists (select 1 from public.social_posts limit 1) then
    insert into public.social_posts (author_id, post_type, title, body, location, is_public)
    values
      (first_profile, 'lesson',
       'O vizită la vet mai calmă începe acasă',
       'Pași simpli de antrenament pozitiv care pot face o mare diferență pentru bunăstarea animalului tău.',
       'Cluj-Napoca', true),
      (first_profile, 'tip',
       'Dimineață perfectă la parc 🧡',
       'Nimic nu bate aerul proaspăt, compania bună și câinii fericiți! 🐾',
       'Parcul Cișmigiu', true),
      (first_profile, 'question',
       'Ce recomandați pentru câinii anxioși la tunet?',
       'Luna se ascunde sub pat la fiecare furtună. Am încercat thundershirt fără succes. Alte idei?',
       null, true);
  end if;
end $$;
