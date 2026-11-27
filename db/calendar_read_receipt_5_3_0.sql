begin;
alter table public.moymir_family_calendar add column revision integer not null default 1;
create function public.moymir_calendar_revision() returns trigger language plpgsql set search_path='' as $$begin if (new.title,new.event_date,new.event_time,new.category,new.note) is distinct from (old.title,old.event_date,old.event_time,old.category,old.note) then new.revision:=old.revision+1;end if;return new;end;$$;
create trigger calendar_revision before update on public.moymir_family_calendar for each row execute function public.moymir_calendar_revision();
revoke execute on function public.moymir_calendar_revision() from public,anon,authenticated;
create table public.moymir_calendar_read (
 event_id uuid not null references public.moymir_family_calendar(id) on delete cascade, child_id uuid not null default auth.uid() references auth.users(id) on delete cascade, revision integer not null check(revision>0), read_at timestamptz not null default now(), primary key(event_id,child_id,revision)
);
alter table public.moymir_calendar_read enable row level security;
revoke all on public.moymir_calendar_read from public,anon,authenticated;
grant select on public.moymir_calendar_read to authenticated;
grant insert(event_id,revision) on public.moymir_calendar_read to authenticated;
create policy calendar_receipt_read on public.moymir_calendar_read for select to authenticated using(exists(select 1 from public.moymir_family_calendar e where e.id=event_id and (public.has_family_role(e.family_id,'parent') or (child_id=auth.uid() and public.has_family_role(e.family_id,'child')))));
create policy calendar_receipt_insert on public.moymir_calendar_read for insert to authenticated with check(child_id=auth.uid() and exists(select 1 from public.moymir_family_calendar e where e.id=event_id and e.revision=moymir_calendar_read.revision and public.has_family_role(e.family_id,'child')));
commit;
