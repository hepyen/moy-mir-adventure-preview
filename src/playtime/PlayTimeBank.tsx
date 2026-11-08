import {useCallback,useEffect,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {LocalNotifications} from '@capacitor/local-notifications';
import {supabase} from '../lib/supabase';
import type {useFamilyCloud} from '../lib/useFamilyCloud';
import './PlayTimeBank.css';
type Cloud=ReturnType<typeof useFamilyCloud>;
type Session={id:string;minutes:number;status:'pending'|'approved'|'active'|'finished'|'rejected';requested_at:string;started_at:string|null};
type Overview={balance:number;dailyLimit:number;todayUsed:number};
const empty:Overview={balance:0,dailyLimit:30,todayUsed:0};
const notificationId=32721;
function remaining(s:Session,now:number){return s.started_at?Math.max(0,Math.ceil((new Date(s.started_at).getTime()+s.minutes*60_000-now)/1000)):s.minutes*60}
function display(seconds:number){const m=Math.floor(Math.max(0,seconds)/60),s=Math.max(0,seconds)%60;return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
async function scheduleEnd(session:Session){
 if(!Capacitor.isNativePlatform()||!Capacitor.isPluginAvailable('LocalNotifications')||!session.started_at)return;
 try{const permission=await LocalNotifications.checkPermissions();if(permission.display!=='granted')return;
  const fire=new Date(new Date(session.started_at).getTime()+session.minutes*60_000);
  if(fire.getTime()<Date.now()+1500)return;
  await LocalNotifications.schedule({notifications:[{id:notificationId,title:'🎮 Время закончилось',body:'Сеанс PlayStation завершён. Пора отложить игру.',schedule:{at:fire},extra:{section:'shop'}}]})
 }catch(e){console.warn('Playtime reminder unavailable',e)}
}
export function PlayTimeBank({cloud}:{cloud:Cloud}){
 const[overview,setOverview]=useState<Overview>(empty),[sessions,setSessions]=useState<Session[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState(''),[now,setNow]=useState(Date.now()),[loading,setLoading]=useState(true);
 const[grant,setGrant]=useState(20),[request,setRequest]=useState(20),[limit,setLimit]=useState(30);
 const reload=useCallback(async()=>{
  if(!supabase||!cloud.familyId||!cloud.childId)return;
  try{
   const [o,s]=await Promise.all([
    supabase.rpc('moymir_playtime_sync',{p_family:cloud.familyId,p_child:cloud.childId}),
    supabase.from('moymir_playtime_sessions').select('id,minutes,status,requested_at,started_at').eq('family_id',cloud.familyId).eq('child_id',cloud.childId).order('requested_at',{ascending:false}).limit(12)
   ]);
   if(o.error)throw o.error;if(s.error)throw s.error;
   const next=o.data as Overview;
   setOverview(next||empty);setSessions(s.data||[]);setLimit(Number(next?.dailyLimit||30));setError('');
  }catch(e){setError(e instanceof Error?e.message:'Нет соединения с семейной базой')}
  finally{setLoading(false)}
 },[cloud.familyId,cloud.childId]);
 useEffect(()=>{void reload();const sync=()=>{if(document.visibilityState==='visible')void reload()};const poll=setInterval(sync,30_000);document.addEventListener('visibilitychange',sync);const tick=setInterval(()=>setNow(Date.now()),1000);return()=>{clearInterval(poll);clearInterval(tick);document.removeEventListener('visibilitychange',sync)}},[reload]);
 const active=sessions.find(x=>x.status==='active');
 const inProgress=sessions.find(x=>['pending','approved','active'].includes(x.status));
 const remainingSeconds=active?remaining(active,now):0;
 useEffect(()=>{if(active&&remainingSeconds===0)void reload()},[active?.id,remainingSeconds,reload]);
 const action=async(name:string,params:Record<string,unknown>,label:string)=>{
  if(busy||!navigator.onLine){if(!navigator.onLine)setError('Нужно подключиться к интернету, чтобы сохранить решение родителя');return}
  setBusy(true);setError('');setSuccess('');
  try{await cloud.rpc(name,params);if(name==='moymir_playtime_finish'&&Capacitor.isNativePlatform()&&Capacitor.isPluginAvailable('LocalNotifications')){try{await LocalNotifications.cancel({notifications:[{id:notificationId}]})}catch(e){console.warn('Timer notification cancel failed',e)}}await reload();setSuccess(label)}
  catch(e){setError(e instanceof Error?e.message:'Операция не выполнена')}
  finally{setBusy(false)}
 };
 const start=async(s:Session)=>{
  if(busy)return;setBusy(true);setError('');setSuccess('');
  try{const result=await cloud.rpc('moymir_playtime_start',{p_id:s.id});await reload();
   await scheduleEnd({...s,started_at:String(result)});setSuccess('Сеанс начат. Таймер запущен.')}
  catch(e){setError(e instanceof Error?e.message:'Не удалось начать сеанс')}
  finally{setBusy(false)}
 };
 return <section className="mw-panel playbank" aria-label="Копилка игрового времени">
  <div className="playbank-top"><div><small>🎮 СЕМЕЙНЫЕ ПРАВИЛА</small><h3>Копилка PlayStation</h3></div><span>⏱️</span></div>
  <div className="playbank-stats"><div><strong>{overview.balance} мин</strong><span>Можно потратить</span></div><div><strong>{overview.dailyLimit} мин</strong><span>Дневной предел</span></div><div><strong>{overview.todayUsed} мин</strong><span>Начато сегодня</span></div></div>
  {loading?<p className="playbank-info">Загружаем игровое время…</p>:null}
  {active?<div className="playbank-active" role="timer"><small>🎮 СЕЙЧАС ИГРАЕМ</small><strong>{display(remainingSeconds)}</strong><span>Время до окончания одобренного сеанса</span><button disabled={busy} onClick={()=>void action('moymir_playtime_finish',{p_id:active.id},'Сеанс завершён')}>Завершить сеанс</button></div>:null}
  {cloud.role==='child'&&<div className="playbank-child">
   {inProgress?.status==='pending'?<p>⏳ Запрос на {inProgress.minutes} минут отправлен. Ждём решения родителя.</p>:inProgress?.status==='approved'?<><p>✅ Родитель разрешил {inProgress.minutes} минут. Начни, когда готов.</p><button disabled={busy} onClick={()=>void start(inProgress)}>▶ Начать {inProgress.minutes} минут</button></>:inProgress?.status==='active'?<p>Время идёт. Таймер работает по времени сервера даже при закрытом приложении.</p>:<><p>Выбери время, которое хочешь использовать, и дождись согласия родителей.</p><div className="playbank-options">{[10,20,30,40,60].map(m=><button key={m} type="button" className={request===m?'selected':''} onClick={()=>setRequest(m)}>{m} мин</button>)}</div><button disabled={busy||request>overview.balance||request>overview.dailyLimit-overview.todayUsed} onClick={()=>void action('moymir_playtime_request',{p_family:cloud.familyId,p_minutes:request},`Запрос на ${request} минут отправлен`)}>Попросить {request} минут</button>{request>overview.balance&&<small>В копилке пока недостаточно минут. Их может добавить родитель.</small>}</>}
  </div>}
  {cloud.role==='parent'&&<div className="playbank-parent"><strong>👨‍👩‍👦 Управление родителя</strong><p>Добавляй минуты за подтверждённые дела. Время остаётся отдельным от монет магазина и духовных баллов.</p><div className="playbank-options">{[10,20,30,60].map(m=><button key={m} type="button" className={grant===m?'selected':''} onClick={()=>setGrant(m)}>+{m}</button>)}</div><button disabled={busy} onClick={()=>void action('moymir_playtime_grant',{p_family:cloud.familyId,p_child:cloud.childId,p_minutes:grant,p_note:'Награда от родителя'},`В копилку добавлено ${grant} минут`)}>Добавить {grant} минут в копилку</button>
   <div className="playbank-limit"><label>Дневной предел<select value={limit} onChange={e=>setLimit(Number(e.target.value))}>{[10,20,30,40,50,60,90,120].map(m=><option key={m} value={m}>{m} минут</option>)}</select></label><button disabled={busy||limit===overview.dailyLimit} onClick={()=>void action('moymir_playtime_set_limit',{p_family:cloud.familyId,p_child:cloud.childId,p_daily:limit},'Дневной предел изменён')}>Сохранить</button></div>
   {inProgress?.status==='pending'&&<div className="playbank-approval"><strong>Запрос от Ильи: {inProgress.minutes} минут</strong><div><button disabled={busy} onClick={()=>void action('moymir_playtime_review',{p_id:inProgress.id,p_approve:true},'Сеанс разрешён')}>✓ Разрешить</button><button disabled={busy} onClick={()=>void action('moymir_playtime_review',{p_id:inProgress.id,p_approve:false},'Запрос отклонён')}>Отклонить</button></div></div>}
   {inProgress?.status==='approved'&&<p>✅ Разрешено {inProgress.minutes} минут. Илья ещё не начал таймер.</p>}
  </div>}
  {error&&<p className="playbank-error" role="alert">{error}</p>}{success&&<p className="playbank-success" role="status">{success}</p>}
  <details className="playbank-history"><summary>История запросов ({sessions.length})</summary>{sessions.length? sessions.map(s=><div key={s.id}><span>{s.minutes} мин · {({pending:'Ждёт',approved:'Одобрено',active:'Идёт',finished:'Завершено',rejected:'Отклонено'} as Record<string,string>)[s.status]}</span><small>{new Date(s.requested_at).toLocaleDateString('ru-RU',{timeZone:'Europe/Madrid'})}</small></div>):<p>Пока нет запросов.</p>}</details>
  <p className="playbank-info">Приложение показывает время и напоминает, когда оно истекло. Оно не может автоматически выключить PlayStation. Выданные родителем минуты не покупаются за духовные баллы.</p>
 </section>
}
