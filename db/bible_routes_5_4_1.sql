begin;
do $patch$ declare d text; a text; b text; c text; begin
select pg_get_functiondef('public.moymir_journey_action(uuid,integer,text,text)'::regprocedure) into d;
a:='''С Акилой и Прискиллой'']';
b:='when ''lamp'' then 4 else null end';
c:='case when ''lamp''=any(r) then 4 else 0 end)';
if strpos(d,a)=0 or strpos(d,b)=0 or strpos(d,c)=0 or strpos(d,'p_stop not between 0 and 4')=0 then raise exception 'Journey function changed';end if;
d:=replace(d,a,'''С Акилой и Прискиллой'',''Ковчег'',''Запасы пищи'',''Лист оливы'',''Из Египта'',''По суше'',''Манна'',''Пас овец'',''На арфе'',''Пощадил его'']');
d:=replace(d,'p_stop not between 0 and 4','p_stop not between 0 and 13');
d:=replace(d,b,'when ''lamp'' then 4 when ''ark'' then 4 when ''olive'' then 3 when ''staff'' then 4 when ''manna'' then 3 when ''harp'' then 4 else null end');
d:=replace(d,c,'case when ''lamp''=any(r) then 4 else 0 end+case when ''ark''=any(r) then 4 else 0 end+case when ''olive''=any(r) then 3 else 0 end+case when ''staff''=any(r) then 4 else 0 end+case when ''manna''=any(r) then 3 else 0 end+case when ''harp''=any(r) then 4 else 0 end)');
execute d;
end;$patch$;
commit;
