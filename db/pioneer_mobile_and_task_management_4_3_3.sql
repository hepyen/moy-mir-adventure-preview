-- Private pioneer engines already validate auth.uid(), family membership and child-only gameplay.
-- Public wrappers were SECURITY INVOKER and could not access the moymir_private schema from the Android client.
begin;
alter function public.pioneer_state(uuid) security definer;
alter function public.pioneer_begin(uuid,integer) security definer;
alter function public.pioneer_answer(uuid,uuid,integer,integer) security definer;
alter function public.pioneer_advance(uuid,uuid) security definer;
alter function public.pioneer_hint(uuid,uuid,text) security definer;
alter function public.pioneer_cashout(uuid,uuid) security definer;
alter function public.pioneer_timeout(uuid,uuid,integer) security definer;
revoke all on function public.pioneer_state(uuid),public.pioneer_begin(uuid,integer),public.pioneer_answer(uuid,uuid,integer,integer),public.pioneer_advance(uuid,uuid),public.pioneer_hint(uuid,uuid,text),public.pioneer_cashout(uuid,uuid),public.pioneer_timeout(uuid,uuid,integer) from PUBLIC,anon;
grant execute on function public.pioneer_state(uuid),public.pioneer_begin(uuid,integer),public.pioneer_answer(uuid,uuid,integer,integer),public.pioneer_advance(uuid,uuid),public.pioneer_hint(uuid,uuid,text),public.pioneer_cashout(uuid,uuid),public.pioneer_timeout(uuid,uuid,integer) to authenticated;
commit;
begin;
alter table public.tasks add column if not exists active boolean not null default true;
create or replace function public.manage_family_task(p_id uuid,p_title text,p_points integer,p_active boolean)
returns uuid language plpgsql security definer set search_path='' as $task$
declare t public.tasks%rowtype;
begin
 select * into t from public.tasks where id=p_id for update;
 if not found or not public.has_family_role(t.family_id,'parent') then
   raise exception 'Редактировать дела может только родитель' using errcode='42501';
 end if;
 if p_title is null or char_length(btrim(p_title)) not between 1 and 160
    or p_points is null or p_points not between 0 and 1000 or p_active is null then
   raise exception 'Некорректные данные задания' using errcode='22023';
 end if;
 update public.tasks set title=btrim(p_title),points=p_points,active=p_active where id=p_id;
 return p_id;
end;$task$;
revoke all on function public.manage_family_task(uuid,text,integer,boolean) from public,anon;
grant execute on function public.manage_family_task(uuid,text,integer,boolean) to authenticated;
do $patch$
declare d text;old text;
begin
 select pg_get_functiondef('public.submit_task(uuid)'::regprocedure) into d;
 if position('and not t.active' in d)>0 then return;end if;
 old:='select family_id,assigned_child into v_family,v_child from public.tasks where id=p_task_id for update;';
 if position(old in d)=0 then raise exception 'submit_task changed: stop patch';end if;
 d:=replace(d,old, 'select family_id,assigned_child into v_family,v_child from public.tasks where id=p_task_id and active=true for update;');
 execute d;
end;$patch$;
commit;
