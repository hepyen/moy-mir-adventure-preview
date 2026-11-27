begin;
create table public.moymir_room_layouts(family_id uuid not null references public.families(id) on delete cascade,child_id uuid not null references auth.users(id) on delete cascade,world smallint not null check(world between 1 and 4),layout jsonb not null,revision integer not null default 1,updated_at timestamptz not null default now(),primary key(family_id,child_id,world));
alter table public.moymir_room_layouts enable row level security;
revoke all on public.moymir_room_layouts from public,anon,authenticated;
grant select on public.moymir_room_layouts to authenticated;
create policy room_read on public.moymir_room_layouts for select to authenticated using(public.has_family_role(family_id,'parent') or (child_id=auth.uid() and public.has_family_role(family_id,'child')));
create function public.moymir_room_save(p_family uuid,p_world integer,p_revision integer,p_layout jsonb) returns jsonb language plpgsql security definer set search_path='' as $f$
declare u uuid:=auth.uid(); prev public.moymir_room_layouts%rowtype; item jsonb; extras jsonb; n integer; bal bigint; rev integer; unlocked integer;
begin
 if u is null or not public.has_family_role(p_family,'child') then raise exception 'Child membership required' using errcode='42501';end if;
 if p_world is null or p_world not between 1 and 4 then raise exception 'Invalid world';end if;
 perform 1 from public.family_members where family_id=p_family and user_id=u and role='child' for update;
 select coalesce((select active_world from public.child_world_progress where family_id=p_family and child_id=u),1) into unlocked;
 if p_world>unlocked then raise exception 'World locked';end if;
 if p_layout is null or jsonb_typeof(p_layout)<>'object' or octet_length(p_layout::text)>12000 then raise exception 'Invalid layout';end if;
 if coalesce(p_layout->>'bed','') not in ('0','1','2') or coalesce(p_layout->>'desk','') not in ('0','1','2') or coalesce(p_layout->>'plant','') not in ('0','1','2') or coalesce(p_layout->>'finish','0') not in ('0','1','2','3','4','5') then raise exception 'Invalid base furniture';end if;
 extras:=coalesce(p_layout->'extras','[]'::jsonb);
 if jsonb_typeof(extras)<>'array' then raise exception 'Invalid extras';end if;
 if jsonb_array_length(extras)>12 then raise exception 'Too many items';end if;
 for item in select value from jsonb_array_elements(extras) loop
 if coalesce(item->>'id','') !~ '^[a-f0-9-]{36}$' or coalesce(item->>'kind','') not in ('chair','shelf','sofa','lamp','tv','cabinet','toy','aquarium') or coalesce(item->>'rotation','') not in ('0','1','2','3') or coalesce(item->>'color','') !~ '^#[0-9a-fA-F]{6}$' or coalesce(jsonb_typeof(item->'x'),'')<>'number' or coalesce(jsonb_typeof(item->'z'),'')<>'number' then raise exception 'Invalid item';end if;
 if abs((item->>'x')::numeric)>1.39 or abs((item->>'z')::numeric)>1.14 then raise exception 'Invalid position';end if;
 end loop;
 if (select count(distinct value->>'id') from jsonb_array_elements(extras))<>jsonb_array_length(extras) then raise exception 'Duplicate item';end if;
 select * into prev from public.moymir_room_layouts where family_id=p_family and child_id=u and world=p_world;
 if found then
 if prev.revision<>p_revision then raise exception 'Layout changed; reload' using errcode='40001';end if;
 if exists(select 1 from jsonb_array_elements(extras) a join jsonb_array_elements(coalesce(prev.layout->'extras','[]'::jsonb)) b on a->>'id'=b->>'id' where a->>'kind'<>b->>'kind') then raise exception 'Cannot change purchased item type';end if;
 select count(*) into n from jsonb_array_elements(extras) a where not exists(select 1 from jsonb_array_elements(coalesce(prev.layout->'extras','[]'::jsonb)) b where b->>'id'=a->>'id');
 if n>1 then raise exception 'One purchase per request';end if;
 else
 if p_revision<>0 then raise exception 'Layout changed; reload' using errcode='40001';end if;
 -- One initial import of existing local furniture, free to preserve old rooms.
 n:=0;
 end if;
 bal:=(public.moymir_family_overview(p_family,u)->>'balance')::bigint;
 if n>0 then
 if bal<n then raise exception 'Insufficient points' using errcode='22023';end if;
 insert into public.point_ledger(family_id,child_id,delta) values(p_family,u,-n);
 end if;
 insert into public.moymir_room_layouts(family_id,child_id,world,layout) values(p_family,u,p_world,p_layout) on conflict(family_id,child_id,world) do update set layout=excluded.layout,revision=moymir_room_layouts.revision+1,updated_at=now() returning revision into rev;
 return jsonb_build_object('revision',rev,'balance',bal-n,'layout',p_layout);
