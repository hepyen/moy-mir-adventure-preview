begin;
create or replace function moymir_private.sync_today_chore_penalty_plan()
returns trigger language plpgsql security definer set search_path='' as $f$
declare d date:=(now() at time zone 'Europe/Madrid')::date;
begin
 if not new.active or not new.penalty_enabled or new.points=0 or not (extract(dow from d)::integer=any(new.weekdays)) then
  update moymir_private.daily_penalty_plan set processed=true where template_id=new.id and activity_date=d;
 else
  update moymir_private.daily_penalty_plan set points=new.points,title=new.title where template_id=new.id and activity_date=d and not processed;
 end if;
 return new;
end;$f$;
revoke all on function moymir_private.sync_today_chore_penalty_plan() from public,anon,authenticated;
create trigger sync_today_chore_penalty_plan after update of title,points,active,weekdays,penalty_enabled on public.daily_chore_templates for each row execute function moymir_private.sync_today_chore_penalty_plan();
commit;

