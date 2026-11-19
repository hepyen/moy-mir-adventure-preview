const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{buildSync}=require('esbuild');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'moymir-guided-'))
try{
 const bundle=buildSync({entryPoints:[path.resolve(__dirname,'../src/english/guidedFeedback.tsx')],bundle:true,platform:'node',format:'cjs',write:false,loader:{'.css':'empty'}}).outputFiles[0]
 const filepath=path.join(tmp,'guided.cjs');fs.writeFileSync(filepath,bundle.contents)
 const {blankGuided,recordGuidedChoice,restoreGuided,readyToSubmit,masteredCount}=require(filepath)
 const sourceBank=buildSync({entryPoints:[path.resolve(__dirname,'../src/subjects/subjects.ts')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].contents
 const subjectsFile=path.join(tmp,'subjects.cjs');fs.writeFileSync(subjectsFile,sourceBank)
 const {ALL_SUBJECT_LESSONS}=require(subjectsFile)
 const ruleFile=path.join(tmp,'rules.cjs');fs.writeFileSync(ruleFile,buildSync({entryPoints:[path.resolve(__dirname,'../src/english/teachingRulesRu.ts')],bundle:true,platform:'node',format:'cjs',write:false}).outputFiles[0].contents)
 const {russianTeachingRule,TEACHING_RULES_RU}=require(ruleFile)
 const question={prompt:'She ___ her homework',options:['do','does','doing'],correct:1,explain:'She takes does.',topic:'eng2'}
 let passed=0;const test=(name,fn)=>{fn();passed++;console.log('PASS',name)}
 test('all 28 subject topics have Russian pedagogical explanations',()=>{assert.equal(Object.keys(TEACHING_RULES_RU).length,28);for(const l of ALL_SUBJECT_LESSONS.filter(x=>!x.id.endsWith(':diagnostic'))){const rule=russianTeachingRule(l);assert.equal(rule,TEACHING_RULES_RU[l.id]);assert(rule.length>75,l.id)}})
 test('initial progress is blank',()=>{const s=blankGuided(30);assert.equal(s.first.length,30);assert.equal(masteredCount(s),0);assert(!readyToSubmit(s,30))})
 const original=blankGuided(1)
 const wrong=recordGuidedChoice(original,0,0,question,false)
 test('first wrong answer is recorded once and flagged for correction',()=>{assert.equal(wrong.first[0],0);assert.equal(wrong.last[0],0);assert.equal(wrong.wrong[0],1);assert.equal(wrong.mastered[0],false)})
 test('incorrect answer cannot be skipped as mastered',()=>assert(!readyToSubmit(wrong,1)))
 const fixed=recordGuidedChoice(wrong,0,1,question,false)
 test('correction marks question mastered but keeps original mistake',()=>{assert.equal(fixed.first[0],0);assert.equal(fixed.last[0],1);assert.equal(fixed.mastered[0],true);assert(readyToSubmit(fixed,1))})
 test('after mastering answer cannot be changed to inflate grade',()=>assert.strictEqual(recordGuidedChoice(fixed,0,2,question,false),fixed))
 const secondWrong=recordGuidedChoice(wrong,0,2,question,false)
 test('second wrong attempt unlocks review but keeps first wrong',()=>{assert.equal(secondWrong.first[0],0);assert.equal(secondWrong.wrong[0],2);assert(secondWrong.mastered[0])})
 const direct=recordGuidedChoice(original,0,1,question,false)
 test('correct first attempt is mastered and full credit',()=>{assert.equal(direct.first[0],1);assert.equal(direct.wrong[0],0);assert(direct.mastered[0])})
 const diag=recordGuidedChoice(original,0,0,question,true)
 test('diagnostic captures incorrect answer without teaching until score',()=>{assert(diag.mastered[0]);assert.equal(diag.first[0],0)})
 test('v4.2 legacy draft can resume without lost selections',()=>{const loaded=restoreGuided([1,0,null],3);assert.deepEqual(loaded.first,[1,0,null]);assert.equal(masteredCount(loaded),2)})
 test('new structured draft preserves first wrong and correction',()=>{const loaded=restoreGuided(JSON.parse(JSON.stringify(fixed)),1);assert.deepEqual(loaded,fixed)})
 test('invalid imported answers are discarded',()=>{const loaded=restoreGuided([9,4,-1],3);assert.deepEqual(loaded.first,[null,null,null])})
 test('answers from different questions remain independent',()=>{let data=blankGuided(2);data=recordGuidedChoice(data,0,0,question,false);data=recordGuidedChoice(data,1,1,question,false);assert.deepEqual(data.first,[0,1]);assert.deepEqual(data.mastered,[false,true])})
 console.log('TOTAL_FAILS 0; PASSES',passed)
}catch(e){console.error('TEST_EXCEPTION',e);process.exitCode=1}finally{fs.rmSync(tmp,{recursive:true,force:true})}