end;$f$;
revoke all on function public.moymir_room_save(uuid,integer,integer,jsonb) from public,anon,authenticated;
grant execute on function public.moymir_room_save(uuid,integer,integer,jsonb) to authenticated;
create table public.moymir_journey_collection(family_id uuid not null references public.families(id) on delete cascade,child_id uuid not null references auth.users(id) on delete cascade,solved integer[] not null default '{}',souvenirs text[] not null default '{}',primary key(family_id,child_id));
alter table public.moymir_journey_collection enable row level security;
revoke all on public.moymir_journey_collection from public,anon,authenticated;
grant select on public.moymir_journey_collection to authenticated;
create policy journey_read on public.moymir_journey_collection for select to authenticated using(public.has_family_role(family_id,'parent') or(child_id=auth.uid() and public.has_family_role(family_id,'child')));
create function public.moymir_journey_action(p_family uuid,p_stop integer default null,p_answer text default null,p_reward text default null) returns jsonb language plpgsql security definer set search_path='' as $f$
declare u uuid:=auth.uid(); s integer[]; r text[]; cost int; bal int; answers text[]:=array['Пригласила Павла и его спутников к себе домой','Приводил доводы из Писания','Каждый день проверяли услышанное по Писанию','В Ареопаге','С Акилой и Прискиллой'];
begin
 if u is null or not public.has_family_role(p_family,'child') then raise exception 'Child membership required' using errcode='42501';end if;
 perform 1 from public.family_members where family_id=p_family and user_id=u and role='child' for update;
 insert into public.moymir_journey_collection(family_id,child_id) values(p_family,u) on conflict do nothing;
 select solved,souvenirs into s,r from public.moymir_journey_collection where family_id=p_family and child_id=u for update;
 if p_stop is not null and p_reward is null then
 if p_stop not between 0 and 4 or p_answer is distinct from answers[p_stop+1] then raise exception 'Incorrect answer' using errcode='22023';end if;
 if not(p_stop=any(s)) then s:=array_append(s,p_stop);end if;
 elsif p_reward is not null and p_stop is null then
 cost:=case p_reward when 'scroll' then 2 when 'ship' then 3 when 'lamp' then 4 else null end;
 if cost is null then raise exception 'Unknown souvenir';end if;
 bal:=cardinality(s)*2-(case when 'scroll'=any(r) then 2 else 0 end+case when 'ship'=any(r) then 3 else 0 end+case when 'lamp'=any(r) then 4 else 0 end);
 if not(p_reward=any(r)) then if bal<cost then raise exception 'Insufficient tokens' using errcode='22023';end if;r:=array_append(r,p_reward);end if;
 else raise exception 'Invalid action';end if;
 update public.moymir_journey_collection set solved=s,souvenirs=r where family_id=p_family and child_id=u;
 return jsonb_build_object('solved',s,'souvenirs',r);
end;$f$;
revoke all on function public.moymir_journey_action(uuid,integer,text,text) from public,anon,authenticated;
grant execute on function public.moymir_journey_action(uuid,integer,text,text) to authenticated;
commit;
