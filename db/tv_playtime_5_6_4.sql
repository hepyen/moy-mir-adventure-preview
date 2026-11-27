begin;
alter table public.moymir_playtime_sessions add column tv_controlled boolean not null default false;
create function public.moymir_playtime_decide(p_id uuid,p_minutes integer,p_start_tv boolean default false) returns jsonb language plpgsql security definer set search_path='' as $f$
declare r public.moymir_playtime_sessions%rowtype; o jsonb; started timestamptz;
begin
 if auth.uid() is null or p_start_tv is null then raise exception 'Parent only' using errcode='42501';end if;
 select * into r from public.moymir_playtime_sessions where id=p_id for update;
 if not found or not public.has_family_role(r.family_id,'parent') then raise exception 'Parent only' using errcode='42501';end if;
 if r.status<>'pending' or p_minutes is null or p_minutes not between 10 and 60 or p_minutes%10<>0 then raise exception 'Invalid or already reviewed request' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(r.child_id::text||':play',0));
 o:=public.moymir_playtime_overview(r.family_id,r.child_id);
 if p_minutes>(o->>'balance')::int or p_minutes+(o->>'todayUsed')::int>(o->>'dailyLimit')::int then raise exception 'Недостаточно минут или превышен дневной предел' using errcode='22023';end if;
 if p_start_tv then started:=clock_timestamp();end if;
 update public.moymir_playtime_sessions set minutes=p_minutes,status=case when p_start_tv then 'active' else 'approved' end,reviewed_by=auth.uid(),reviewed_at=now(),started_at=started,tv_controlled=p_start_tv where id=p_id;
 return jsonb_build_object('id',p_id,'minutes',p_minutes,'started_at',started,'ends_at',started+p_minutes*interval '1 minute');
end;$f$;
revoke all on function public.moymir_playtime_decide(uuid,integer,boolean) from public,anon,authenticated;
grant execute on function public.moymir_playtime_decide(uuid,integer,boolean) to authenticated;
commit;
