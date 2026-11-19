const assert=require('node:assert/strict')
const fs=require('node:fs'),os=require('node:os'),path=require('node:path')
const {buildSync}=require('esbuild')
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'moymir-english-'))
try{
 const compiled=buildSync({entryPoints:[path.resolve(__dirname,'../src/english/lessons.ts')],bundle:true,format:'cjs',platform:'node',write:false})
 const output=path.join(tmp,'lessons.cjs');fs.writeFileSync(output,compiled.outputFiles[0].contents)
 const {LESSONS,DIAGNOSTIC,ALL_ENGLISH_LESSONS,shuffledEnglishChoices,findEnglishLesson}=require(output)
 const sql=fs.readFileSync(path.resolve(__dirname,'../db/english_tutor_4_0.sql'),'utf8')+'\n'+fs.readFileSync(path.resolve(__dirname,'../db/english_tutor_4_3.sql'),'utf8')
 let passes=0
 const check=(label,fn)=>{fn();passes++;console.log('PASS',label)}
 check('Eight 1 ESO lessons available',()=>assert.equal(LESSONS.length,8))
 check('Diagnostic has 18 questions',()=>assert.equal(DIAGNOSTIC.questions.length,18))
 const expected=new Map()
 for(const match of sql.matchAll(/\('([a-z0-9:-]+)',array\[([0-2,]+)\]\)/g))expected.set(match[1],match[2].split(',').map(Number))
 check('Database contains all 17 legacy, diagnostic and expanded answer banks',()=>assert.equal(expected.size,17))
 for(const lesson of ALL_ENGLISH_LESSONS){
  check('Correct answer positions match server bank for '+lesson.id,()=>assert.deepEqual(lesson.questions.map(q=>q.correct),expected.get(lesson.id)))
  check('All options and explanations are complete for '+lesson.id,()=>{
   for(const q of lesson.questions){assert.equal(q.options.length,3);assert(q.options.every(x=>x.length>0));assert(q.explain.length>=8);assert(q.correct>=0&&q.correct<3)}
  })
 }
 check('Each of eight English lessons has exactly 30 distinct questions',()=>{for(const l of LESSONS){assert.equal(l.questions.length,30);assert.equal(new Set(l.questions.map(q=>q.prompt)).size,30)}})
 const first=LESSONS[0].questions[0]
 check('Shuffled answers always keep original three choices',()=>{
  for(let i=0;i<150;i++)assert.deepEqual(shuffledEnglishChoices(first,'sample-session-'+i,i).toSorted(),[0,1,2])
 })
 check('Different attempts rotate the answer positions',()=>{
  const orders=new Set(Array.from({length:150},(_,i)=>shuffledEnglishChoices(first,'session-'+i,0).join(',')))
  assert(orders.size>4)
 })
 check('Can look up a lesson without ambiguous titles',()=>assert.equal(findEnglishLesson('present-simple').title,'Present Simple'))
 console.log('TOTAL_FAILS 0; PASSES',passes)
}catch(e){console.error('TEST_EXCEPTION',e);process.exitCode=1}
finally{fs.rmSync(tmp,{recursive:true,force:true})}
