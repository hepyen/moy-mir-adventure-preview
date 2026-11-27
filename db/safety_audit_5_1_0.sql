begin;
create table public.moymir_safety_rule_log (
 id uuid primary key default gen_random_uuid(),
 family_id uuid not null references public.families(id) on delete cascade,
 app_name text not null check(char_length(app_name)<=80),
 action text not null check(action in ('created','updated','deleted')),
 old_rule text check(old_rule in ('allowed','ask','not_allowed')),
 new_rule text check(new_rule in ('allowed','ask','not_allowed')),
 created_at timestamptz not null default now()
);
create index moymir_safety_rule_log_family_time on public.moymir_safety_rule_log(family_id,created_at desc);
alter table public.moymir_safety_rule_log enable row level security;
revoke all on public.moymir_safety_rule_log from public,anon,authenticated;
grant select on public.moymir_safety_rule_log to authenticated;
create policy safety_log_read on public.moymir_safety_rule_log for select to authenticated using(public.has_family_role(family_id,'parent') or public.has_family_role(family_id,'child'));
create function moymir_private.log_app_rule_change() returns trigger language plpgsql security definer set search_path='' as $f$
begin
 if tg_op='INSERT' then
 insert into public.moymir_safety_rule_log(family_id,app_name,action,new_rule) values(new.family_id,new.app_name,'created',new.rule);
 elsif tg_op='UPDATE' then
 if old.rule is distinct from new.rule or old.app_name is distinct from new.app_name or old.note is distinct from new.note then
 insert into public.moymir_safety_rule_log(family_id,app_name,action,old_rule,new_rule) values(new.family_id,new.app_name,'updated',old.rule,new.rule);
 end if;
 else
 insert into public.moymir_safety_rule_log(family_id,app_name,action,old_rule) values(old.family_id,old.app_name,'deleted',old.rule);
 end if;
 return null;
end;$f$;
revoke all on function moymir_private.log_app_rule_change() from public,anon,authenticated;
create trigger moymir_app_rule_audit after insert or update or delete on public.moymir_family_app_rules for each row execute function moymir_private.log_app_rule_change();
select cron.schedule('moymir-safety-log-expiry','17 3 * * *',$job$delete from public.moymir_safety_rule_log where created_at<now()-interval '90 days'$job$);
commit;
