begin;
alter table public.child_world_progress drop constraint child_world_progress_active_world_check;
alter table public.child_world_progress add constraint child_world_progress_active_world_check check(active_world between 1 and 4);
create or replace function public.advance_my_world_stage(p_family uuid,p_expected integer)
returns integer language plpgsql security definer set search_path='' as $f$
declare u uuid:=auth.uid(); w integer; earned bigint;
begin
 if u is null or not exists(select 1 from public.family_members where family_id=p_family and user_id=u and role='child') then raise exception 'Child membership required' using errcode='42501';end if;
 if p_expected is null or p_expected not in (1,2,3) then raise exception 'Invalid stage' using errcode='22023';end if;
 insert into public.child_world_progress(family_id,child_id,active_world) values(p_family,u,1) on conflict do nothing;
 select active_world into w from public.child_world_progress where family_id=p_family and child_id=u for update;
 if w>p_expected then return w;end if;
 if w<>p_expected then raise exception 'Complete previous world first' using errcode='22023';end if;
 earned:=(public.moymir_family_overview(p_family,u)->>'worldPoints')::bigint;
 if earned is null or earned<1600*p_expected then raise exception 'Not enough world points' using errcode='22023';end if;
 update public.child_world_progress set active_world=w+1,updated_at=now() where family_id=p_family and child_id=u;
 return w+1;
end;$f$;
revoke all on function public.advance_my_world_stage(uuid,integer) from public,anon;
grant execute on function public.advance_my_world_stage(uuid,integer) to authenticated;
commit;
