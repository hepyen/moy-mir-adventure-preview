import {writeFileSync} from 'node:fs'
import {buildSync} from 'esbuild'
import {createRequire} from 'node:module'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
const path=mkdtempSync(join(tmpdir(),'moymir-43-bank-'))
const filename=join(path,'lessons.cjs')
const output=buildSync({entryPoints:[resolve('src/english/lessons.ts')],bundle:true,format:'cjs',platform:'node',write:false}).outputFiles[0]
writeFileSync(filename,output.contents)
const {LESSONS,LEGACY_LESSONS,DIAGNOSTIC}=createRequire(import.meta.url)(filename)
rmSync(path,{recursive:true,force:true})
if(LESSONS.length!==8)throw Error('Expected eight lessons')
const rows=LESSONS.map(lesson=>{
 if(!/^eng2:[a-z-]+$/.test(lesson.id)||lesson.questions.length!==30||new Set(lesson.questions.map(q=>q.prompt)).size!==30)throw Error('Invalid lesson bank: '+lesson.id)
 for(const q of lesson.questions){if(new Set(q.options).size!==3||![0,1,2].includes(q.correct)||q.explain.length<10)throw Error('Question invalid: '+q.prompt)}
 return ` ('${lesson.id}',array[${lesson.questions.map(q=>q.correct).join(',')}])`
})
if(LEGACY_LESSONS.length!==8||DIAGNOSTIC.questions.length!==18)throw Error('Incompatible with legacy bank')
const sql=`-- English 4.3: new 30-question curriculum uses versioned keys; old 6-question sessions remain untouched.
insert into moymir_private.english_answer_keys(lesson_key,answer_keys) values
${rows.join(',\n')}
on conflict(lesson_key) do update set answer_keys=excluded.answer_keys;
`
writeFileSync('db/english_tutor_4_3.sql',sql)
console.log('Generated '+rows.length+' lessons, '+LESSONS.reduce((n,l)=>n+l.questions.length,0)+' questions, 8 old lessons preserved')
