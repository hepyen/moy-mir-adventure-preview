alter table public.moymir_english_sessions
 add column if not exists active_seconds integer not null default 0 check(active_seconds between 0 and 36000);
alter table public.moymir_english_sessions
 add column if not exists last_heartbeat_at timestamptz;

create or replace function public.moymir_study_heartbeat(p_session uuid)
returns jsonb language plpgsql security definer set search_path='' as $heartbeat$
declare
 v_user uuid:=(select auth.uid());
 v_session public.moymir_english_sessions%rowtype;
 v_now timestamptz:=clock_timestamp();
 v_delta integer:=0;
 v_next integer;
begin
 if v_user is null then raise exception 'Login required' using errcode='42501';end if;
 select * into v_session from public.moymir_english_sessions s
 where s.id=p_session and s.child_id=v_user and s.status='in_progress'
  and s.lesson_key like 'eng2:%'
 for update;
 if not found then raise exception 'Active study session not found' using errcode='42501';end if;
 if not exists(select 1 from public.family_members m where m.family_id=v_session.family_id
   and m.user_id=v_user and m.role='child') then
   raise exception 'Access denied' using errcode='42501';
 end if;
 if v_session.last_heartbeat_at is not null then
  v_delta:=floor(extract(epoch from (v_now-v_session.last_heartbeat_at)))::integer;
  if v_delta<1 or v_delta>20 then v_delta:=0;end if;
 end if;
 v_next:=least(36000,v_session.active_seconds+v_delta);
 update public.moymir_english_sessions
  set active_seconds=v_next,last_heartbeat_at=v_now
  where id=v_session.id;
 return jsonb_build_object('active_seconds',v_next,'required_seconds',900,'status','active');
end;$heartbeat$;
revoke all on function public.moymir_study_heartbeat(uuid) from public,anon;
grant execute on function public.moymir_study_heartbeat(uuid) to authenticated;

do $patch$
declare def text;
begin
 select pg_get_functiondef('public.moymir_english_finish(uuid,jsonb)'::regprocedure) into def;
 if position($marker$if v_session.lesson_key like 'eng2:%' and v_session.active_seconds<900 then$marker$ in def)>0 then return;end if;
 if position($old$v_elapsed:=floor(extract(epoch from (now()-v_session.started_at)))::integer;$old$ in def)=0 then
  raise exception 'Lesson finish function differs from inspected version: stop migration';
 end if;
 def:=replace(def,
 $old$v_elapsed:=floor(extract(epoch from (now()-v_session.started_at)))::integer;$old$,
 $new$v_elapsed:=floor(extract(epoch from (now()-v_session.started_at)))::integer;
 if v_session.lesson_key like 'eng2:%' and v_session.active_seconds<900 then
  return jsonb_build_object('status','waiting','remaining_seconds',900-v_session.active_seconds,'score',v_score,'total',v_total);
 end if;$new$);
 execute def;
end;$patch$;
