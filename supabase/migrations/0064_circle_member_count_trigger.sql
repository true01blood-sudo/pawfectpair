-- ──────────────────────────────────────────
-- 0064: Trigger pentru member_count pe circles.
--
-- circles.member_count e un contor denormalizat, fara niciun trigger
-- care sa-l mentina (migratia 0041 doar il initializeaza la 0/seed).
-- Gasit cand am construit butoanele reale de Alătură-te/Părăsește pentru
-- /cercuri (formularele vechi POST-au catre rute care nu existau).
-- Mentinerea manuala din server actions ar fi fragila (CASCADE delete pe
-- circle_members, concurenta) — un trigger e sursa unica de adevar.
-- ──────────────────────────────────────────

create or replace function public.bump_circle_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.circles set member_count = member_count + 1 where id = new.circle_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.circles set member_count = greatest(member_count - 1, 0) where id = old.circle_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists circle_members_count_insert on public.circle_members;
create trigger circle_members_count_insert
  after insert on public.circle_members
  for each row execute function public.bump_circle_member_count();

drop trigger if exists circle_members_count_delete on public.circle_members;
create trigger circle_members_count_delete
  after delete on public.circle_members
  for each row execute function public.bump_circle_member_count();

-- Resincronizeaza contoarele existente cu numarul real de membri.
update public.circles c
set member_count = coalesce((select count(*) from public.circle_members m where m.circle_id = c.id), 0);
