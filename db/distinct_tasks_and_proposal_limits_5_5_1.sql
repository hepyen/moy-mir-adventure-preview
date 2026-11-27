begin;
create function moymir_private.task_identity(p_title text) returns text language sql immutable set search_path='' as $f$
 select case k when 'почистить зубы' then 'почистить зубы утром' when 'почистить зубы перед сном' then 'почистить зубы вечером' when 'убрать комнату' then 'привести комнату в порядок' else k end
 from (select btrim(regexp_replace(lower(replace(coalesce(p_title,''),'ё','е')),'[^[:alnum:]]+',' ','g')) k) q
$f$;
revoke all on function moymir_private.task_identity(text) from public,anon,authenticated;
update public.tasks t set active=false where t.active and exists(select 1 from public.daily_chore_templates d where d.family_id=t.family_id and d.child_id=t.assigned_child and d.active and moymir_private.task_identity(d.title)=moymir_private.task_identity(t.title));
create function moymir_private.prevent_task_duplicate() returns trigger language plpgsql security definer set search_path='' as $f$
begin
 if not new.active then return new;end if;
 if tg_table_name='tasks' then
 perform 1 from public.family_members where family_id=new.family_id and user_id=new.assigned_child and role='child' for update;
 if exists(select 1 from public.daily_chore_templates d where d.family_id=new.family_id and d.child_id=new.assigned_child and d.active and moymir_private.task_identity(d.title)=moymir_private.task_identity(new.title)) then raise exception 'Это дело уже есть в ежедневных. Не создавай повтор.' using errcode='22023';end if;
 else
 perform 1 from public.family_members where family_id=new.family_id and user_id=new.child_id and role='child' for update;
 if exists(select 1 from public.tasks t where t.family_id=new.family_id and t.assigned_child=new.child_id and t.active and moymir_private.task_identity(t.title)=moymir_private.task_identity(new.title)) then raise exception 'Это дело уже есть в обычных. Сначала убери его из обычных дел.' using errcode='22023';end if;
 end if;
 return new;
end;$f$;
revoke all on function moymir_private.prevent_task_duplicate() from public,anon,authenticated;
create trigger prevent_duplicate_ordinary before insert or update of title,active,assigned_child,family_id on public.tasks for each row execute function moymir_private.prevent_task_duplicate();
create trigger prevent_duplicate_daily before insert or update of title,active,child_id,family_id on public.daily_chore_templates for each row execute function moymir_private.prevent_task_duplicate();
create function moymir_private.validate_child_proposal() returns trigger language plpgsql set search_path='' as $f$
declare words integer; letters integer; distinct_letters integer;
begin
 if new.proposed_points is null or new.proposed_points not between 1 and 100 then raise exception 'Можно запросить от 1 до 100 баллов.' using errcode='22023';end if;
 select count(distinct lower(w)) into words from regexp_split_to_table(coalesce(new.title,''),'[^[:alpha:]]+') as w where char_length(w)>=3 and w !~* '^([[:alpha:]])\1+$';
 letters:=char_length(regexp_replace(coalesce(new.title,''),'[^[:alpha:]]','','g'));
 select count(distinct lower(ch)) into distinct_letters from regexp_split_to_table(regexp_replace(coalesce(new.title,''),'[^[:alpha:]]','','g'),'') ch;
 if words<2 or letters<8 or distinct_letters<5 then raise exception 'Обоснуй правильно свой запрос: напиши, что ты сделал и за что просишь баллы.' using errcode='22023';end if;
 return new;
end;$f$;
revoke all on function moymir_private.validate_child_proposal() from public,anon,authenticated;
create trigger validate_task_proposal before insert or update of title,proposed_points on public.child_task_proposals for each row execute function moymir_private.validate_child_proposal();
create trigger validate_spiritual_proposal before insert or update of title,proposed_points on public.spiritual_point_requests for each row execute function moymir_private.validate_child_proposal();
commit;
