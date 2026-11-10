import {useCallback,useEffect,useRef,useState} from 'react';
import {supabase} from '../lib/supabase';

export type HealthMeal={breakfast:string;lunch:string;dinner:string;snack:string};
export type HealthPlan={meals:HealthMeal[];bed:string;wake:string;allergies:string[];notes:string};
export type HealthDaily={date:string;habits:string[];mood:string;energy:string;sleepQuality:string};
export type GardenDecoration={slot:number;kind:string};
export type MealProposal={id:string;weekday:number;mealKind:keyof HealthMeal;suggestion:string;status:'pending'|'approved'|'rejected';createdAt:string};
const DEFAULT_PLAN:HealthPlan={meals:[],bed:'21:00',wake:'06:45',allergies:[],notes:''};
const dayNow=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const VALID_HABITS=new Set(['morning','breakfast','water','movement','evening','family_walk','family_cook','family_game']);
const VALID_MOODS=new Set(['','good','ok','rest']);
const VALID_ENERGY=new Set(['','high','normal','low']);
const VALID_SLEEP=new Set(['','great','ok','poor']);
const PLANTS=new Set(['flower','tree','bench','lantern','path','pond','fence','mailbox','apple']);
function read<T>(key:string,initial:T):T{try{const x=JSON.parse(localStorage.getItem(key)||'null');return x===null?initial:x as T}catch{return initial}}
function write(key:string,x:unknown){try{localStorage.setItem(key,JSON.stringify(x))}catch{}}
function dailySafe(x:HealthDaily):HealthDaily{
 return {date:x.date,habits:[...new Set(x.habits.filter(v=>VALID_HABITS.has(v)))].slice(0,8),
  mood:VALID_MOODS.has(x.mood)?x.mood:'',energy:VALID_ENERGY.has(x.energy)?x.energy:'',
  sleepQuality:VALID_SLEEP.has(x.sleepQuality)?x.sleepQuality:''};
}
const fromDaily=(r:any):HealthDaily=>({date:r.activity_date,habits:Array.isArray(r.habits)?r.habits:[],mood:r.mood||'',energy:r.energy||'',sleepQuality:r.sleep_quality||''});
const fromPlan=(r:any):HealthPlan=>({meals:Array.isArray(r.meals)?r.meals:[],bed:String(r.bed_time||'21:00').slice(0,5),wake:String(r.wake_time||'06:45').slice(0,5),allergies:Array.isArray(r.allergies)?r.allergies:[],notes:String(r.notes||'')});
const fromProposal=(r:any):MealProposal=>({id:r.id,weekday:r.weekday,mealKind:r.meal_kind,suggestion:r.suggestion,status:r.status,createdAt:r.created_at});
const validGarden=(x:GardenDecoration[])=>x.filter(i=>Number.isInteger(i.slot)&&i.slot>=0&&i.slot<16&&PLANTS.has(i.kind)).slice(0,16);

