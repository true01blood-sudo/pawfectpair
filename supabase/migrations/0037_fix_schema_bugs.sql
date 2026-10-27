-- Fix 1: rename next_due_date → due_date in medical_records
alter table public.medical_records
  rename column next_due_date to due_date;

-- Fix 2: add passed column to pet_likes
alter table public.pet_likes
  add column if not exists passed boolean not null default false;

-- Fix 3: rename logged_at → measured_at in weight_logs
alter table public.weight_logs
  rename column logged_at to measured_at;
