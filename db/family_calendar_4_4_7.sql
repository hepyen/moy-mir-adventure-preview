begin;
create table public.moymir_family_calendar (
 id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id) on delete cascade, created_by uuid not null default auth.uid() references auth.users(id), title text not null check(char_length(btrim(title)) between 1 and 120), event_date date not null, event_time time, category text not null check(category in ('school','family','task','other')), note text not null default '' check(char_length(note)<=500), created_at timestamptz not null default now()
);
create index moymir_family_calendar_day on public.moymir_family_calendar(family_id,event_date);
alter table public.moymir_family_calendar enable row level security;
revoke all on public.moymir_family_calendar from public,anon,authenticated;
grant select,insert,delete on public.moymir_family_calendar to authenticated;
grant update(title,event_date,event_time,category,note) on public.moymir_family_calendar to authenticated;
create policy calendar_read on public.moymir_family_calendar for select to authenticated using (public.has_family_role(family_id,'parent') or public.has_family_role(family_id,'child'));
create policy calendar_insert on public.moymir_family_calendar for insert to authenticated with check (public.has_family_role(family_id,'parent') and created_by=(select auth.uid()));
create policy calendar_edit on public.moymir_family_calendar for update to authenticated using(public.has_family_role(family_id,'parent')) with check(public.has_family_role(family_id,'parent'));
create policy calendar_delete on public.moymir_family_calendar for delete to authenticated using(public.has_family_role(family_id,'parent'));
commit;
