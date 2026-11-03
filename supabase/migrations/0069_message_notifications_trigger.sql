-- ──────────────────────────────────────────
-- 0069: notificare automată la mesaj nou in chat.
--
-- Raport user: "notificari daca am primit vreun mesaj - nu mai apar
-- chiar daca am ceva mesaje noi sau in chat."
--
-- Cauza: public.notifications exista si e citit peste tot (badge-ul de
-- clopotel, AppShell.tsx pe web), dar NIMIC nu scria vreodata in ea
-- pentru un mesaj nou — singurul loc din tot codul care apela
-- create_notification() era alerta SOS (sos/actions.ts). Trimiterea
-- unui mesaj (messages insert, mobile si web) nu a creat niciodata o
-- notificare pentru celalalt participant la conversatie.
--
-- Fix: trigger pe public.messages — la fiecare insert, creeaza o
-- notificare pentru participantul care NU a trimis mesajul (afla
-- user_a_id/user_b_id direct din matches, acelasi pattern ca RLS-ul
-- existent pe messages). SECURITY DEFINER + search_path fix, la fel ca
-- handle_pet_like() — nu trece prin create_notification() (care cere
-- auth.uid() = destinatarul), fiindca aici destinatarul e mereu
-- CEALALTA persoana, nu apelantul.
-- ──────────────────────────────────────────

create or replace function public.handle_new_message_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_id uuid;
  preview text;
begin
  select case when m.user_a_id = new.sender_id then m.user_b_id else m.user_a_id end
  into recipient_id
  from public.matches m
  where m.id = new.match_id;

  if recipient_id is null then
    return new;
  end if;

  preview := left(new.body, 120);

  insert into public.notifications (user_id, type, title, body, link)
  values (recipient_id, 'social', 'Mesaj nou', preview, '/comunitate/mesaje/' || new.match_id::text);

  return new;
end;
$$;

drop trigger if exists on_message_created_notify on public.messages;
create trigger on_message_created_notify
  after insert on public.messages
  for each row execute procedure public.handle_new_message_notification();
