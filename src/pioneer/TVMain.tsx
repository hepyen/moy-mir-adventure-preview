import {useCallback,useState} from 'react';
import {createRoot} from 'react-dom/client';
import bankRaw from './bank.txt?raw';
import {PioneerArena,type PioneerState,type PioneerAnswer,type PioneerHintData,type PioneerHints} from './PioneerArena';

type BankQuestion={id:number;level:number;text:string;choices:string[];reference:string};
type ActiveLocal={id:string;level:number;cycle:number;slot:number;ids:number[];orders:number[][];correct:number;hints:PioneerHints;deadline:number|null};
type LocalData={version:number;used:Record<string,number[]>;cycles:Record<string,number>;plays:Record<string,number>;awards:Record<string,number>;history:PioneerState['history'];active:ActiveLocal|null};
const KEY='moymir-pioneer-tv-2026-v1';
const BANK:BankQuestion[]=bankRaw.trim().split(/\r?\n/).map((line,index)=>{
 const fields=line.split('|');return{id:index+1,level:Math.floor(index/50)+1,text:fields[0],choices:fields.slice(1,5),reference:fields[5]};
});
if(BANK.length!==300||BANK.some(q=>q.choices.length!==4||q.choices.some(c=>!c)))throw Error('Неполный комплект из 300 вопросов');
const initial=():LocalData=>({version:1,used:{},cycles:{},plays:{},awards:{},history:[],active:null});
function load():LocalData{
 try{const v=JSON.parse(localStorage.getItem(KEY)||'null') as LocalData;
  if(v?.version===1&&v.used&&v.cycles&&v.plays&&v.awards&&Array.isArray(v.history)){
   if(v.active&&v.active.deadline===undefined){v.active.deadline=Date.now()+30000;localStorage.setItem(KEY,JSON.stringify(v))}
   return v;
  }
 }catch{}return initial();
}
function randomInt(max:number){
 const cryptoRef=globalThis.crypto;if(cryptoRef?.getRandomValues){const values=new Uint32Array(1);cryptoRef.getRandomValues(values);return values[0]%max}
 return Math.floor(Math.random()*max);
}
function shuffle<T>(input:T[]):T[]{const a=[...input];for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function getData(d:LocalData):PioneerState{
 const awards=Object.entries(d.awards).map(([key,points])=>{
  const[level,slot]=key.split(':').map(Number);return{level,slot,points};
 });
 let unlocked=1;
 for(let l=1;l<6;l++){if(d.history.some(h=>h.level===l&&h.status==='won'&&h.score===10))unlocked=l+1;else break}
 const active=d.active;
 const current=active?BANK.find(q=>q.id===active.ids[active.correct]):null;
 return{total:awards.reduce((s,a)=>s+a.points,0),unlocked,awards,
  cycles:Array.from({length:6},(_,i)=>{const level=i+1;return{level,cycle:d.cycles[level]||1,plays:d.plays[level]||0,used:(d.used[level]||[]).length}}),
  history:d.history,
  active:active&&current?{id:active.id,level:active.level,cycle:active.cycle,slot:active.slot,correct:active.correct,hints:active.hints,deadline:active.deadline?new Date(active.deadline).toISOString():null,question:{
   id:current.id,text:current.text,choices:active.orders[active.correct].map(i=>current.choices[i]),number:active.correct+1
  }}:null
 };
}
function TVGame(){
 const [data,setData]=useState<LocalData>(load);
 const [error,setError]=useState('');
 const save=(next:LocalData)=>{setData(next);localStorage.setItem(KEY,JSON.stringify(next))};
 const run=useCallback(async()=>{},[]);
 async function start(level:number){
  const d=load();if(d.active)return;
  if(level>getData(d).unlocked)throw Error('Пройди предыдущую ступень');
  const used=(d.used[level]||[]).length>=50?[]:[...(d.used[level]||[])];
  const remaining=BANK.filter(q=>q.level===level&&!used.includes(q.id));
  if(remaining.length<10)throw Error('Недостаточно вопросов');
  const ids=shuffle(remaining).slice(0,10).map(q=>q.id);
  const plays=d.plays[level]||0;
  const cycle=used.length===0&&plays>0?(d.cycles[level]||1)+1:(d.cycles[level]||1);
  const slot=plays%5+1;
  d.used[level]=[...used,...ids];d.plays[level]=plays+1;d.cycles[level]=cycle;
  d.active={id:String(Date.now())+'-'+randomInt(1000000),level,cycle,slot,ids,orders:ids.map(()=>shuffle([0,1,2,3])),correct:0,hints:{},deadline:Date.now()+30000};
  save({...d});
 }
 function conclude(d:LocalData,mode:'won'|'lost'|'cashed',score:number){
  if(!d.active)throw Error('Сессия отсутствует');
  const a=d.active,award=mode==='won'?10:score>=5?5:0,key=a.level+':'+a.slot;
  const previous=d.awards[key]||0;
  const delta=Math.max(0,award-previous);
  if(award>previous)d.awards[key]=award;
  d.history=[{id:a.id,level:a.level,score,points:award,newPoints:delta,status:mode,date:new Date().toISOString()},...d.history].slice(0,80);
  d.active=null;
  return{award,newPoints:delta};
 }
 async function answer(attempt:string,question:number,choice:number):Promise<PioneerAnswer>{
  const d=load();const a=d.active;
  if(!a||a.id!==attempt)throw Error('Сессия не найдена');
  if(a.ids[a.correct]!==question)throw Error('Вопрос уже пройден');
  const q=BANK[question-1];
  if(!q||choice<0||choice>3)throw Error('Неверный вариант');
  if(a.deadline===null)throw Error('Нажмите «Следующий вопрос»');
  const expired=Date.now()>=a.deadline;
  const correct=!expired&&a.orders[a.correct][choice]===0;
  const score=a.correct+(correct?1:0),finished=!correct||score===10;
  const result=finished?conclude(d,correct?'won':'lost',score):null;
  if(!finished){a.correct=score;a.deadline=null;}
  if(finished)localStorage.setItem(KEY,JSON.stringify(d));else save({...d});
  return{correct,expired,answer:q.choices[0],reference:q.reference,finished,status:correct?(finished?'won':'active'):'lost',saved:result?result.award:score>=5?5:0,newPoints:result?.newPoints||0};
 }
 async function hint(attempt:string,type:'half'|'audience'|'scripture'):Promise<PioneerHintData>{
  const d=load(),a=d.active;if(!a||a.id!==attempt)throw Error('Сессия не найдена');
  if(a.hints[type])return a.hints[type]!;
  const q=BANK[a.ids[a.correct]-1],order=a.orders[a.correct],correct=order.indexOf(0);
  let value:PioneerHintData;
  if(type==='half')value={question:q.id,visible:[correct,shuffle([0,1,2,3].filter(i=>i!==correct))[0]]};
  else if(type==='scripture')value={question:q.id,reference:q.reference};
  else{
   const big=55+randomInt(24),rem=100-big;
   const splits=[randomInt(rem+1),0,0];splits[1]=randomInt(rem-splits[0]+1);splits[2]=rem-splits[0]-splits[1];
   const votes=Array(4).fill(0);votes[correct]=big;shuffle([0,1,2,3].filter(i=>i!==correct)).forEach((n,i)=>{votes[n]=splits[i]});
   value={question:q.id,votes,simulated:true};
  }
  a.hints={...a.hints,[type]:value};save({...d});return value;
 }
 async function advance(attempt:string){
  const d=load();if(!d.active||d.active.id!==attempt)throw Error('Сессия завершена');
  if(d.active.deadline===null)d.active.deadline=Date.now()+30000;
  save({...d});
 }
 async function timeout(attempt:string,question:number):Promise<PioneerAnswer|null>{
  const d=load(),a=d.active;
  if(!a||a.id!==attempt||a.ids[a.correct]!==question||!a.deadline||Date.now()<a.deadline)return null;
  const q=BANK[question-1];
  const reply=conclude(d,'lost',a.correct);
  localStorage.setItem(KEY,JSON.stringify(d));
  return{correct:false,expired:true,answer:q.choices[0],reference:q.reference,finished:true,status:'lost',saved:reply.award,newPoints:reply.newPoints};
 }
 async function cashout(attempt:string){
  const d=load();if(!d.active||d.active.id!==attempt)throw Error('Сессия завершена');
  const result=conclude(d,'cashed',d.active.correct);localStorage.setItem(KEY,JSON.stringify(d));return{saved:result.award,newPoints:result.newPoints};
 }
 return <PioneerArena tv state={getData(data)} role="child" start={start} answer={answer} hint={hint} cashout={cashout} advance={advance} timeout={timeout} reload={async()=>{setData(load())}} error={error}/>;
}
document.addEventListener('DOMContentLoaded',()=>{
 const root=document.getElementById('root');if(root)createRoot(root).render(<TVGame/>);
});

