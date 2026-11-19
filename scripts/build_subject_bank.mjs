/** Build a reviewable SQL fixture with canonical answers in the server-only private schema. */
import {writeFileSync} from 'node:fs';
import {ALL_SUBJECT_LESSONS} from '../src/subjects/subjects.ts';
const esc=s=>s.replaceAll("'","''");
const lines=ALL_SUBJECT_LESSONS.map(lesson=>{
 if(!/^[a-z-]+:[a-z-]+$/.test(lesson.id))throw Error('Invalid lesson slug: '+lesson.id);
 if(lesson.questions.length<6||lesson.questions.length>18)throw Error('Unexpected number of questions: '+lesson.id);
 for(const q of lesson.questions){
  if(q.options.length!==3||new Set(q.options).size!==3||![0,1,2].includes(q.correct)||!q.explain)throw Error('Bad answer options: '+lesson.id);
 }
 return ` ('${esc(lesson.id)}',array[${lesson.questions.map(q=>q.correct).join(',')}])`;
});
let sql=`-- Generated from src/subjects/subjects.ts. Answers are private, no client write grant.\ninsert into moymir_private.english_answer_keys(lesson_key,answer_keys) values\n${lines.join(',\n')}\non conflict(lesson_key) do update set answer_keys=excluded.answer_keys;\n`;
sql+=`-- Reuse the independently tested 15-minute reward RPC for all school subjects.
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
`;
writeFileSync('db/subject_tutors_4_1.sql',sql);
console.log('Wrote',lines.length,'lesson keys,',ALL_SUBJECT_LESSONS.reduce((n,l)=>n+l.questions.length,0),'canonical answers');
