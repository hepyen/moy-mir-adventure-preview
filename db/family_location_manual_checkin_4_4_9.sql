begin;
revoke execute on function public.moymir_location_start(uuid,integer),public.moymir_location_update(uuid,uuid,double precision,double precision,real,integer,real,timestamptz) from authenticated;
create function public.moymir_location_checkin(p_family uuid,p_lat double precision,p_lon double precision,p_accuracy real,p_measured timestamptz) returns uuid language plpgsql security definer set search_path='' as $f$
declare u uuid:=auth.uid(); sid uuid:=gen_random_uuid();
begin
 if u is null or not public.has_family_role(p_family,'child') then raise exception 'Child membership required' using errcode='42501';end if;
 if p_measured is null or p_measured>now()+interval '10 seconds' or p_measured<now()-interval '2 minutes' or p_lat is null or p_lon is null or p_accuracy is null or not (p_lat between -90 and 90 and p_lon between -180 and 180 and p_accuracy between 0 and 100000) then raise exception 'Invalid or expired check-in' using errcode='22023';end if;
 insert into public.moymir_location_share(family_id,child_id,share_id,expires_at,latitude,longitude,accuracy_m,measured_at,received_at) values(p_family,u,sid,now()+interval '15 minutes',p_lat,p_lon,p_accuracy,p_measured,now()) on conflict(family_id,child_id) do update set share_id=excluded.share_id,expires_at=excluded.expires_at,latitude=excluded.latitude,longitude=excluded.longitude,accuracy_m=excluded.accuracy_m,measured_at=excluded.measured_at,received_at=excluded.received_at,battery=null,speed_mps=null;
 return sid;
end;$f$;
revoke all on function public.moymir_location_checkin(uuid,double precision,double precision,real,timestamptz) from public,anon,authenticated;
grant execute on function public.moymir_location_checkin(uuid,double precision,double precision,real,timestamptz) to authenticated;
commit;
