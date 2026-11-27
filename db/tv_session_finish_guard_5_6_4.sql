begin;
do $p$ declare d text;m text;begin
select pg_get_functiondef('public.moymir_playtime_finish(uuid)'::regprocedure) into d;
m:='if v_req.status=''finished'' then return true;end if;';
if strpos(d,m)=0 then raise exception 'Finish function changed';end if;
execute replace(d,m,m||chr(10)||' if v_req.tv_controlled and not public.has_family_role(v_req.family_id,''parent'') then raise exception ''ТВ-сеанс завершает родитель или таймер'' using errcode=''42501'';end if;');
end;$p$;
commit;
