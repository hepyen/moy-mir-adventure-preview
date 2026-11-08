import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
const MIN_SECONDS=60;
const MIN_INTERACTIONS=2;
const TARGET_PROGRESS=.94;
type ReadingProgress={seconds:number;depth:number;interactions:number;lastSeen:number};
const blank=():ReadingProgress=>({seconds:0,depth:0,interactions:0,lastSeen:0});
function keyFor(userId:string,date:string){return `moymir-read-v1:${userId}:${date}`}
function load(userId:string,date:string):ReadingProgress{
 if(!userId||!date)return blank();
 try{const x=JSON.parse(localStorage.getItem(keyFor(userId,date))||'null');if(!x)return blank();
  return {seconds:Math.min(7200,Math.max(0,Math.floor(Number(x.seconds)||0))),depth:Math.min(1,Math.max(0,Number(x.depth)||0)),interactions:Math.min(10000,Math.max(0,Math.floor(Number(x.interactions)||0))),lastSeen:0};
 }catch{return blank()}
}
export function useDailyReading(userId:string,date:string,enabled:boolean){
 const[progress,setProgress]=useState<ReadingProgress>(()=>load(userId,date));
 const activeRef=useRef<ReadingProgress>(progress);
 const elementRef=useRef<HTMLElement|null>(null);
 const engagement=useRef(0);
 const contextKey=useMemo(()=>keyFor(userId,date),[userId,date]);
 const persist=useCallback((next:ReadingProgress)=>{
  activeRef.current=next;setProgress(next);
  try{localStorage.setItem(contextKey,JSON.stringify(next))}catch{}
 },[contextKey]);
 useEffect(()=>{const next=load(userId,date);activeRef.current=next;setProgress(next);engagement.current=0},[userId,date]);
 const inspect=useCallback(()=>{
  const node=elementRef.current;if(!node||!enabled)return;
  const viewport=node.closest('.mw-scroll') as HTMLElement|null;
  const bounds=node.getBoundingClientRect();
  const frame=viewport?.getBoundingClientRect()||{top:0,bottom:innerHeight};
  const exposed=Math.max(0,Math.min(bounds.bottom,frame.bottom)-Math.max(bounds.top,frame.top));
  if(exposed<Math.min(42,bounds.height*.3))return;
  // The bottom of the article must have been brought into the reading viewport.
  const readBottom=Math.max(frame.top,Math.min(frame.bottom,bounds.bottom));
  const depth=Math.min(1,Math.max(0,(readBottom-bounds.top)/Math.max(1,bounds.height)));
  if(depth>activeRef.current.depth+.003)persist({...activeRef.current,depth});
 },[enabled,persist]);
 useEffect(()=>{
  if(!enabled)return;
  const article=elementRef.current;if(!article)return;
  const scroller=article.closest('.mw-scroll')||window;
  let lastScroll=0;
  const onScroll=()=>{const a=article.getBoundingClientRect();const f=(article.closest('.mw-scroll') as HTMLElement|null)?.getBoundingClientRect()||{top:0,bottom:innerHeight};if(a.bottom<=f.top||a.top>=f.bottom)return;const now=performance.now();if(now-lastScroll>220){lastScroll=now;engagement.current++;
   const old=activeRef.current;persist({...old,interactions:Math.min(10000,old.interactions+1)})}
   inspect()};
  const onInteraction=()=>{const old=activeRef.current;persist({...old,interactions:Math.min(10000,old.interactions+1)});engagement.current++};
  article.addEventListener('pointerdown',onInteraction,{passive:true});
  article.addEventListener('keydown',onInteraction,{passive:true});
  scroller.addEventListener('scroll',onScroll,{passive:true});
  const resize=()=>inspect();window.addEventListener('resize',resize);
  const interval=setInterval(()=>{
   if(document.visibilityState!=='visible')return;
   const n=elementRef.current;if(!n)return;
   const box=n.getBoundingClientRect(),view=(n.closest('.mw-scroll') as HTMLElement|null)?.getBoundingClientRect()||{top:0,bottom:innerHeight};
   const exposed=Math.max(0,Math.min(box.bottom,view.bottom)-Math.max(box.top,view.top));
   if(exposed<Math.min(60,box.height*.25))return;
   const old=activeRef.current;persist({...old,seconds:Math.min(7200,old.seconds+1),lastSeen:Date.now()});
   inspect();
  },1000);
  inspect();
  return()=>{clearInterval(interval);article.removeEventListener('pointerdown',onInteraction);article.removeEventListener('keydown',onInteraction);scroller.removeEventListener('scroll',onScroll);window.removeEventListener('resize',resize)};
 },[enabled,date,userId,inspect,persist]);
 const secondsLeft=Math.max(0,MIN_SECONDS-progress.seconds);
 const done=progress.seconds>=MIN_SECONDS&&progress.depth>=TARGET_PROGRESS&&progress.interactions>=MIN_INTERACTIONS;
 return {articleRef:elementRef,progress,secondsLeft,done,minimumSeconds:MIN_SECONDS,minimumInteractions:MIN_INTERACTIONS,requiredDepth:TARGET_PROGRESS};
}
