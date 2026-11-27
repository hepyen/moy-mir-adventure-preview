begin;
create function public.moymir_miro_bundle(p_family uuid,p_bundle text,p_buy boolean default false) returns jsonb language plpgsql security definer set search_path='' as $f$
declare u uuid:=auth.uid(); items text[]; item text; result jsonb;
begin
 if u is null or not public.has_family_role(p_family,'child') then raise exception 'Child membership required' using errcode='42501';end if;
 if p_buy is null then raise exception 'Invalid purchase';end if;
 items:=case p_bundle when 'scout' then array['skin-vector','acc-none','paint-steel','visor-none','optics-cyan','armor-none','trim-default']
when 'ranger' then array['skin-vector','acc-beacon','paint-forest','visor-none','optics-green','armor-ranger','trim-black']
when 'engineer' then array['skin-titan','acc-toolkit','paint-graphite','visor-pilot','optics-amber','armor-tech','trim-orange']
when 'arctic' then array['skin-vector','acc-radar','paint-white','visor-hex','optics-dual','armor-shoulder','trim-cyan']
when 'nebula' then array['skin-atlas','acc-jet','paint-navy','visor-scanner','optics-tri','armor-tech','trim-cyan']
when 'phantom' then array['skin-sentinel','acc-radar','paint-black','visor-stealth','optics-red','armor-heavy','trim-steel']
when 'aurum' then array['skin-sentinel','acc-jet','paint-graphite','visor-hex','optics-tri','armor-shield','trim-gold']
when 'nova' then array['skin-atlas','acc-jet','paint-silver','visor-scanner','optics-dual','armor-heavy','trim-gold'] else null end;
 if items is null then raise exception 'Unknown bundle' using errcode='22023';end if;
 perform 1 from public.family_members where family_id=p_family and user_id=u and role='child' for update;
 if not found then raise exception 'Membership missing' using errcode='42501';end if;
 -- All seven calls run in one transaction. Any insufficient balance rolls back the whole set.
 foreach item in array items loop
 result:=public.moymir_miro_equip(p_family,item,p_buy);
 end loop;
 return result;
end;$f$;
revoke all on function public.moymir_miro_bundle(uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.moymir_miro_bundle(uuid,text,boolean) to authenticated;
commit;
