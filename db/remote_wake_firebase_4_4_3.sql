begin;
create table moymir_private.remote_wake_devices(child_id uuid primary key references auth.users(id) on delete cascade,family_id uuid not null references public.families(id) on delete cascade,device_id uuid not null,token text not null,updated_at timestamptz not null default now());
alter table moymir_private.remote_wake_devices enable row level security;
revoke all on moymir_private.remote_wake_devices from public,anon,authenticated;
alter table moymir_private.remote_wake_requests add column native_key uuid,add column native_dispatched boolean not null default false;
create function public.moymir_wake_register(p_family uuid,p_device uuid,p_token text) returns boolean language plpgsql security definer set search_path='' as $f$
begin
 if auth.uid() is null or not public.has_family_role(p_family,'child') or p_device is null or length(coalesce(p_token,'')) not between 20 and 4096 then raise exception 'Invalid child device' using errcode='42501';end if;
 insert into moymir_private.remote_wake_devices(child_id,family_id,device_id,token) values(auth.uid(),p_family,p_device,p_token) on conflict(child_id) do update set family_id=excluded.family_id,device_id=excluded.device_id,token=excluded.token,updated_at=now();
 return true;
end;$f$;
create function public.moymir_wake_prepare_native(p_id uuid,p_parent uuid) returns jsonb language plpgsql security definer set search_path='' as $f$
declare v jsonb;
begin
 update moymir_private.remote_wake_requests r set native_key=gen_random_uuid(),native_dispatched=true,device_id=d.device_id from moymir_private.remote_wake_devices d where r.id=p_id and r.parent_id=p_parent and r.expires_at>now() and r.received_at is null and r.cancelled_at is null and not r.native_dispatched and d.child_id=r.child_id and d.family_id=r.family_id and exists(select 1 from public.family_members m where m.family_id=r.family_id and m.user_id=p_parent and m.role='parent') and exists(select 1 from public.family_members m where m.family_id=r.family_id and m.user_id=r.child_id and m.role='child') returning jsonb_build_object('token',d.token,'key',r.native_key,'device',d.device_id,'child',r.child_id,'expires',extract(epoch from r.expires_at)*1000) into v;
 return v;
end;$f$;
create function public.moymir_wake_native_failed(p_id uuid,p_key uuid) returns void language sql security definer set search_path='' as $f$
 update moymir_private.remote_wake_requests set native_dispatched=false,native_key=null,device_id=null where id=p_id and native_key=p_key and received_at is null;
$f$;
create function public.moymir_wake_native_event(p_id uuid,p_key uuid,p_event text) returns boolean language plpgsql security definer set search_path='' as $f$
begin
 if p_event='received' then
 update moymir_private.remote_wake_requests r set received_at=now() where r.id=p_id and r.native_key=p_key and r.native_dispatched and r.received_at is null and r.cancelled_at is null and r.expires_at>now() and exists(select 1 from public.family_members m where m.family_id=r.family_id and m.user_id=r.child_id and m.role='child');
 elsif p_event='awake' then
 update moymir_private.remote_wake_requests r set awake_at=now(),native_key=null where r.id=p_id and r.native_key=p_key and r.received_at>now()-interval '10 minutes' and r.awake_at is null and r.cancelled_at is null;
 else return false;end if;
 return found;
end;$f$;
create or replace function public.moymir_wake_claim(p_family uuid,p_device uuid) returns uuid language plpgsql security definer set search_path='' as $f$
declare v uuid;
begin
 if auth.uid() is null or not public.has_family_role(p_family,'child') or p_device is null then raise exception 'Child only' using errcode='42501'; end if;
 select id into v from moymir_private.remote_wake_requests where family_id=p_family and child_id=auth.uid() and expires_at>now() and awake_at is null and cancelled_at is null and not native_dispatched and (received_at is null or device_id=p_device) order by created_at desc limit 1 for update skip locked;
 if v is not null then update moymir_private.remote_wake_requests set received_at=coalesce(received_at,now()),device_id=p_device where id=v;end if;return v;
end;$f$;
revoke all on function public.moymir_wake_register(uuid,uuid,text),public.moymir_wake_prepare_native(uuid,uuid),public.moymir_wake_native_failed(uuid,uuid),public.moymir_wake_native_event(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.moymir_wake_register(uuid,uuid,text) to authenticated;
grant execute on function public.moymir_wake_prepare_native(uuid,uuid),public.moymir_wake_native_failed(uuid,uuid) to service_role;
grant execute on function public.moymir_wake_native_event(uuid,uuid,text) to anon,authenticated;
commit;
