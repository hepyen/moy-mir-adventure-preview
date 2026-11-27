begin;
create table public.moymir_room_purchases(id uuid primary key default gen_random_uuid(),family_id uuid not null references public.families(id) on delete cascade,child_id uuid not null references auth.users(id) on delete cascade,world smallint not null check(world between 1 and 4),cost integer not null check(cost=1),created_at timestamptz not null default now());
alter table public.moymir_room_purchases enable row level security;
revoke all on public.moymir_room_purchases from public,anon,authenticated;
grant select on public.moymir_room_purchases to authenticated;
create policy room_purchases_read on public.moymir_room_purchases for select to authenticated using(public.has_family_role(family_id,'parent') or(child_id=auth.uid() and public.has_family_role(family_id,'child')));
create index moymir_room_purchases_family_child on public.moymir_room_purchases(family_id,child_id);
do $patch$
declare d text; marker text;
begin
select pg_get_functiondef('public.moymir_room_save(uuid,integer,integer,jsonb)'::regprocedure) into d;
marker:='insert into public.point_ledger(family_id,child_id,delta) values(p_family,u,-n);';
if strpos(d,marker)=0 then raise exception 'Room save changed';end if;
execute replace(d,marker,'insert into public.moymir_room_purchases(family_id,child_id,world,cost) values(p_family,u,p_world,1);');
select pg_get_functiondef('public.moymir_family_overview(uuid,uuid)'::regprocedure) into d;
marker:='select coalesce(sum(amount),0) into v_deducted';
if strpos(d,marker)=0 then raise exception 'Overview changed';end if;
execute replace(d,marker,'v_debit:=v_debit+(select coalesce(sum(cost),0) from public.moymir_room_purchases where family_id=p_family and child_id=p_child);'||chr(10)||marker);
select pg_get_functiondef('public.review_reward(uuid,boolean)'::regprocedure) into d;
marker:='select coalesce(sum(amount),0) into v_deducted';
if strpos(d,marker)=0 then raise exception 'Reward review changed';end if;
execute replace(d,marker,'v_debit:=v_debit+(select coalesce(sum(cost),0) from public.moymir_room_purchases where family_id=v_request.family_id and child_id=v_request.child_id);'||chr(10)||marker);
end;$patch$;
commit;
