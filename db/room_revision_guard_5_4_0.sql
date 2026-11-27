begin;
do $patch$ declare d text; marker text;begin
select pg_get_functiondef('public.moymir_room_save(uuid,integer,integer,jsonb)'::regprocedure) into d;
marker:='if p_world is null or p_world not between 1 and 4 then';
if strpos(d,marker)=0 then raise exception 'Room save changed';end if;
execute replace(d,marker,'if p_revision is null or p_revision<0 then raise exception ''Invalid revision'';end if;'||chr(10)||marker);
end;$patch$;
commit;
