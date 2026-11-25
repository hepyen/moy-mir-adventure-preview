begin;
alter table moymir_private.daily_penalty_plan add column if not exists parent_decision text check(parent_decision in ('approve','penalty','excuse'));
CREATE OR REPLACE FUNCTION public.submit_daily_chore(p_template uuid, p_date date)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare t public.daily_chore_templates%rowtype;v_id uuid;v_date date;
begin
 v_date:=(now() at time zone 'Europe/Madrid')::date;
 select * into t from public.daily_chore_templates where id=p_template for update;
 if not found or not t.active or t.child_id<>(select auth.uid())
  or not public.has_family_role(t.family_id,'child')
  or p_date is distinct from v_date
  or not (extract(dow from p_date)::integer=any(t.weekdays)) then
  raise exception 'Chore is not available today' using errcode='42501';end if;
 if exists(select 1 from moymir_private.daily_penalty_plan where template_id=p_template and activity_date=p_date and parent_decision in ('penalty','excuse')) then raise exception 'Родитель уже принял решение по этому делу';end if; insert into public.daily_chore_completions(template_id,family_id,child_id,activity_date)
 values(t.id,t.family_id,t.child_id,p_date)
 on conflict(template_id,child_id,activity_date) do update set status='pending',
   points_awarded=0,reviewed_at=null,reviewed_by=null
   where public.daily_chore_completions.status='rejected'
 returning id into v_id;
 if v_id is null then
  select id into v_id from public.daily_chore_completions
  where template_id=t.id and child_id=t.child_id and activity_date=p_date;
 end if;
 return v_id;
end;
$function$
;
CREATE OR REPLACE FUNCTION moymir_private.process_daily_chore_penalties()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin return 0; end;$function$
;
CREATE OR REPLACE FUNCTION moymir_private.send_daily_chore_reminders()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare d date:=(now() at time zone 'Europe/Madrid')::date; rec record; n integer:=0;
begin
 if (now() at time zone 'Europe/Madrid')::time < time '19:00' then return 0; end if;
 for rec in
  insert into moymir_private.daily_penalty_plan(template_id,activity_date,family_id,child_id,title,points)
  select t.id,d,t.family_id,t.child_id,t.title,t.points from public.daily_chore_templates t
  where t.active and t.penalty_enabled and t.points>0 and extract(dow from d)::integer=any(t.weekdays)
   and not exists(select 1 from public.daily_chore_completions c where c.template_id=t.id and c.activity_date=d and c.status in ('approved','pending'))
  on conflict do nothing returning *
 loop
  insert into public.family_notifications(family_id,recipient_id,kind,title,body,source_id)
   values(rec.family_id,rec.child_id,'daily_chore_reminder','Миро напоминает','Илья, ещё не отмечено дело: '||rec.title||'. Если ты его выполнил, нажми «Готово» и отправь на проверку.',rec.template_id);
  n:=n+1;
 end loop;
 return n;
end;$function$
;
CREATE OR REPLACE FUNCTION public.pending_daily_chore_decisions(p_family uuid, p_child uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or not public.has_family_role(p_family,'parent') then raise exception 'Parent only' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('template_id',p.template_id,'activity_date',p.activity_date,'title',p.title,'points',p.points,'status',coalesce(c.status,'open')) order by p.activity_date desc,p.title)
 from moymir_private.daily_penalty_plan p join public.daily_chore_templates t on t.id=p.template_id
 left join public.daily_chore_completions c on c.template_id=p.template_id and c.activity_date=p.activity_date
 where p.family_id=p_family and p.child_id=p_child and not p.processed and t.active and t.penalty_enabled and c.status is distinct from 'approved'),'[]'::jsonb);
end;$function$
;
CREATE OR REPLACE FUNCTION public.decide_daily_chore(p_template uuid, p_date date, p_decision text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare t public.daily_chore_templates%rowtype; p moymir_private.daily_penalty_plan%rowtype; c public.daily_chore_completions%rowtype;
begin
 select * into t from public.daily_chore_templates where id=p_template for update;
 if not found or auth.uid() is null or not public.has_family_role(t.family_id,'parent') then raise exception 'Только родитель принимает решение' using errcode='42501';end if;
 if p_decision is null or p_decision not in ('approve','penalty','excuse') then raise exception 'Invalid decision';end if;
 select * into p from moymir_private.daily_penalty_plan where template_id=p_template and activity_date=p_date for update;
 if not found or p.processed or not t.active or not t.penalty_enabled then raise exception 'Дело уже рассмотрено или отключено';end if;
 select * into c from public.daily_chore_completions where template_id=p_template and activity_date=p_date for update;
 if c.status='approved' then raise exception 'Дело уже подтверждено';end if;
 if p_decision='approve' then
  insert into public.daily_chore_completions(template_id,family_id,child_id,activity_date,status,points_awarded,reviewed_at,reviewed_by)
   values(t.id,t.family_id,t.child_id,p_date,'approved',p.points,now(),auth.uid())
   on conflict(template_id,child_id,activity_date) do update set status='approved',points_awarded=excluded.points_awarded,reviewed_at=now(),reviewed_by=auth.uid();
 else
  if c.status='pending' then update public.daily_chore_completions set status='rejected',points_awarded=0,reviewed_at=now(),reviewed_by=auth.uid() where id=c.id;end if;
  if p_decision='penalty' then
   perform 1 from public.family_members where family_id=t.family_id and user_id=t.child_id and role='child' for update;
   insert into public.behavior_points(family_id,child_id,reason,category,amount,created_by,chore_template_id,chore_date)
    values(t.family_id,t.child_id,'Штраф родителя: '||p.title||' ('||to_char(p_date,'DD.MM.YYYY')||')','other',p.points,auth.uid(),t.id,p_date)
    on conflict (chore_template_id,chore_date) where chore_template_id is not null do nothing;
  end if;
 end if;
 update moymir_private.daily_penalty_plan set processed=true,parent_decision=p_decision where template_id=p_template and activity_date=p_date;
 return p_decision;
end;$function$
;
CREATE OR REPLACE FUNCTION public.daily_chore_parent_decisions(p_family uuid, p_child uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if auth.uid() is null or not (public.has_family_role(p_family,'parent') or (auth.uid()=p_child and public.has_family_role(p_family,'child'))) then raise exception 'Family only' using errcode='42501';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('template_id',template_id,'activity_date',activity_date,'decision',parent_decision)) from moymir_private.daily_penalty_plan where family_id=p_family and child_id=p_child and parent_decision is not null and activity_date >= (now() at time zone 'Europe/Madrid')::date-7),'[]'::jsonb);
end;$function$
;
revoke all on function moymir_private.send_daily_chore_reminders() from public,anon,authenticated;
revoke all on function public.pending_daily_chore_decisions(uuid,uuid),public.decide_daily_chore(uuid,date,text),public.daily_chore_parent_decisions(uuid,uuid) from public,anon;
grant execute on function public.pending_daily_chore_decisions(uuid,uuid),public.decide_daily_chore(uuid,date,text),public.daily_chore_parent_decisions(uuid,uuid) to authenticated;
select cron.unschedule(jobid) from cron.job where jobname='moymir-daily-chore-penalties';
select cron.schedule('moymir-daily-chore-reminders','*/5 * * * *','select moymir_private.send_daily_chore_reminders()');
commit;

