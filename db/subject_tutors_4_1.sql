-- Generated from src/subjects/subjects.ts. Answers are private, no client write grant.
insert into moymir_private.english_answer_keys(lesson_key,answer_keys) values
 ('lengua:diagnostic',array[1,0,2,1,0,2,1,0,2,1,0,2]),
 ('lengua:categorias',array[1,0,2,1,0,2]),
 ('lengua:sujeto',array[1,0,2,1,0,2]),
 ('lengua:acentuacion',array[1,0,2,1,0,2]),
 ('lengua:textos',array[1,0,2,1,0,2]),
 ('matematicas:diagnostic',array[1,0,2,1,0,2,1,0,2,1,0,2]),
 ('matematicas:enteros',array[1,0,2,1,0,2]),
 ('matematicas:fracciones',array[1,0,2,1,0,2]),
 ('matematicas:potencias',array[1,0,2,1,0,2]),
 ('matematicas:geometria',array[1,0,2,1,0,2]),
 ('historia:diagnostic',array[1,0,2,1,0,2,1,0,2,1,0,2]),
 ('historia:mapas',array[1,0,2,1,0,2]),
 ('historia:relieve',array[1,0,2,1,0,2]),
 ('historia:clima',array[1,0,2,1,0,2]),
 ('historia:prehistoria',array[1,0,2,1,0,2]),
 ('biologia:diagnostic',array[1,0,2,1,0,2,1,0,2,1,0,2]),
 ('biologia:celulas',array[1,0,2,1,0,2]),
 ('biologia:reinos',array[1,0,2,1,0,2]),
 ('biologia:geologia',array[1,0,2,1,0,2]),
 ('biologia:ecosistemas',array[1,0,2,1,0,2]),
 ('frances:diagnostic',array[1,0,2,1,0,2,1,0,2]),
 ('frances:salutations',array[1,0,2,1,0,2]),
 ('frances:etre-avoir',array[1,0,2,1,0,2]),
 ('frances:articles',array[1,0,2,1,0,2]),
 ('robotica:diagnostic',array[1,0,2,1,0,2,1,0,2]),
 ('robotica:algoritmos',array[1,0,2,1,0,2]),
 ('robotica:sensores',array[1,0,2,1,0,2]),
 ('robotica:digital',array[1,0,2,1,0,2]),
 ('musica:diagnostic',array[1,0,2,1,0,2]),
 ('musica:notas',array[1,0,2,1,0,2]),
 ('musica:instrumentos',array[1,0,2,1,0,2]),
 ('plastica:diagnostic',array[1,0,2,1,0,2]),
 ('plastica:color',array[1,0,2,1,0,2]),
 ('plastica:perspectiva',array[1,0,2,1,0,2]),
 ('educacion-fisica:diagnostic',array[1,0,2,1,0,2]),
 ('educacion-fisica:calentamiento',array[1,0,2,1,0,2]),
 ('educacion-fisica:juego-limpio',array[1,0,2,1,0,2])
on conflict(lesson_key) do update set answer_keys=excluded.answer_keys;
-- Reuse the independently tested 15-minute reward RPC for all school subjects.
-- Diagnostic IDs are namespaced and must remain unawarded and untimed.
do $patch_subject_diagnostics$
declare v_definition text;
begin
 select pg_get_functiondef('public.moymir_english_finish(uuid,jsonb)'::regprocedure) into v_definition;
 if position($fragment$v_session.lesson_key not like '%:diagnostic'$fragment$ in v_definition)>0 then return;end if;
 if position($fragment$v_session.lesson_key<>'diagnostic' and v_elapsed<900$fragment$ in v_definition)=0
 or position($fragment$v_session.lesson_key<>'diagnostic' then$fragment$ in v_definition)=0 then
  raise exception 'Existing lesson completion code changed: abort update';
 end if;
 v_definition:=replace(v_definition,
  $old$v_session.lesson_key<>'diagnostic' and v_elapsed<900$old$,
  $new$v_session.lesson_key<>'diagnostic' and v_session.lesson_key not like '%:diagnostic' and v_elapsed<900$new$);
 v_definition:=replace(v_definition,
  $old$v_session.lesson_key<>'diagnostic' then$old$,
  $new$v_session.lesson_key<>'diagnostic' and v_session.lesson_key not like '%:diagnostic' then$new$);
 execute v_definition;
end;$patch_subject_diagnostics$;
