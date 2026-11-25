begin;
alter table public.daily_chore_templates add column if not exists penalty_enabled boolean not null default true;
alter table public.behavior_points add column if not exists chore_template_id uuid references public.daily_chore_templates(id) on delete restrict;
alter table public.behavior_points add column if not exists chore_date date;
alter table public.behavior_points drop constraint behavior_points_amount_check;
alter table public.behavior_points add constraint behavior_points_amount_check check ((chore_template_id is null and chore_date is null and amount in (5,10)) or (chore_template_id is not null and chore_date is not null and amount between 1 and 1000));
create unique index if not exists behavior_points_daily_chore_once on public.behavior_points(chore_template_id,chore_date) where chore_template_id is not null;
create schema if not exists moymir_private;
create table if not exists moymir_private.daily_penalty_plan (
 template_id uuid not null references public.daily_chore_templates(id) on delete cascade,
 activity_date date not null, family_id uuid not null, child_id uuid not null, title text not null,
 points integer not null check(points between 1 and 1000), processed boolean not null default false,
 primary key(template_id,activity_date)
);
alter table moymir_private.daily_penalty_plan enable row level security;
revoke all on moymir_private.daily_penalty_plan from public,anon,authenticated;
create or replace function public.set_daily_chore_penalty(p_id uuid,p_enabled boolean)
returns boolean language plpgsql security definer set search_path='' as $f$
declare t public.daily_chore_templates%rowtype;
begin
 select * into t from public.daily_chore_templates where id=p_id for update;
 if not found or auth.uid() is null or not public.has_family_role(t.family_id,'parent') then raise exception 'Только родитель может изменять штрафы' using errcode='42501'; end if;
 if p_enabled is null then raise exception 'Укажите режим штрафа'; end if;
 update public.daily_chore_templates set penalty_enabled=p_enabled where id=p_id;
 if not p_enabled then update moymir_private.daily_penalty_plan set processed=true where template_id=p_id and activity_date=(now() at time zone 'Europe/Madrid')::date; end if;
 return p_enabled;
end;$f$;
revoke all on function public.set_daily_chore_penalty(uuid,boolean) from public,anon;
grant execute on function public.set_daily_chore_penalty(uuid,boolean) to authenticated;
create or replace function moymir_private.process_daily_chore_penalties()
returns integer language plpgsql security definer set search_path='' as $f$
declare d date:=(now() at time zone 'Europe/Madrid')::date; rec record; n integer:=0; parent_id uuid; completion_status text;
begin
 if not pg_try_advisory_xact_lock(21403812) then return 0; end if;
 -- Capture only a new day near midnight; never reconstruct past obligations.
 if d >= date '2026-11-26' and (now() at time zone 'Europe/Madrid')::time < time '01:00' then
 insert into moymir_private.daily_penalty_plan(template_id,activity_date,family_id,child_id,title,points)
 select t.id,d,t.family_id,t.child_id,t.title,t.points from public.daily_chore_templates t
 where t.active and t.penalty_enabled and t.points>0 and extract(dow from d)::integer=any(t.weekdays)
 and t.created_at < d::timestamp at time zone 'Europe/Madrid'
 on conflict do nothing;
 end if;
 for rec in select p.* from moymir_private.daily_penalty_plan p where not p.processed and p.activity_date<d order by p.activity_date,p.template_id for update
 loop
  select status into completion_status from public.daily_chore_completions where template_id=rec.template_id and activity_date=rec.activity_date and child_id=rec.child_id;
  if completion_status='pending' then continue; end if;
  if completion_status is distinct from 'approved' and exists(select 1 from public.daily_chore_templates t where t.id=rec.template_id and t.active and t.penalty_enabled) then
   select user_id into parent_id from public.family_members where family_id=rec.family_id and role='parent' order by user_id limit 1;
   if parent_id is not null and exists(select 1 from public.family_members where family_id=rec.family_id and user_id=rec.child_id and role='child') then
    perform 1 from public.family_members where family_id=rec.family_id and user_id=rec.child_id for update;
    insert into public.behavior_points(family_id,child_id,reason,category,amount,created_by,chore_template_id,chore_date)
    values(rec.family_id,rec.child_id,'Автоштраф за невыполненное дело: '||rec.title||' ('||to_char(rec.activity_date,'DD.MM.YYYY')||')','other',rec.points,parent_id,rec.template_id,rec.activity_date)
    on conflict (chore_template_id,chore_date) where chore_template_id is not null do nothing;
    if found then n:=n+1; end if;
   end if;
  end if;
  update moymir_private.daily_penalty_plan set processed=true where template_id=rec.template_id and activity_date=rec.activity_date;
 end loop;
 return n;
end;$f$;
revoke all on function moymir_private.process_daily_chore_penalties() from public,anon,authenticated;
-- Keep existing limit of two manual discipline deductions independent of automatic chore penalties.
do $patch$ declare definition text; needle text:='where child_id=p_child and family_id=p_family and cancelled_at is null'; begin
 select pg_get_functiondef('public.add_behavior_point_deduction(uuid,uuid,text,text,integer)'::regprocedure) into definition;
 if position(needle in definition)=0 then raise exception 'Manual limit definition changed'; end if;
 execute replace(definition,needle,needle||' and chore_template_id is null');
end;$patch$;
select cron.schedule('moymir-daily-chore-penalties','*/5 * * * *','select moymir_private.process_daily_chore_penalties()');
commit;

