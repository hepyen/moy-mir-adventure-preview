begin;
create table if not exists moymir_private.remote_wake_requests(
 id uuid primary key default gen_random_uuid(), family_id uuid not null references public.families(id) on delete cascade,
 child_id uuid not null references auth.users(id) on delete cascade, parent_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '90 seconds',
 received_at timestamptz, awake_at timestamptz, cancelled_at timestamptz);
alter table moymir_private.remote_wake_requests enable row level security;
revoke all on moymir_private.remote_wake_requests from public,anon,authenticated;
create index if not exists remote_wake_recent on moymir_private.remote_wake_requests(family_id,child_id,created_at desc);
create or replace function public.moymir_wake_send(p_family uuid,p_child uuid) returns uuid language plpgsql security definer set search_path='' as $f$
declare v uuid;
begin
 if auth.uid() is null or not public.has_family_role(p_family,'parent') or not exists(select 1 from public.family_members where family_id=p_family and user_id=p_child and role='child') then raise exception 'Только родитель своей семьи' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_child::text,0));
 if exists(select 1 from moymir_private.remote_wake_requests where family_id=p_family and child_id=p_child and created_at>now()-interval '2 minutes') then raise exception 'Повтори не раньше чем через две минуты';end if;
 insert into moymir_private.remote_wake_requests(family_id,child_id,parent_id) values(p_family,p_child,auth.uid()) returning id into v; return v;
end;$f$;
create or replace function public.moymir_wake_status(p_family uuid,p_child uuid) returns jsonb language plpgsql security definer set search_path='' as $f$
begin
 if auth.uid() is null or not public.has_family_role(p_family,'parent') or not exists(select 1 from public.family_members where family_id=p_family and user_id=p_child and role='child') then raise exception 'Parent only' using errcode='42501';end if;
 return (select jsonb_build_object('id',id,'created_at',created_at,'state',case when awake_at is not null then 'awake' when cancelled_at is not null then 'cancelled' when received_at is not null then 'received' when expires_at<=now() then 'expired' else 'sent' end) from moymir_private.remote_wake_requests where family_id=p_family and child_id=p_child and created_at>now()-interval '1 day' order by created_at desc limit 1);
end;$f$;
create or replace function public.moymir_wake_claim(p_family uuid) returns uuid language plpgsql security definer set search_path='' as $f$
declare v uuid;
begin
 if auth.uid() is null or not public.has_family_role(p_family,'child') then raise exception 'Child only' using errcode='42501'; end if;
 select id into v from moymir_private.remote_wake_requests where family_id=p_family and child_id=auth.uid() and expires_at>now() and received_at is null and cancelled_at is null order by created_at desc limit 1 for update skip locked;
 if v is not null then update moymir_private.remote_wake_requests set received_at=now() where id=v;end if; return v;
end;$f$;
create or replace function public.moymir_wake_reply(p_id uuid) returns boolean language plpgsql security definer set search_path='' as $f$
begin
 update moymir_private.remote_wake_requests r set awake_at=now() where r.id=p_id and r.child_id=auth.uid() and public.has_family_role(r.family_id,'child') and received_at is not null and awake_at is null and cancelled_at is null and received_at>now()-interval '10 minutes';
 return found;
end;$f$;
revoke all on function public.moymir_wake_send(uuid,uuid),public.moymir_wake_status(uuid,uuid),public.moymir_wake_claim(uuid),public.moymir_wake_reply(uuid) from public,anon;
grant execute on function public.moymir_wake_send(uuid,uuid),public.moymir_wake_status(uuid,uuid),public.moymir_wake_claim(uuid),public.moymir_wake_reply(uuid) to authenticated;
commit;
