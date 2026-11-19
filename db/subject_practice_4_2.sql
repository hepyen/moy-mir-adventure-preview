create table if not exists public.moymir_subject_practice_attempts (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null,
 child_id uuid not null,
 subject text not null check(subject in ('lengua','matematicas','historia','biologia')),
 chapter text not null check(char_length(chapter) between 2 and 48),
 level text not null default 'mixed' check(level in ('mixed','1','2','3')),
 score integer not null check(score>=0),
 total integer not null check(total between 1 and 12),
 completed_at timestamptz not null default now(),
 attempted_ids jsonb not null check(jsonb_typeof(attempted_ids)='array' and jsonb_array_length(attempted_ids) between 1 and 12),
 wrong_ids jsonb not null check(jsonb_typeof(wrong_ids)='array' and jsonb_array_length(wrong_ids)<=12),
 duration_seconds integer not null default 0 check(duration_seconds between 0 and 7200),
 constraint practice_score_le_total check(score<=total)
);
create index if not exists moymir_subject_practice_family_child_idx on public.moymir_subject_practice_attempts (family_id,child_id,completed_at desc);
alter table public.moymir_subject_practice_attempts enable row level security;
revoke all on public.moymir_subject_practice_attempts from anon,authenticated;
grant select,insert on public.moymir_subject_practice_attempts to authenticated;
create policy "subject_practice_read_family" on public.moymir_subject_practice_attempts
 for select to authenticated using (
 exists(select 1 from public.family_members m
 where m.family_id=moymir_subject_practice_attempts.family_id and m.user_id=(select auth.uid())
 and (m.role='parent' or (m.role='child' and m.user_id=moymir_subject_practice_attempts.child_id)))
 );
create policy "subject_practice_child_insert" on public.moymir_subject_practice_attempts
 for insert to authenticated with check (
 child_id=(select auth.uid()) and
 exists(select 1 from public.family_members m where m.family_id=moymir_subject_practice_attempts.family_id
  and m.user_id=(select auth.uid()) and m.role='child')
 );
