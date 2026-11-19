const {buildSync}=require('esbuild'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path')
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moymir-practice-'))
try{
 const source=buildSync({entryPoints:[path.resolve(__dirname,'../src/subjects/practiceBank.ts')],platform:'node',format:'cjs',bundle:true,write:false}).outputFiles[0].contents
 const file=path.join(dir,'bank.cjs');fs.writeFileSync(file,source)
 const {MAIN_PRACTICE,practiceCount,allPractice,checkPracticeAnswer,normalizePracticeAnswer,shufflePractice}=require(file)
 let passed=0;const check=(name,fn)=>{fn();passed++;console.log('PASS',name)}
 for(const subject of ['lengua','matematicas','historia','biologia']){
  const chapters=MAIN_PRACTICE[subject],all=allPractice(subject)
  check(subject+' has 8 distinct learning chapters',()=>assert.equal(new Set(chapters.map(c=>c.id)).size,8))
  check(subject+' offers 256 unique original practice tasks',()=>{assert.equal(practiceCount(subject),256);assert.equal(new Set(all.map(x=>x.prompt)).size,256);assert.equal(new Set(all.map(x=>x.id)).size,256)})
  check(subject+' all tasks have keyboard answer and explanation',()=>{for(const item of all){assert.equal(item.type,'input');assert(item.answer.trim());assert(item.explanation.length>12);assert(item.prompt.length>7);assert([1,2,3].includes(item.level));assert(checkPracticeAnswer(item,item.answer))}})
  check(subject+' answer normalization accepts uppercase',()=>{for(const item of all){assert(checkPracticeAnswer(item,item.answer.toUpperCase()),item.id)}})
  check(subject+' blocks blatantly incorrect answer',()=>{for(const item of all)assert(!checkPracticeAnswer(item,'###incorrect###'),item.id)})
  for(const chapter of chapters)check(subject+' chapter '+chapter.id+' contains 32 original tasks',()=>assert.equal(chapter.items.length,32))
 }
 const math=allPractice('matematicas')
 check('math decimal comma and dot equivalence',()=>{const q=math.find(x=>x.answer.includes(','));assert(q);assert(checkPracticeAnswer(q,q.answer.replace(',','.')))})
 check('math fraction equivalent answers accepted',()=>{const q=math.find(x=>x.answer==='3/4');assert(q);assert(checkPracticeAnswer(q,'6/8'))})
 check('numeric units accepted when unambiguous',()=>{const q=math.find(x=>/^\d+$/.test(x.answer));assert(q);assert(checkPracticeAnswer(q,q.answer+' cm'))})
 check('diacritics and punctuation normalized',()=>assert.equal(normalizePracticeAnswer(' ÁrBOL. '),'arbol'))
 check('shuffling is a permutation with stable seed',()=>{const data=[1,2,3,4,5,6,7,8];assert.deepEqual(shufflePractice(data,'x'),shufflePractice(data,'x'));assert.deepEqual(shufflePractice(data,'other').sort(),data)})
 check('different sessions generate distinct question ordering',()=>{const all=math.slice(0,32);const orders=new Set(Array.from({length:50},(_,i)=>shufflePractice(all,'session-'+i).slice(0,6).map(x=>x.id).join(':')));assert(orders.size>40)})
 console.log('TOTAL_FAILS 0; PASSES',passed)
}catch(error){console.error('TEST_EXCEPTION',error);process.exitCode=1}
finally{fs.rmSync(dir,{recursive:true,force:true})}
