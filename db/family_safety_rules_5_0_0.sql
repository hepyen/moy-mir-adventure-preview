begin;
create table public.moymir_family_app_rules (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.families(id) on delete cascade,
 app_name text not null check(char_length(btrim(app_name)) between 1 and 80),
 rule text not null check(rule in ('allowed','ask','not_allowed')),
 note text not null default '' check(char_length(note)<=300),
 created_at timestamptz not null default now(),
 unique(family_id,app_name)
);
alter table public.moymir_family_app_rules enable row level security;
revoke all on public.moymir_family_app_rules from public,anon,authenticated;
grant select,insert,delete on public.moymir_family_app_rules to authenticated;
grant update(rule,note,app_name) on public.moymir_family_app_rules to authenticated;
create policy family_app_rule_read on public.moymir_family_app_rules for select to authenticated using(public.has_family_role(family_id,'parent') or public.has_family_role(family_id,'child'));
create policy family_app_rule_insert on public.moymir_family_app_rules for insert to authenticated with check(public.has_family_role(family_id,'parent'));
create policy family_app_rule_update on public.moymir_family_app_rules for update to authenticated using(public.has_family_role(family_id,'parent')) with check(public.has_family_role(family_id,'parent'));
create policy family_app_rule_delete on public.moymir_family_app_rules for delete to authenticated using(public.has_family_role(family_id,'parent'));
commit;
