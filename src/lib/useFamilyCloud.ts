import {useCallback,useEffect,useRef,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {supabase} from './supabase';
type Row=Record<string,any>;
export type WeeklyOverview={tasks7:number;daily7:number;spiritual7:number;homework7:number;today:string};
const weeklyEmpty:WeeklyOverview={tasks7:0,daily7:0,spiritual7:0,homework7:0,today:''};
export type CloudItem={id:string;title:string;points:number;icon?:string;status?:string;cost?:number;weekdays?:number[];active?:boolean};
const empty={weekly:weeklyEmpty,worldPoints:0,worldNumber:1 as number,balance:0,earned:0,spent:0,deducted:0,spiritualPoints:0,daily:[] as CloudItem[],dailyTemplates:[] as CloudItem[],tasks:[] as CloudItem[],rewards:[] as CloudItem[],proposals:[] as Row[],spiritual:[] as Row[],behavior:[] as Row[],rewardRequests:[] as Row[],pendingSpiritual:[] as Row[],activity:[] as Row[],dailyDone:[] as Row[]};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
type OfflineFamily={familyId:string;childId:string;role:'parent'|'child';childName:string;worldPoints:number;balance:number;worldNumber:number;spiritualPoints:number};
const offlineKey=(uid:string)=>'moymir-family-offline-'+uid;
function readOffline(uid:string):OfflineFamily|null{
 try{const raw=JSON.parse(localStorage.getItem(offlineKey(uid))||'null') as OfflineFamily|null;
  if(!raw||!raw.familyId||!raw.childId||!['parent','child'].includes(raw.role))return null;
  return raw;
 }catch{return null}
}
function writeOffline(uid:string,data:OfflineFamily){try{localStorage.setItem(offlineKey(uid),JSON.stringify(data))}catch{}}

export function useFamilyCloud(){
 const [session,setSession]=useState<Session|null>(null);
 const [role,setRole]=useState<'parent'|'child'|null>(null);
 const [familyId,setFamilyId]=useState('');const [childId,setChildId]=useState('');
 const [childName,setChildName]=useState('Илья');const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const [data,setData]=useState(empty);
 const currentUser=useRef<string|null>(null);
 const fetchSerial=useRef(0);
 useEffect(()=>{if(!supabase){setLoading(false);setError('Семейная база недоступна');return}
  let alive=true;void supabase.auth.getSession().then(({data})=>{if(alive){currentUser.current=data.session?.user.id||null;setSession(data.session);setLoading(false)}}).catch(()=>alive&&setLoading(false));
  const {data:sub}=supabase.auth.onAuthStateChange((_ev,s)=>{if(!alive)return;const nextId=s?.user.id||null;if(currentUser.current!==nextId){fetchSerial.current++;setRole(null);setFamilyId('');setChildId('');setData(empty);setError('')}currentUser.current=nextId;setSession(s)});
  return()=>{alive=false;sub.subscription.unsubscribe()};
 },[]);
 const refresh=useCallback(async()=>{
  if(!supabase||!session){fetchSerial.current++;setRole(null);setFamilyId('');setChildId('');setData(empty);return}
  const serial=++fetchSerial.current;
  try{
   const uid=session.user.id;
   const member=await supabase.from('family_members').select('family_id,role').eq('user_id',uid).limit(1).maybeSingle();
   if(member.error)throw member.error;
   if(!member.data){setError('Аккаунт пока не привязан к семье');setRole(null);setFamilyId('');try{localStorage.removeItem(offlineKey(uid))}catch{}return}
   const fid=member.data.family_id as string;const r=member.data.role as 'parent'|'child';
   const people=r==='parent'?await supabase.from('family_members').select('user_id').eq('family_id',fid).eq('role','child').limit(5):{data:[{user_id:uid}],error:null};
   if(people.error)throw people.error;
   const child=people.data?.[0]?.user_id as string|undefined;
   if(!child){setError('В этой семье пока не подключён ребёнок');setRole(r);return}
   const [overview,dailyt,done,tasks,sub,rewards,requests,behaviors,spiritual,extra,proposals,world,profile]=await Promise.all([
     supabase.rpc('moymir_family_overview',{p_family:fid,p_child:child}),
     supabase.from('daily_chore_templates').select('id,title,icon,points,active,weekdays').eq('family_id',fid).eq('child_id',child),
     supabase.from('daily_chore_completions').select('id,template_id,activity_date,status,points_awarded').eq('family_id',fid).eq('child_id',child).gte('activity_date',new Date(Date.parse(today()+'T12:00:00Z')-6*86400000).toISOString().slice(0,10)),
     supabase.from('tasks').select('id,title,points,assigned_child').eq('family_id',fid),
     supabase.from('task_submissions').select('id,task_id,child_id,activity_date,status,submitted_at').eq('child_id',child).gte('activity_date',new Date(Date.parse(today()+'T12:00:00Z')-6*86400000).toISOString().slice(0,10)).order('submitted_at',{ascending:true}),
     supabase.from('rewards').select('id,title,cost,active').eq('family_id',fid),
     supabase.from('reward_requests').select('id,reward_id,cost_snapshot,status,mystery_prize').eq('family_id',fid).eq('child_id',child),
     supabase.from('behavior_points').select('id,amount,category,reason,cancelled_at,created_at').eq('family_id',fid).eq('child_id',child),
     supabase.from('spiritual_activity_records').select('id,activity_date,step_id,points').eq('family_id',fid).eq('child_id',child).gte('activity_date',new Date(Date.parse(today()+'T12:00:00Z')-6*86400000).toISOString().slice(0,10)),
     supabase.from('spiritual_point_requests').select('id,title,proposed_points,approved_points,status').eq('family_id',fid).eq('child_id',child),
     supabase.from('child_task_proposals').select('id,title,proposed_points,approved_points,status').eq('family_id',fid).eq('child_id',child),
     supabase.from('child_world_progress').select('active_world').eq('family_id',fid).eq('child_id',child),
     supabase.from('family_child_profiles').select('display_name').eq('family_id',fid).eq('child_id',child).maybeSingle()
   ]);
   for(const response of [overview,dailyt,done,tasks,sub,rewards,requests,behaviors,spiritual,extra,proposals,world,profile])if(response.error)throw response.error;
   const day=today();const weekday=new Date(day+'T12:00:00').getDay();
   // All-time totals are aggregated in Postgres, not truncated at the REST 1,000-row boundary.
   const totals=overview.data as Record<string,unknown>|null;
   if(!totals||typeof totals.worldPoints!=='number'||typeof totals.balance!=='number')throw new Error('Сервер не вернул итоговые баллы');
   const earned=Number(totals.earned||0),lifetime=Number(totals.worldPoints||0),spent=Number(totals.spent||0),deducted=Number(totals.deducted||0);
   const spiritualPoints=Number(totals.spiritualPoints||0);
   const weekly:WeeklyOverview={tasks7:Number(totals.tasks7||0),daily7:Number(totals.daily7||0),spiritual7:Number(totals.spiritual7||0),homework7:Number(totals.homework7||0),today:String(totals.today||day)};
   const dmap=new Map((done.data??[]).filter(x=>x.activity_date===day).map(x=>[x.template_id,x]));
   const tmap=new Map((sub.data??[]).filter(x=>x.activity_date===day).map(x=>[x.task_id,x]));
   const dailyTemplates=(dailyt.data??[]).map(x=>({id:x.id,title:x.title,points:x.points,icon:x.icon,active:x.active,weekdays:x.weekdays,status:dmap.get(x.id)?.status||'open'}));
   const daily=dailyTemplates.filter(x=>x.active&&x.weekdays?.includes(weekday));
   const taskItems=(tasks.data??[]).filter(x=>x.assigned_child===child).map(x=>({id:x.id,title:x.title,points:x.points,status:tmap.get(x.id)?.status||'open'}));
   const items=(rewards.data??[]).filter(x=>r==='parent'||x.active).map(x=>({id:x.id,title:x.title,points:0,cost:x.cost,active:x.active}));
   if(serial!==fetchSerial.current||currentUser.current!==uid)return;
   setData({weekly,worldPoints:lifetime,worldNumber:world.data?.[0]?.active_world===2?2:1,balance:Number(totals.balance||0),earned,spent,deducted,spiritualPoints,daily,dailyTemplates,tasks:taskItems,rewards:items,proposals:proposals.data??[],spiritual:spiritual.data??[],behavior:behaviors.data??[],rewardRequests:requests.data??[],pendingSpiritual:extra.data??[],activity:sub.data??[],dailyDone:done.data??[]});
   const childLabel=profile.data?.display_name||'Илья';
   setFamilyId(fid);setChildId(child);setRole(r);setChildName(childLabel);setError('');
   writeOffline(uid,{familyId:fid,childId:child,role:r,childName:childLabel,worldPoints:lifetime,balance:Number(totals.balance||0),worldNumber:world.data?.[0]?.active_world===2?2:1,spiritualPoints});
  }catch(e){
   if(serial!==fetchSerial.current||currentUser.current!==session.user.id)return;
   const msg=e instanceof Error?e.message:String(e);
   const offline=typeof navigator!=='undefined'&&!navigator.onLine||/failed to fetch|fetch failed|network|offline|load failed|timeout|socket/i.test(msg);
   const cached=offline?readOffline(session.user.id):null;
   if(cached){
    setFamilyId(cached.familyId);setChildId(cached.childId);setRole(cached.role);setChildName(cached.childName);
    setData(prev=>({...prev,worldPoints:cached.worldPoints,balance:cached.balance,worldNumber:cached.worldNumber,spiritualPoints:cached.spiritualPoints}));
    setError('Нет связи с сервером. Показываем сохранённые данные; изменения доступны после подключения.');
   }else setError(msg||'Не удаётся загрузить семейные данные');
  }
 },[session]);
 useEffect(()=>{void refresh()},[refresh]);
 useEffect(()=>{if(!session)return;
  let last=0;
  const refreshWhenVisible=()=>{if(document.visibilityState!=='visible')return;const now=Date.now();if(now-last<1200)return;last=now;void refresh()};
  // Cross-device updates are eventually consistent; polling remains a fallback when Realtime is unavailable.
  const interval=setInterval(refreshWhenVisible,90000);
  const onFocus=()=>refreshWhenVisible();
  const onVisibility=()=>refreshWhenVisible();
  window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onVisibility);
  return()=>{clearInterval(interval);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onVisibility)}
 },[session,refresh]);
 useEffect(()=>{if(!supabase||!session||!familyId)return;
  let debounce:ReturnType<typeof setTimeout>|null=null;
  const schedule=()=>{if(document.visibilityState!=='visible'||debounce)return;debounce=setTimeout(()=>{debounce=null;void refresh()},380)};
  const channel=supabase.channel('moymir3-family-'+session.user.id);
  for(const table of ['daily_chore_completions','task_submissions','point_ledger','reward_requests','spiritual_activity_records','spiritual_point_requests','behavior_points']){
   channel.on('postgres_changes',{event:'*',schema:'public',table,filter:'family_id=eq.'+familyId},schedule);
  }
  channel.subscribe();
  return()=>{if(debounce)clearTimeout(debounce);void supabase?.removeChannel(channel)};
 },[session?.user.id,familyId,refresh]);
 async function login(email:string,password:string){if(!supabase)throw new Error('Сервер недоступен');const{error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error}
 async function logout(){
  if(!supabase)return;
  // Unregister notifications from the old account before another family member signs in.
  try{
   const saved=JSON.parse(localStorage.getItem('moymir2-owned-push-token')||'null') as {token?:string;userId?:string}|null;
   if(saved?.token&&saved.userId===session?.user.id){
    const {error:tokenError}=await supabase.from('device_push_tokens').delete().eq('token',saved.token).eq('user_id',saved.userId);
    if(tokenError)console.warn('Device token deregistration failed:',tokenError.message);
    else localStorage.removeItem('moymir2-owned-push-token');
   }
  }catch(e){console.warn('Device token cleanup failed')}
  const{error}=await supabase.auth.signOut();if(error)throw error
 }
 async function rpc(name:string,params:Record<string,unknown>){if(!supabase||!session)throw new Error('Войдите в семейный аккаунт');const{data,error}=await supabase.rpc(name,params);if(error)throw error;await refresh();return data}
 return {...data,session,role,familyId,childId,childName,loading,error,refresh,login,logout,rpc};
}
