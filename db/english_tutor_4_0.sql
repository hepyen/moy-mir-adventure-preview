
create schema if not exists moymir_private;
revoke all on schema moymir_private from public, anon, authenticated;
create table if not exists moymir_private.english_answer_keys(
 lesson_key text primary key,
 answer_keys integer[] not null
);
revoke all on moymir_private.english_answer_keys from public, anon, authenticated;
insert into moymir_private.english_answer_keys(lesson_key,answer_keys) values
 ('diagnostic',array[1,1,0,1,0,1,2,2,1,1,1,1,1,0,0,0,1,1]),
 ('to-be',array[1,0,2,1,0,1]),
 ('have-got',array[1,2,0,2,0,1]),
 ('present-simple',array[1,0,2,1,2,0]),
 ('present-continuous',array[1,2,0,1,1,0]),
 ('there-is-are',array[1,2,1,0,1,0]),
 ('past-simple',array[1,0,1,2,0,1]),
 ('daily-words',array[0,1,2,0,1,2]),
 ('questions',array[1,0,2,0,1,2])
on conflict(lesson_key) do update set answer_keys=excluded.answer_keys;
create table if not exists public.moymir_english_sessions (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null,
 child_id uuid not null,
 lesson_key text not null,
 activity_day date not null default ((now() at time zone 'Europe/Madrid')::date),
 started_at timestamptz not null default now(),
 finished_at timestamptz,
 score integer,
 total_questions integer not null,
 answers jsonb,
 status text not null default 'in_progress' check (status in ('in_progress','completed')),
 points_awarded integer not null default 0 check (points_awarded in (0,30)),
 constraint english_session_state_check check ((status='in_progress' and finished_at is null and points_awarded=0) or (status='completed' and finished_at is not null and score is not null))
);
create index if not exists moymir_english_sessions_family_child_idx
 on public.moymir_english_sessions(family_id,child_id,started_at desc);
create unique index if not exists moymir_english_one_lesson_reward_per_day
 on public.moymir_english_sessions(child_id,lesson_key,activity_day) where points_awarded=30;
alter table public.moymir_english_sessions enable row level security;
revoke all on public.moymir_english_sessions from anon, authenticated;
grant select on public.moymir_english_sessions to authenticated;
create policy english_family_read on public.moymir_english_sessions
 for select to authenticated using (
 exists (
  select 1 from public.family_members m
  where m.family_id=moymir_english_sessions.family_id and m.user_id=(select auth.uid())
    and (m.role='parent' or (m.role='child' and m.user_id=moymir_english_sessions.child_id))
 )
);
create or replace function public.moymir_english_begin(p_lesson text)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare
 v_user uuid:=(select auth.uid());
 v_family uuid;
 v_count integer;
 v_total integer;
 v_existing public.moymir_english_sessions%rowtype;
begin
 if v_user is null then raise exception 'Log in to start an English lesson' using errcode='42501';end if;
 select m.family_id into v_family from public.family_members m
 where m.user_id=v_user and m.role='child' limit 1;
 if v_family is null then raise exception 'Only the child can start an English lesson' using errcode='42501';end if;
 select cardinality(k.answer_keys) into v_total from moymir_private.english_answer_keys k where k.lesson_key=p_lesson;
 if v_total is null then raise exception 'Unknown English lesson' using errcode='22023';end if;
 select * into v_existing from public.moymir_english_sessions s
 where s.child_id=v_user and s.lesson_key=p_lesson
 and s.activity_day=(now() at time zone 'Europe/Madrid')::date and s.status='in_progress'
 order by s.started_at desc limit 1;
 if found then return jsonb_build_object('id',v_existing.id,'started_at',v_existing.started_at,'lesson_key',v_existing.lesson_key,'resumed',true);end if;
 select count(*) into v_count from public.moymir_english_sessions s
 where s.child_id=v_user and s.activity_day=(now() at time zone 'Europe/Madrid')::date;
 if v_count>=15 then raise exception 'Daily lesson start limit reached. Try tomorrow.' using errcode='22023';end if;
 insert into public.moymir_english_sessions(family_id,child_id,lesson_key,total_questions)
 values (v_family,v_user,p_lesson,v_total) returning * into v_existing;
 return jsonb_build_object('id',v_existing.id,'started_at',v_existing.started_at,'lesson_key',v_existing.lesson_key,'resumed',false);
end;$fn$;
create or replace function public.moymir_english_finish(p_session uuid,p_answers jsonb)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare
 v_user uuid:=(select auth.uid());
 v_session public.moymir_english_sessions%rowtype;
 v_key integer[];
 v_total integer;
 v_score integer:=0;
 v_index integer;
 v_value jsonb;
 v_elapsed integer;
 v_points integer:=0;
begin
 if v_user is null then raise exception 'Log in to finish a lesson' using errcode='42501';end if;
 select * into v_session from public.moymir_english_sessions s
 where s.id=p_session and s.child_id=v_user and s.status='in_progress'
 for update;
 if not found then raise exception 'Lesson not found or already finished' using errcode='42501';end if;
 if not exists(select 1 from public.family_members m where m.family_id=v_session.family_id and m.user_id=v_user and m.role='child')
 then raise exception 'No child account access' using errcode='42501';end if;
 select k.answer_keys into v_key from moymir_private.english_answer_keys k where k.lesson_key=v_session.lesson_key;
 v_total:=coalesce(cardinality(v_key),0);
 if v_total=0 or p_answers is null or jsonb_typeof(p_answers)<>'array' or jsonb_array_length(p_answers)<>v_total then
  raise exception 'Answer all questions first' using errcode='22023';
 end if;
 for v_index in 0..v_total-1 loop
  v_value:=p_answers->v_index;
  if jsonb_typeof(v_value)<>'number' or (v_value #>> '{}') !~ '^[0-2]$' then
   raise exception 'Invalid answer format' using errcode='22023';
  end if;
  if (v_value #>> '{}')::integer=v_key[v_index+1] then v_score:=v_score+1;end if;
 end loop;
 v_elapsed:=floor(extract(epoch from (now()-v_session.started_at)))::integer;
 if v_session.lesson_key<>'diagnostic' and v_elapsed<900 then
  return jsonb_build_object('status','waiting','remaining_seconds',900-v_elapsed,'score',v_score,'total',v_total);
 end if;
 if v_session.lesson_key<>'diagnostic' then
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_session.child_id::text||':'||v_session.lesson_key||':'||v_session.activity_day::text,0));
  if not exists(select 1 from public.moymir_english_sessions s where s.child_id=v_session.child_id
    and s.lesson_key=v_session.lesson_key and s.activity_day=v_session.activity_day and s.points_awarded=30) then
   v_points:=30;
  end if;
 end if;
 update public.moymir_english_sessions set finished_at=now(),score=v_score,answers=p_answers,
 status='completed',points_awarded=v_points where id=p_session;
 return jsonb_build_object('status','completed','score',v_score,'total',v_total,'points_awarded',v_points,'correct_answers',to_jsonb(v_key));
end;$fn$;
revoke execute on function public.moymir_english_begin(text) from public,anon;
revoke execute on function public.moymir_english_finish(uuid,jsonb) from public,anon;
grant execute on function public.moymir_english_begin(text) to authenticated;
grant execute on function public.moymir_english_finish(uuid,jsonb) to authenticated;
