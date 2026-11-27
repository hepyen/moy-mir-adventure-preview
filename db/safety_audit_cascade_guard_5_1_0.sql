begin;
create or replace function moymir_private.log_app_rule_change() returns trigger language plpgsql security definer set search_path='' as $f$
begin
 if tg_op='INSERT' then
 insert into public.moymir_safety_rule_log(family_id,app_name,action,new_rule) values(new.family_id,new.app_name,'created',new.rule);
 elsif tg_op='UPDATE' then
 if old.rule is distinct from new.rule or old.app_name is distinct from new.app_name or old.note is distinct from new.note then
 insert into public.moymir_safety_rule_log(family_id,app_name,action,old_rule,new_rule) values(new.family_id,new.app_name,'updated',old.rule,new.rule);
 end if;
 elsif exists(select 1 from public.families where id=old.family_id) then
 insert into public.moymir_safety_rule_log(family_id,app_name,action,old_rule) values(old.family_id,old.app_name,'deleted',old.rule);
 end if;
 return null;
end;$f$;
revoke all on function moymir_private.log_app_rule_change() from public,anon,authenticated;
commit;
