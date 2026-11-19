do $patch$
declare v_def text;v_old text;
begin
 select pg_get_functiondef('public.moymir_english_finish(uuid,jsonb)'::regprocedure) into v_def;
 v_old:=$needle$
 if v_points=30 then
  insert into public.point_ledger(family_id,child_id,delta) values(v_session.family_id,v_session.child_id,30);
 end if;
$needle$;
 if position(v_old in v_def)=0 then raise exception 'English reward patch source not found';end if;
 v_def:=replace(v_def,v_old,E'\n');
 execute v_def;
 select pg_get_functiondef('public.moymir_family_overview(uuid,uuid)'::regprocedure) into v_def;
 if position('v_english bigint:=0;' in v_def)>0 then raise exception 'English sum already installed';end if;
 if position('v_geo bigint:=0;' in v_def)=0 or position('v_geo:=v_geo_quiz+v_geo_bonus;' in v_def)=0 then raise exception 'Overview function unexpectedly changed';end if;
 v_def:=replace(v_def,'v_geo bigint:=0;','v_geo bigint:=0;v_english bigint:=0;');
 v_def:=replace(v_def,'v_geo:=v_geo_quiz+v_geo_bonus;',E'select coalesce(sum(points_awarded),0) into v_english from public.moymir_english_sessions where family_id=p_family and child_id=p_child and status=''completed'';\n v_geo:=v_geo_quiz+v_geo_bonus;');
 v_def:=replace(v_def,'v_positive+v_daily+v_geo','v_positive+v_daily+v_geo+v_english');
 v_def:=replace(v_def,'v_credit+v_daily+v_geo','v_credit+v_daily+v_geo+v_english');
 v_def:=replace(v_def,'''geographyPoints'',v_geo','''geographyPoints'',v_geo,''englishPoints'',v_english');
 execute v_def;
end;$patch$;
