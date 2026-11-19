/** Pure-logic regression: prevents a decoration editor from overwriting the child's saved progress. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {buildSync}=require('esbuild');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'moymir-decor-'));
const target=path.join(dir,'world-decor.cjs');
try{
 const compiled=buildSync({entryPoints:[path.resolve(__dirname,'../src/legacyWorld/worldDecor.ts')],bundle:true,platform:'node',format:'cjs',write:false});
 fs.writeFileSync(target,compiled.outputFiles[0].contents);
 const {DECOR_SPECS,validateDecorSpot,layoutStorageKey,readDecorLayout,saveDecorLayout,decorPosition}=require(target);
 let passes=0;const check=(label,fn)=>{fn();passes++;console.log('PASS',label)};
 const store=new Map();global.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>{store.set(k,v)},removeItem:k=>store.delete(k)};
 for(const world of [1,2])for(const item of DECOR_SPECS[world]){
  check(`world ${world} ${item.id} starts in a valid place`,()=>assert.equal(validateDecorSpot(world,1600,{},item.id,item.default.x,item.default.z),null));
  check(`world ${world} ${item.id} cannot be placed before unlock`,()=>assert.match(validateDecorSpot(world,item.unlock-1,{},item.id,item.default.x,item.default.z),/не открыт/));
 }
 check('outside island is blocked',()=>assert.match(validateDecorSpot(1,1600,{},'flowerpot',3,0),/краю/));
 check('cottage cannot be blocked',()=>assert.match(validateDecorSpot(1,1600,{},'flowerpot',.65,0),/Домик/));
 check('tree trunk cannot be blocked',()=>assert.match(validateDecorSpot(1,1600,{},'flowerpot',-1.35,-.54),/дерева/));
 check('pond cannot be blocked',()=>assert.match(validateDecorSpot(1,1600,{},'flowerpot',1.6,1.35),/пруд/));
 check('treehouse trunk cannot be blocked',()=>assert.match(validateDecorSpot(2,1600,{},'flowerpot',-.12,-.25),/ствол/));
 check('other decorations cannot overlap',()=>assert.match(validateDecorSpot(1,1600,{},'flowerpot',2.18,-.87),/другому/));
 check('free grass accepts decoration',()=>assert.equal(validateDecorSpot(1,1600,{},'flowerpot',-.5,1.35),null));
 check('save/load layout is child-and-world-specific',()=>{
  const first=layoutStorageKey('qa-child',1),second=layoutStorageKey('qa-child',2),other=layoutStorageKey('parent',1);
  assert.notEqual(first,second);assert.notEqual(first,other);
  assert.equal(saveDecorLayout(first,{flowerpot:{x:-.5,z:1.35}}),true);
  assert.deepEqual(readDecorLayout(first),{flowerpot:{x:-.5,z:1.35}});
  assert.deepEqual(readDecorLayout(second),{});
  assert.deepEqual(readDecorLayout(other),{});
  assert.deepEqual(decorPosition(1,readDecorLayout(first),'flowerpot'),{x:-.5,z:1.35});
 });
 check('corrupt or oversized stored points are rejected',()=>{
  const k=layoutStorageKey('qa-child',2);
  localStorage.setItem(k,JSON.stringify({bench:{x:1e50,z:0},flowerpot:{x:'hack',z:0},lamp:{x:-1.2,z:0}}));
  assert.deepEqual(readDecorLayout(k),{lamp:{x:-1.2,z:0}});
  localStorage.setItem(k,'{invalid');assert.deepEqual(readDecorLayout(k),{});
 });
 console.log('TOTAL_FAILS 0; PASSES',passes);
}catch(error){console.error(error);process.exitCode=1}
finally{fs.rmSync(dir,{recursive:true,force:true});delete global.localStorage}
