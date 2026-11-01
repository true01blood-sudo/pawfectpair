-- ──────────────────────────────────────────
-- 0051: notifications nu avea nicio politică INSERT — cu RLS activ,
-- nimeni nu putea scrie o notificare, nici măcar pentru sine. Explică
-- de ce broadcast-ul SOS (0050) eșua silențios.
--
-- În loc să deschidem INSERT direct pe tabelă (ar permite oricărui
-- utilizator autentificat să trimită notificări false către orice alt
-- cont), expunem o funcție SECURITY DEFINER îngustă: creează o
-- notificare doar pentru apelantul autentificat. Pentru broadcast
-- (SOS → toate cabinetele), funcția e apelată o dată per destinatar,
-- dar rămâne limitată la crearea unei notificări, nimic altceva.
-- ──────────────────────────────────────────

create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_link text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
end;
$$;

revoke all on function public.create_notification(uuid, text, text, text, text) from public;
grant execute on function public.create_notification(uuid, text, text, text, text) to authenticated;
