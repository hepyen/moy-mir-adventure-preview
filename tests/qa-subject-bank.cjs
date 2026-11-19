const assert=require('node:assert/strict')
const {buildSync}=require('esbuild'),fs=require('node:fs'),path=require('node:path'),os=require('node:os')
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moymir-subject-bank-'))
try{
 const js=buildSync({entryPoints:[path.resolve(__dirname,'../src/subjects/subjects.ts')],platform:'node',format:'cjs',bundle:true,write:false}).outputFiles[0].contents
 const filename=path.join(dir,'subjects.cjs');fs.writeFileSync(filename,js)
 const {SUBJECTS,ALL_SUBJECT_LESSONS,getSubjectLesson}=require(filename)
 const sql=fs.readFileSync(path.join(__dirname,'../db/subject_tutors_4_1.sql'),'utf8')
 const banks=new Map([...sql.matchAll(/\('([a-z-]+:[a-z-]+)',array\[([0-2,]+)\]\)/g)].map(m=>[m[1],m[2].split(',').map(Number)]))
 let passes=0;const check=(name,fn)=>{fn();passes++;console.log('PASS',name)}
 check('all nine subjects registered',()=>assert.equal(SUBJECTS.length,9))
 check('every lesson uses namespaced ID',()=>assert(ALL_SUBJECT_LESSONS.every(l=>l.id.includes(':'))))
 check('all lesson keys unique',()=>assert.equal(new Set(ALL_SUBJECT_LESSONS.map(l=>l.id)).size,ALL_SUBJECT_LESSONS.length))
 check('all server answer banks match client content',()=>assert.equal(banks.size,ALL_SUBJECT_LESSONS.length))
 for(const subject of SUBJECTS){
  check(subject.name+' diagnostics non-awarded and labeled',()=>{
   assert.equal(subject.diagnostic.id,subject.id+':diagnostic');assert.equal(subject.diagnostic.questions.length,subject.lessons.length*3)
  })
  check(subject.name+' has multiple guided lessons',()=>assert(subject.lessons.length>=2))
  for(const lesson of [subject.diagnostic,...subject.lessons]){
   check(lesson.id+' server keys agree with exercise sequence',()=>assert.deepEqual(lesson.questions.map(x=>x.correct),banks.get(lesson.id)))
   check(lesson.id+' has valid options, labels and pedagogical notes',()=>{
    assert(lesson.questions.length>=6);assert.equal(getSubjectLesson(lesson.id),lesson)
    for(const item of lesson.questions){assert.equal(item.options.length,3);assert.equal(new Set(item.options).size,3);assert([0,1,2].includes(item.correct));assert(item.explain.length>3);assert(item.prompt.length>8)}
   })
  }
 }
 check('all departments have authorized answer bank content',()=>assert.equal(ALL_SUBJECT_LESSONS.reduce((n,l)=>n+l.questions.length,0),252))
 console.log('TOTAL_FAILS 0; PASSES',passes)
}catch(e){console.error('TEST_EXCEPTION',e);process.exitCode=1}
finally{fs.rmSync(dir,{recursive:true,force:true})}
