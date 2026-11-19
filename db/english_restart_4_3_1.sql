begin;
alter table public.moymir_english_sessions drop constraint moymir_english_sessions_status_check;
alter table public.moymir_english_sessions add constraint moymir_english_sessions_status_check
 check(status in ('in_progress','completed','abandoned'));
alter table public.moymir_english_sessions drop constraint english_session_state_check;
alter table public.moymir_english_sessions add constraint english_session_state_check check(
 (status='in_progress' and finished_at is null and points_awarded=0) or
 (status='completed' and finished_at is not null and score is not null) or
 (status='abandoned' and finished_at is not null and points_awarded=0 and score is null)
);
create or replace function public.moymir_english_restart(p_lesson text)
returns jsonb language plpgsql security definer set search_path='' as $restart$
declare
 v_user uuid:=(select auth.uid());
 v_family uuid;
 v_count integer;
 v_total integer;
 v_old uuid;
 v_next public.moymir_english_sessions%rowtype;
begin
 if v_user is null then raise exception 'Log in to restart a lesson' using errcode='42501';end if;
 select m.family_id into v_family from public.family_members m where m.user_id=v_user and m.role='child' limit 1;
 if v_family is null then raise exception 'Only the child can restart a lesson' using errcode='42501';end if;
 select cardinality(k.answer_keys) into v_total from moymir_private.english_answer_keys k where k.lesson_key=p_lesson;
 if v_total is null then raise exception 'Unknown English lesson' using errcode='22023';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('restart:'||v_user::text||':'||p_lesson,0));
 select s.id into v_old from public.moymir_english_sessions s
  where s.child_id=v_user and s.family_id=v_family and s.lesson_key=p_lesson and s.status='in_progress'
  and s.activity_day=(now() at time zone 'Europe/Madrid')::date
  order by s.started_at desc limit 1 for update;
 select count(*) into v_count from public.moymir_english_sessions s
  where s.child_id=v_user and s.activity_day=(now() at time zone 'Europe/Madrid')::date;
 if v_count>=15 then raise exception 'Дневной лимит попыток исчерпан. Продолжи начатый урок или вернись завтра.' using errcode='22023';end if;
 update public.moymir_english_sessions set status='abandoned',finished_at=now(),last_heartbeat_at=null
  where id=v_old and status='in_progress' and child_id=v_user and family_id=v_family;
 insert into public.moymir_english_sessions(family_id,child_id,lesson_key,total_questions)
 values(v_family,v_user,p_lesson,v_total) returning * into v_next;
 return jsonb_build_object('id',v_next.id,'started_at',v_next.started_at,'lesson_key',v_next.lesson_key,'resumed',false,'restarted',true,'previous_session_id',v_old);
end;$restart$;
revoke all on function public.moymir_english_restart(text) from public,anon;
grant execute on function public.moymir_english_restart(text) to authenticated;
commit;
