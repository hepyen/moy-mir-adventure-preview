begin;
-- Historical duplicate orders remain in the family history; enforce the new one-per-day rule from 19 Nov 2026 onward.
alter table public.moymir_playtime_credits
 add column if not exists source_reward_request uuid references public.reward_requests(id);
create unique index if not exists moymir_playstation_credit_once_per_request
 on public.moymir_playtime_credits(source_reward_request);
create unique index if not exists moymir_playstation_once_per_day_v432
 on public.reward_requests(child_id, ((requested_at at time zone 'Europe/Madrid')::date))
 where reward_id='604c860d-2121-4abc-a2ad-af3385b2c882'::uuid
 and requested_at >= timestamptz '2026-11-18 23:00:00+00';

do $reward_patch$
declare v_function text;
v_marker text:='-- moymir-4.3.2-playstation-once';
v_before text;
begin
 select pg_get_functiondef('public.request_reward(uuid)'::regprocedure) into v_function;
 if position(v_marker in v_function)=0 then
  v_before:=' insert into public.reward_requests(reward_id,family_id,child_id,cost_snapshot,mystery_prize)';
  if position(v_before in v_function)=0 then raise exception 'Reward creation body changed, refusing patch';end if;
  v_function:=replace(v_function,v_before,
$addition$
 -- moymir-4.3.2-playstation-once
 if v_reward.id='604c860d-2121-4abc-a2ad-af3385b2c882'::uuid then
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('playstation-30:'||(select auth.uid())::text||':'||(now() at time zone 'Europe/Madrid')::date::text,0));
  if exists(select 1 from public.reward_requests rr
   where rr.child_id=(select auth.uid()) and rr.reward_id=v_reward.id
   and (rr.requested_at at time zone 'Europe/Madrid')::date=(now() at time zone 'Europe/Madrid')::date)
  then raise exception 'Илья, ты уже активировал подарок «30 минут PlayStation» сегодня. Следующий подарок доступен завтра. Накопленные минуты остаются в копилке.' using errcode='22023';
  end if;
 end if;
$addition$||v_before);
  execute v_function;
 end if;
 select pg_get_functiondef('public.review_reward(uuid,boolean)'::regprocedure) into v_function;
 if position(v_marker in v_function)=0 then
  v_before:=' return v_status;';
  if position(v_before in v_function)=0 then raise exception 'Reward approval body changed, refusing patch';end if;
  v_function:=replace(v_function,v_before,
$addition$
 -- moymir-4.3.2-playstation-once
 if p_approve and v_request.reward_id='604c860d-2121-4abc-a2ad-af3385b2c882'::uuid then
  insert into public.moymir_playtime_credits(family_id,child_id,minutes,granted_by,note,source_reward_request)
  values(v_request.family_id,v_request.child_id,30,(select auth.uid()),'Магазин: подарок 30 минут PlayStation',v_request.id)
  on conflict (source_reward_request) do nothing;
 end if;
$addition$||v_before);
  execute v_function;
 end if;
end;$reward_patch$;
commit;
