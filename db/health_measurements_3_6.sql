-- Version 3.6.0: family-protected growth measurements. Applied 2026-11-10.
-- Sensitive minor health measurements: never grant access to anon.
create table if not exists public.moymir_health_measurements (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.families(id) on delete cascade,
 child_id uuid not null references auth.users(id) on delete cascade,
 created_by uuid not null default auth.uid() references auth.users(id),
 client_ref text not null,
 measured_on date not null,
 height_cm numeric(5,1) not null,
 weight_kg numeric(5,1) not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint moymir_health_measurements_height_bounds check(height_cm between 90 and 210),
 constraint moymir_health_measurements_weight_bounds check(weight_kg between 15 and 200),
 constraint moymir_health_measurements_ref_length check(length(client_ref) between 5 and 100),
 constraint moymir_health_measurements_valid_date check(measured_on between date '2020-01-01' and current_date + 1),
 unique(family_id,child_id,client_ref)
);
create index if not exists moymir_health_measurements_child_dates
 on public.moymir_health_measurements(family_id,child_id,measured_on desc);
alter table public.moymir_health_measurements enable row level security;
revoke all on public.moymir_health_measurements from anon,authenticated,public;
grant select,insert,delete on public.moymir_health_measurements to authenticated;
grant update(measured_on,height_cm,weight_kg,updated_at) on public.moymir_health_measurements to authenticated;
drop policy if exists health_family_read on public.moymir_health_measurements;
create policy health_family_read on public.moymir_health_measurements
 for select to authenticated using(
 exists(select 1 from public.family_members fm
  where fm.family_id=moymir_health_measurements.family_id
  and fm.user_id=(select auth.uid())
  and (fm.role='parent' or (fm.role='child' and moymir_health_measurements.child_id=(select auth.uid()))))
 );
drop policy if exists health_family_insert on public.moymir_health_measurements;
create policy health_family_insert on public.moymir_health_measurements
 for insert to authenticated with check(
 created_by=(select auth.uid())
 and exists(select 1 from public.family_members fm
  where fm.family_id=moymir_health_measurements.family_id
  and fm.user_id=(select auth.uid())
  and (fm.role='parent' or (fm.role='child' and moymir_health_measurements.child_id=(select auth.uid()))))
 and exists(select 1 from public.family_members c
  where c.family_id=moymir_health_measurements.family_id
  and c.user_id=moymir_health_measurements.child_id
  and c.role='child')
 );
drop policy if exists health_family_update on public.moymir_health_measurements;
create policy health_family_update on public.moymir_health_measurements
 for update to authenticated using(
 exists(select 1 from public.family_members fm
  where fm.family_id=moymir_health_measurements.family_id
  and fm.user_id=(select auth.uid())
  and (fm.role='parent' or (fm.role='child' and moymir_health_measurements.child_id=(select auth.uid()))))
 ) with check(
 exists(select 1 from public.family_members fm
  where fm.family_id=moymir_health_measurements.family_id
  and fm.user_id=(select auth.uid())
  and (fm.role='parent' or (fm.role='child' and moymir_health_measurements.child_id=(select auth.uid()))))
 );
drop policy if exists health_family_delete on public.moymir_health_measurements;
create policy health_family_delete on public.moymir_health_measurements
 for delete to authenticated using(
 exists(select 1 from public.family_members fm
  where fm.family_id=moymir_health_measurements.family_id
  and fm.user_id=(select auth.uid())
  and (fm.role='parent' or (fm.role='child' and moymir_health_measurements.child_id=(select auth.uid()))))
 );
