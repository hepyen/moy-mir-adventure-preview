begin;
create table public.moymir_miro_wardrobe(family_id uuid not null references public.families(id) on delete cascade,child_id uuid not null references auth.users(id) on delete cascade,skin text not null default 'skin-classic',accessory text not null default 'acc-none',paint text not null default 'paint-original',owned text[] not null default '{}',primary key(family_id,child_id));
create table public.moymir_miro_purchases(family_id uuid not null references public.families(id) on delete cascade,child_id uuid not null references auth.users(id) on delete cascade,item text not null,cost integer not null check(cost between 1 and 10),created_at timestamptz not null default now(),primary key(family_id,child_id,item));
alter table public.moymir_miro_wardrobe enable row level security;
alter table public.moymir_miro_purchases enable row level security;
revoke all on public.moymir_miro_wardrobe,public.moymir_miro_purchases from public,anon,authenticated;
grant select on public.moymir_miro_wardrobe,public.moymir_miro_purchases to authenticated;
create policy miro_wardrobe_read on public.moymir_miro_wardrobe for select to authenticated using(public.has_family_role(family_id,'parent') or(child_id=auth.uid() and public.has_family_role(family_id,'child')));
create policy miro_purchases_read on public.moymir_miro_purchases for select to authenticated using(public.has_family_role(family_id,'parent') or(child_id=auth.uid() and public.has_family_role(family_id,'child')));
create function public.moymir_miro_equip(p_family uuid,p_item text,p_buy boolean default false) returns jsonb language plpgsql security definer set search_path='' as $f$
declare u uuid:=auth.uid(); w public.moymir_miro_wardrobe%rowtype; price int; bal bigint;
begin
 if u is null or not public.has_family_role(p_family,'child') then raise exception 'Child membership required' using errcode='42501';end if;
 price:=case p_item when 'skin-classic' then 0 when 'skin-spider' then 6 when 'skin-rabbit' then 5 when 'skin-astro' then 6 when 'skin-diver' then 5 when 'skin-explorer' then 4 when 'skin-dragon' then 8 when 'acc-none' then 0 when 'acc-wings' then 3 when 'acc-headphones' then 2 when 'acc-antenna' then 2 when 'acc-pack' then 3 when 'paint-original' then 0 when 'paint-mint' then 1 when 'paint-rose' then 1 when 'paint-gold' then 2 when 'paint-violet' then 1 when 'paint-blue' then 1 else null end;
 if price is null or p_buy is null then raise exception 'Unknown item' using errcode='22023';end if;
 perform 1 from public.family_members where family_id=p_family and user_id=u and role='child' for update;
 if not found then raise exception 'Child membership missing' using errcode='42501';end if;
 insert into public.moymir_miro_wardrobe(family_id,child_id) values(p_family,u) on conflict do nothing;
 select * into w from public.moymir_miro_wardrobe where family_id=p_family and child_id=u for update;
 if price>0 and not(p_item=any(w.owned)) then
  if not p_buy then raise exception 'Purchase required' using errcode='22023';end if;
  bal:=(public.moymir_family_overview(p_family,u)->>'balance')::bigint;
  if bal<price then raise exception 'Insufficient points' using errcode='22023';end if;
  insert into public.moymir_miro_purchases(family_id,child_id,item,cost) values(p_family,u,p_item,price);
  w.owned:=array_append(w.owned,p_item);
 end if;
 if p_item like 'skin-%' then w.skin:=p_item;elsif p_item like 'acc-%' then w.accessory:=p_item;else w.paint:=p_item;end if;
 update public.moymir_miro_wardrobe set skin=w.skin,accessory=w.accessory,paint=w.paint,owned=w.owned where family_id=p_family and child_id=u;
 return jsonb_build_object('skin',w.skin,'accessory',w.accessory,'paint',w.paint,'owned',w.owned);
end;$f$;
revoke all on function public.moymir_miro_equip(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.moymir_miro_equip(uuid,text,boolean) to authenticated;
do $patch$ declare d text; m text;begin
 select pg_get_functiondef('public.moymir_family_overview(uuid,uuid)'::regprocedure) into d;
 m:='v_debit:=v_debit+(select coalesce(sum(cost),0) from public.moymir_room_purchases where family_id=p_family and child_id=p_child);';
 if strpos(d,m)=0 then raise exception 'Overview changed';end if;
 execute replace(d,m,m||chr(10)||'v_debit:=v_debit+(select coalesce(sum(cost),0) from public.moymir_miro_purchases where family_id=p_family and child_id=p_child);');
 select pg_get_functiondef('public.review_reward(uuid,boolean)'::regprocedure) into d;
 m:='v_debit:=v_debit+(select coalesce(sum(cost),0) from public.moymir_room_purchases where family_id=v_request.family_id and child_id=v_request.child_id);';
 if strpos(d,m)=0 then raise exception 'Reward review changed';end if;
 execute replace(d,m,m||chr(10)||'v_debit:=v_debit+(select coalesce(sum(cost),0) from public.moymir_miro_purchases where family_id=v_request.family_id and child_id=v_request.child_id);');
end;$patch$;
commit;
