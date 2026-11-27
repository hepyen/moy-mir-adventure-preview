begin;
alter table moymir_private.remote_wake_requests add column if not exists device_id uuid;
create or replace function public.moymir_wake_claim(p_family uuid,p_device uuid) returns uuid language plpgsql security definer set search_path='' as $f$
declare v uuid;
begin
 if auth.uid() is null or not public.has_family_role(p_family,'child') or p_device is null then raise exception 'Child only' using errcode='42501'; end if;
 select id into v from moymir_private.remote_wake_requests where family_id=p_family and child_id=auth.uid() and expires_at>now() and awake_at is null and cancelled_at is null and (received_at is null or device_id=p_device) order by created_at desc limit 1 for update skip locked;
 if v is not null then update moymir_private.remote_wake_requests set received_at=coalesce(received_at,now()),device_id=p_device where id=v;end if; return v;
end;$f$;
revoke all on function public.moymir_wake_claim(uuid) from public,anon,authenticated;
revoke all on function public.moymir_wake_claim(uuid,uuid) from public,anon;
grant execute on function public.moymir_wake_claim(uuid,uuid) to authenticated;
commit;
