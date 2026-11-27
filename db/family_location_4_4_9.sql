begin;
create table public.moymir_location_share (
 family_id uuid not null references public.families(id) on delete cascade,
 child_id uuid not null references auth.users(id) on delete cascade,
 share_id uuid not null default gen_random_uuid(), expires_at timestamptz not null,
 latitude double precision, longitude double precision, accuracy_m real, battery smallint, speed_mps real,
 measured_at timestamptz, received_at timestamptz,
 primary key(family_id,child_id),
 check(latitude between -90 and 90),check(longitude between -180 and 180),check(accuracy_m between 0 and 100000),check(battery between 0 and 100),check(speed_mps between 0 and 200)
);
alter table public.moymir_location_share enable row level security;
revoke all on public.moymir_location_share from public,anon,authenticated;
grant select on public.moymir_location_share to authenticated;
create policy location_read on public.moymir_location_share for select to authenticated using(expires_at>now() and (public.has_family_role(family_id,'parent') or (child_id=(select auth.uid()) and public.has_family_role(family_id,'child'))));
create function public.moymir_location_start(p_family uuid,p_minutes integer) returns uuid language plpgsql security definer set search_path='' as $f$
declare u uuid:=auth.uid(); sid uuid:=gen_random_uuid();
begin
 if u is null or not public.has_family_role(p_family,'child') then raise exception 'Child membership required' using errcode='42501';end if;
 if p_minutes not in (15,30,60) then raise exception 'Invalid duration' using errcode='22023';end if;
 insert into public.moymir_location_share(family_id,child_id,share_id,expires_at) values(p_family,u,sid,now()+make_interval(mins=>p_minutes)) on conflict(family_id,child_id) do update set share_id=excluded.share_id,expires_at=excluded.expires_at,latitude=null,longitude=null,accuracy_m=null,battery=null,speed_mps=null,measured_at=null,received_at=null;
 return sid;
end;$f$;
create function public.moymir_location_update(p_family uuid,p_share uuid,p_lat double precision,p_lon double precision,p_accuracy real,p_battery integer,p_speed real,p_measured timestamptz) returns boolean language plpgsql security definer set search_path='' as $f$
begin
 if auth.uid() is null or not public.has_family_role(p_family,'child') then raise exception 'Child membership required' using errcode='42501';end if;
 if p_measured is null or p_measured>now()+interval '10 seconds' or p_measured<now()-interval '90 seconds' or p_lat is null or p_lon is null or p_accuracy is null or not (p_lat between -90 and 90 and p_lon between -180 and 180 and p_accuracy between 0 and 100000) then return false;end if;
 update public.moymir_location_share set latitude=p_lat,longitude=p_lon,accuracy_m=p_accuracy,battery=p_battery,speed_mps=p_speed,measured_at=p_measured,received_at=now() where family_id=p_family and child_id=auth.uid() and share_id=p_share and expires_at>now() and (measured_at is null or p_measured>measured_at) and (received_at is null or received_at<now()-interval '3 seconds');
 return found;
end;$f$;
create function public.moymir_location_stop(p_family uuid,p_share uuid) returns boolean language plpgsql security definer set search_path='' as $f$
begin
 if auth.uid() is null or not public.has_family_role(p_family,'child') then raise exception 'Child membership required' using errcode='42501';end if;
 delete from public.moymir_location_share where family_id=p_family and child_id=auth.uid() and share_id=p_share;
 return found;
end;$f$;
revoke all on function public.moymir_location_start(uuid,integer),public.moymir_location_update(uuid,uuid,double precision,double precision,real,integer,real,timestamptz),public.moymir_location_stop(uuid,uuid) from public,anon,authenticated;
grant execute on function public.moymir_location_start(uuid,integer),public.moymir_location_update(uuid,uuid,double precision,double precision,real,integer,real,timestamptz),public.moymir_location_stop(uuid,uuid) to authenticated;
-- Only latest position is retained; expired sessions are removed on a short schedule.
select cron.schedule('moymir-location-expiry','*/5 * * * *',$job$delete from public.moymir_location_share where expires_at<=now()$job$);
commit;