export function useHealthFamily(familyId:string|undefined,childId:string,parent:boolean){
 const account=familyId&&childId?familyId+':'+childId:childId||'local-ilya';
 const prefix='moymir-health-cloud-v1:'+account+':';
 const [cache,setCache]=useState<{account:string;plan:HealthPlan|null;daily:HealthDaily[];garden:GardenDecoration[];requests:MealProposal[]}>(
  ()=>({account,plan:read(prefix+'plan',null),daily:read(prefix+'daily',[]),garden:read(prefix+'garden',[]),requests:read(prefix+'requests',[])}));
 const data=cache.account===account?cache:{account,plan:read(prefix+'plan',null),daily:read(prefix+'daily',[]),garden:read(prefix+'garden',[]),requests:read(prefix+'requests',[])};
 const [status,setStatus]=useState('');const [working,setWorking]=useState(false);const [loaded,setLoaded]=useState(false);
 const busy=useRef(false);
 const sending=useRef(false);
 const connected=!!familyId&&!!childId&&!!supabase;
 const saveCache=(next:typeof data)=>{
  write(prefix+'plan',next.plan);write(prefix+'daily',next.daily);write(prefix+'garden',next.garden);write(prefix+'requests',next.requests);
  setCache(next);
 };
 const today=data.daily.find(x=>x.date===dayNow())||null;
 const pendingQueueKey=prefix+'queue';
 type Pending={queueId?:string;type:'plan'|'daily'|'garden'|'proposal';value:any};
 const enqueue=(task:Pending)=>{
  const unique={...task,queueId:Date.now()+'-'+Math.random().toString(36).slice(2)};
  const previous=read<Pending[]>(pendingQueueKey,[]);
  const keep=previous.filter(old=>old.type==='proposal'||task.type==='proposal'
    ||old.type!==task.type||(task.type==='daily'&&old.value.date!==task.value.date));
  write(pendingQueueKey,[...keep,unique].slice(-110));
 };
 const transact=async(task:Pending)=>{
  if(!connected||!supabase)throw Error('Нет семейного подключения');
  if(task.type==='plan'){
   if(!parent)throw Error('Меню и время сна утверждает родитель');
   const v=task.value as HealthPlan;
   const {error}=await supabase.from('moymir_health_plan').upsert({
    family_id:familyId,child_id:childId,meals:v.meals,bed_time:v.bed,wake_time:v.wake,
    allergies:v.allergies,notes:v.notes,updated_at:new Date().toISOString()
   },{onConflict:'family_id,child_id'});if(error)throw error;
  }else if(task.type==='daily'){
   const v=dailySafe(task.value as HealthDaily);
   const {error}=await supabase.from('moymir_health_daily').upsert({
    family_id:familyId,child_id:childId,activity_date:v.date,habits:v.habits,mood:v.mood,energy:v.energy,
    sleep_quality:v.sleepQuality,updated_at:new Date().toISOString()
   },{onConflict:'family_id,child_id,activity_date'});if(error)throw error;
  }else if(task.type==='garden'){
   const {error}=await supabase.from('moymir_health_garden').upsert({
    family_id:familyId,child_id:childId,placements:validGarden(task.value as GardenDecoration[]),updated_at:new Date().toISOString()
   },{onConflict:'family_id,child_id'});if(error)throw error;
  }else if(task.type==='proposal'){
   const v=task.value as Omit<MealProposal,'id'|'status'|'createdAt'>;
   const {error}=await supabase.from('moymir_health_meal_requests').insert({
    family_id:familyId,child_id:childId,weekday:v.weekday,meal_kind:v.mealKind,
    suggestion:v.suggestion.trim(),status:'pending'
   });if(error&&error.code!=='23505')throw error;
  }
 };
 const flush=async():Promise<boolean>=>{
  if(!connected)return false;
  if(sending.current)return false;
  sending.current=true;
  let succeeded=true;
  try{
   for(let i=0;i<120;i++){
    const queue=read<Pending[]>(pendingQueueKey,[]);
    if(!queue.length)break;
    const first=queue[0];
    try{await transact(first)}
    catch(e){
     succeeded=false;
     setStatus('📱 Изменения сохранены на телефоне. Отправлю после восстановления связи: '+(e instanceof Error?e.message:'ошибка сети'));
     break;
    }
    // Newer user actions may have replaced this task while its network request was in flight.
    const current=read<Pending[]>(pendingQueueKey,[]);
    write(pendingQueueKey,current.filter(x=>x.queueId!==first.queueId));
   }
  }finally{sending.current=false}
  if(succeeded)setStatus('☁️ Изменения сохранены в семейном аккаунте');
  return succeeded;
 };
 const publish=async(task:Pending):Promise<boolean>=>{
  // Write-ahead queue: survives process crashes, app exits and loss of network.
  enqueue(task);
  if(!connected){setStatus('📱 Сохранено только на устройстве, нужен семейный аккаунт');return false}
  return await flush();
 };
 const refresh=useCallback(async()=>{
  if(!connected||!supabase||busy.current)return;
  busy.current=true;setWorking(true);
  try{
   const [p,d,g,r]=await Promise.all([
    supabase.from('moymir_health_plan').select('meals,bed_time,wake_time,allergies,notes').eq('family_id',familyId!).eq('child_id',childId).maybeSingle(),
    supabase.from('moymir_health_daily').select('activity_date,habits,mood,energy,sleep_quality').eq('family_id',familyId!).eq('child_id',childId).order('activity_date',{ascending:false}).limit(95),
    supabase.from('moymir_health_garden').select('placements').eq('family_id',familyId!).eq('child_id',childId).maybeSingle(),
    supabase.from('moymir_health_meal_requests').select('id,weekday,meal_kind,suggestion,status,created_at').eq('family_id',familyId!).eq('child_id',childId).order('created_at',{ascending:false}).limit(60)
   ]);
   for(const x of [p,d,g,r])if(x.error)throw x.error;
   const old=read<Pending[]>(pendingQueueKey,[]);
   // Do not erase offline changes when server has an earlier snapshot.
   const nextPlan=old.some(q=>q.type==='plan')?read<HealthPlan|null>(prefix+'plan',null):p.data?fromPlan(p.data):read<HealthPlan|null>(prefix+'plan',null);
   const serverDays=(d.data||[]).map(fromDaily);
   const localDays=read<HealthDaily[]>(prefix+'daily',[]);
   const combined=new Map(serverDays.map(v=>[v.date,v]));
   for(const q of old.filter(v=>v.type==='daily'))combined.set(q.value.date,dailySafe(q.value));
   // Legacy local data can be uploaded explicitly later rather than overwriting server history.
   const nextDays=[...combined.values()].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,95);
   const nextGarden=old.some(q=>q.type==='garden')?read<GardenDecoration[]>(prefix+'garden',[]):g.data?validGarden(g.data.placements||[]):read<GardenDecoration[]>(prefix+'garden',[]);
   const nextRequests=(r.data||[]).map(fromProposal);
   const next={account,plan:nextPlan,daily:nextDays.length?nextDays:localDays,garden:nextGarden,requests:nextRequests};
   saveCache(next);setStatus(old.length?'Есть сохранённые офлайн-изменения, синхронизирую…':'☁️ Семейные данные обновлены');
   await flush();
   if(!p.data&&parent&&!old.some(q=>q.type==='plan')&&read(prefix+'plan',null))await transact({type:'plan',value:read(prefix+'plan',null)});
  }catch(e){setStatus('Офлайн-режим: используются записи этого телефона. '+(e instanceof Error?e.message:''))}
  finally{busy.current=false;setWorking(false);setLoaded(true)}
 },[account,prefix,connected,familyId,childId,parent]);
 useEffect(()=>{void refresh()},[refresh]);
 useEffect(()=>{
  const onLine=()=>void refresh();
  const onFocus=()=>{if(!document.hidden)void refresh()};
  window.addEventListener('online',onLine);document.addEventListener('visibilitychange',onFocus);
  const poll=window.setInterval(onFocus,90000);
  return()=>{window.removeEventListener('online',onLine);document.removeEventListener('visibilitychange',onFocus);window.clearInterval(poll)};
 },[refresh]);
 function updatePlan(next:HealthPlan){
  if(!parent)return;
  const v={...next,allergies:next.allergies.map(x=>x.slice(0,70)).slice(0,15),notes:''}; // parent-only health notes stay local, never exposed to child's plan API.
  saveCache({...data,plan:v});
  void publish({type:'plan',value:v});
 }
 function updateDaily(next:HealthDaily){
  const v=dailySafe(next);
  saveCache({...data,daily:[v,...data.daily.filter(x=>x.date!==v.date)].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,95)});
  void publish({type:'daily',value:v});
 }
 function updateGarden(next:GardenDecoration[]){
  const placements=validGarden(next);
  saveCache({...data,garden:placements});
  void publish({type:'garden',value:placements});
 }
 async function propose(weekday:number,mealKind:keyof HealthMeal,suggestion:string){
  if(!connected)throw Error('Предложения блюд отправляются через семейный аккаунт. Подключитесь к интернету.');
  if(suggestion.trim().length<2||suggestion.trim().length>160)throw Error('Название блюда должно содержать от 2 до 160 символов');
  const sent=await publish({type:'proposal',value:{weekday,mealKind,suggestion}});
  if(sent)await refresh();
  else throw Error('Предложение сохранено на телефоне и будет отправлено после подключения');
 }
 async function decide(request:MealProposal,approve:boolean){
  if(!parent||!connected||!supabase)throw Error('Решение по меню принимает родитель в семейном аккаунте');
  if(approve){
   const plan=data.plan||DEFAULT_PLAN;
   const meals=[...plan.meals];
   if(!meals[request.weekday])throw Error('Сначала заполните недельное меню');
   meals[request.weekday]={...meals[request.weekday],[request.mealKind]:request.suggestion};
   await transact({type:'plan',value:{...plan,meals}});
   saveCache({...data,plan:{...plan,meals}});
  }
  const {error}=await supabase.from('moymir_health_meal_requests').update({
   status:approve?'approved':'rejected',resolved_at:new Date().toISOString()
  }).eq('id',request.id).eq('family_id',familyId!).eq('child_id',childId).eq('status','pending');
  if(error)throw error;
  await refresh();
 }
 return {plan:data.plan,today,days:data.daily,garden:data.garden,requests:data.requests,status,working,loaded,connected,
  updatePlan,updateDaily,updateGarden,propose,decide,refresh};
}
