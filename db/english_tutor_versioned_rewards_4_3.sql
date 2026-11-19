-- Award one daily bonus per English topic across legacy and new lesson versions.
do $patch$
declare
 def text;
begin
 select pg_get_functiondef('public.moymir_english_finish(uuid,jsonb)'::regprocedure) into def;
 if position($already$v_norm_lesson text;$already$ in def)>0 then return;end if;
 if position($old$v_points integer:=0;$old$ in def)=0
 or position($old$v_session.child_id::text||':'||v_session.lesson_key||':'||v_session.activity_day::text$old$ in def)=0
 or position($old$and s.lesson_key=v_session.lesson_key and s.activity_day=v_session.activity_day and s.points_awarded=30$old$ in def)=0
 then raise exception 'Current reward function does not match inspected safe patch';end if;
 def:=replace(def,
  $old$v_points integer:=0;$old$,
  $new$v_points integer:=0;
 v_norm_lesson text;$new$);
 def:=replace(def,
  $old$perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_session.child_id::text||':'||v_session.lesson_key||':'||v_session.activity_day::text,0));$old$,
  $new$v_norm_lesson:=pg_catalog.regexp_replace(v_session.lesson_key,'^eng2:','');
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_session.child_id::text||':'||v_norm_lesson||':'||v_session.activity_day::text,0));$new$);
 def:=replace(def,
  $old$and s.lesson_key=v_session.lesson_key and s.activity_day=v_session.activity_day and s.points_awarded=30$old$,
  $new$and pg_catalog.regexp_replace(s.lesson_key,'^eng2:','')=v_norm_lesson and s.activity_day=v_session.activity_day and s.points_awarded=30$new$);
 execute def;
end;$patch$;
