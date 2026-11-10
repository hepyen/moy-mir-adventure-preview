-- Schema snapshot for health 3.8.0.
-- Already applied using Supabase SQL on 2026-11-10. Keep for disaster recovery.
-- Existing schema public.families, public.family_members, auth.users required.
create table if not exists public.moymir_health_plan(
 family_id uuid not null references public.families(id) on delete cascade,
 child_id uuid not null references auth.users(id) on delete cascade,
 meals jsonb not null default '[]'::jsonb,
 bed_time time not null default '21:00',
 wake_time time not null default '06:45',
 allergies text[] not null default '{}',
 notes text not null default '',
 updated_at timestamptz not null default now(),
 primary key(family_id,child_id),
 constraint meals_are_week check(jsonb_typeof(meals)='array' and jsonb_array_length(meals)<=7),
 constraint notes_size check(length(notes)<=1000)
);
create table if not exists public.moymir_health_daily(
 family_id uuid not null references public.families(id) on delete cascade,
 child_id uuid not null references auth.users(id) on delete cascade,
 activity_date date not null,
 habits text[] not null default '{}',
 mood text not null default '',
 energy text not null default '',
 sleep_quality text not null default '',
 updated_at timestamptz not null default now(),
 primary key(family_id,child_id,activity_date),
 constraint habits_count check(cardinality(habits)<=8),
 constraint valid_mood check(mood in ('','good','ok','rest')),
 constraint valid_energy check(energy in ('','high','normal','low')),
 constraint valid_sleep_quality check(sleep_quality in ('','great','ok','poor')),
 constraint date_bounds check(activity_date between date '2024-01-01' and current_date+1)
);
create table if not exists public.moymir_health_garden(
 family_id uuid not null references public.families(id) on delete cascade,
 child_id uuid not null references auth.users(id) on delete cascade,
 placements jsonb not null default '[]'::jsonb,
 updated_at timestamptz not null default now(),
 primary key(family_id,child_id),
 constraint garden_is_array check(jsonb_typeof(placements)='array' and jsonb_array_length(placements)<=36)
);
create table if not exists public.moymir_health_meal_requests(
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.families(id) on delete cascade,
 child_id uuid not null references auth.users(id) on delete cascade,
 proposed_by uuid not null default auth.uid() references auth.users(id),
 weekday int not null check(weekday between 0 and 6),
 meal_kind text not null check(meal_kind in ('breakfast','lunch','dinner','snack')),
 suggestion text not null check(length(suggestion) between 2 and 160),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 created_at timestamptz not null default now(),
 resolved_at timestamptz,
 unique(family_id,child_id,weekday,meal_kind,suggestion)
);
create index if not exists moymir_health_requests_lookup
 on public.moymir_health_meal_requests(family_id,child_id,status,created_at desc);
do $$
declare tab text;
begin
 foreach tab in array array['moymir_health_plan','moymir_health_daily','moymir_health_garden','moymir_health_meal_requests']
 loop
  execute format('alter table public.%I enable row level security',tab);
  execute format('revoke all on public.%I from public,anon,authenticated',tab);
  execute format('grant select,insert,update on public.%I to authenticated',tab);
  execute format('drop policy if exists health_read on public.%I',tab);
  execute format($p$create policy health_read on public.%I for select to authenticated using (
   exists(select 1 from public.family_members f where f.family_id=%I.family_id
      and f.user_id=(select auth.uid())
      and (f.role='parent' or (f.role='child' and %I.child_id=(select auth.uid()))))
  )$p$,tab,tab,tab);
  execute format('drop policy if exists health_insert on public.%I',tab);
  execute format('drop policy if exists health_update on public.%I',tab);
 end loop;
end $$;
create policy health_insert on public.moymir_health_plan for insert to authenticated with check(
 exists(select 1 from public.family_members f where f.family_id=moymir_health_plan.family_id
 and f.user_id=(select auth.uid()) and f.role='parent')
 and exists(select 1 from public.family_members c where c.family_id=moymir_health_plan.family_id
 and c.user_id=moymir_health_plan.child_id and c.role='child')
);
create policy health_update on public.moymir_health_plan for update to authenticated using(
 exists(select 1 from public.family_members f where f.family_id=moymir_health_plan.family_id
 and f.user_id=(select auth.uid()) and f.role='parent')
) with check(
 exists(select 1 from public.family_members f where f.family_id=moymir_health_plan.family_id
 and f.user_id=(select auth.uid()) and f.role='parent')
);
create policy health_insert on public.moymir_health_daily for insert to authenticated with check(
 exists(select 1 from public.family_members f where f.family_id=moymir_health_daily.family_id
 and f.user_id=(select auth.uid()) and (f.role='parent' or (f.role='child' and moymir_health_daily.child_id=(select auth.uid()))))
 and exists(select 1 from public.family_members c where c.family_id=moymir_health_daily.family_id
 and c.user_id=moymir_health_daily.child_id and c.role='child')
);
create policy health_update on public.moymir_health_daily for update to authenticated using(
 exists(select 1 from public.family_members f where f.family_id=moymir_health_daily.family_id
 and f.user_id=(select auth.uid()) and (f.role='parent' or (f.role='child' and moymir_health_daily.child_id=(select auth.uid()))))
) with check(
 exists(select 1 from public.family_members f where f.family_id=moymir_health_daily.family_id
 and f.user_id=(select auth.uid()) and (f.role='parent' or (f.role='child' and moymir_health_daily.child_id=(select auth.uid()))))
);
create policy health_insert on public.moymir_health_garden for insert to authenticated with check(
 exists(select 1 from public.family_members f where f.family_id=moymir_health_garden.family_id
 and f.user_id=(select auth.uid()) and (f.role='parent' or (f.role='child' and moymir_health_garden.child_id=(select auth.uid()))))
 and exists(select 1 from public.family_members c where c.family_id=moymir_health_garden.family_id
 and c.user_id=moymir_health_garden.child_id and c.role='child')
);
create policy health_update on public.moymir_health_garden for update to authenticated using(
 exists(select 1 from public.family_members f where f.family_id=moymir_health_garden.family_id
 and f.user_id=(select auth.uid()) and (f.role='parent' or (f.role='child' and moymir_health_garden.child_id=(select auth.uid()))))
) with check(
 exists(select 1 from public.family_members f where f.family_id=moymir_health_garden.family_id
 and f.user_id=(select auth.uid()) and (f.role='parent' or (f.role='child' and moymir_health_garden.child_id=(select auth.uid()))))
);
create policy health_insert on public.moymir_health_meal_requests for insert to authenticated with check(
 proposed_by=(select auth.uid()) and status='pending' and resolved_at is null and
 exists(select 1 from public.family_members f where f.family_id=moymir_health_meal_requests.family_id
 and f.user_id=(select auth.uid()) and (f.role='parent' or (f.role='child' and moymir_health_meal_requests.child_id=(select auth.uid()))))
 and exists(select 1 from public.family_members c where c.family_id=moymir_health_meal_requests.family_id
 and c.user_id=moymir_health_meal_requests.child_id and c.role='child')
);
create policy health_update on public.moymir_health_meal_requests for update to authenticated using(
 exists(select 1 from public.family_members f where f.family_id=moymir_health_meal_requests.family_id
 and f.user_id=(select auth.uid()) and f.role='parent')
) with check(
 exists(select 1 from public.family_members f where f.family_id=moymir_health_meal_requests.family_id
 and f.user_id=(select auth.uid()) and f.role='parent')
);
revoke update on public.moymir_health_meal_requests from authenticated;
grant update(status,resolved_at) on public.moymir_health_meal_requests to authenticated;
