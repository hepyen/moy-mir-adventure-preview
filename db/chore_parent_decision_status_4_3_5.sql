begin;
alter table moymir_private.daily_penalty_plan add column if not exists parent_decision text check(parent_decision in ('approve','penalty','excuse'));
do $p$ declare d text; begin
 select pg_get_functiondef('public.decide_daily_chore(uuid,date,text)'::regprocedure) into d;
 d:=replace(d,'set processed=true where template_id=p_template and activity_date=p_date','set processed=true,parent_decision=p_decision where template_id=p_template and activity_date=p_date'); execute d;
 select pg_get_functiondef('public.submit_daily_chore(uuid,date)'::regprocedure) into d;
 d:=replace(d,'and activity_date=p_date and processed','and activity_date=p_date and parent_decision in (''penalty'',''excuse'')'); execute d;
end;$p$;
create or replace function public.daily_chore_parent_decisions(p_family uuid,p_child uuid)
returns jsonb language plpgsql security definer set search_path='' as $f$
begin
 if auth.uid() is null or not (public.has_family_role(p_family,'parent') or (auth.uid()=p_child and public.has_family_role(p_family,'child'))) then raise exception 'Family only' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('template_id',template_id,'activity_date',activity_date,'decision',parent_decision)) from moymir_private.daily_penalty_plan where family_id=p_family and child_id=p_child and parent_decision is not null and activity_date >= (now() at time zone 'Europe/Madrid')::date-7),'[]'::jsonb);
end;$f$;
revoke all on function public.daily_chore_parent_decisions(uuid,uuid) from public,anon;
grant execute on function public.daily_chore_parent_decisions(uuid,uuid) to authenticated;
commit;
