import {useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {Capacitor} from '@capacitor/core'
import {LocalNotifications} from '@capacitor/local-notifications'
import {supabase} from '../lib/supabase'
import './RemoteWake.css'

type WakeState={id:string;created_at:string;state:'sent'|'received'|'awake'|'expired'|'cancelled'}
function deviceId(){try{const k='moymir-wake-device-v1';const old=localStorage.getItem(k);if(old&&/^[a-f0-9-]{36}$/i.test(old))return old;const id=crypto.randomUUID();localStorage.setItem(k,id);return id}catch{return crypto.randomUUID()}}
const statusText={sent:'Команда отправлена. Ждём ответа телефона.',received:'Приложение Ильи получило команду. Ждём подтверждения.',awake:'Илья нажал «Я проснулся».',expired:'Телефон не подтвердил получение. Проверь связь и попробуй снова.',cancelled:'Команда отменена.'}
export function ParentWake({family,child,name}:{family:string;child:string;name:string}){
 const [status,setStatus]=useState<WakeState|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[now,setNow]=useState(Date.now())
 useEffect(()=>{let live=true;async function refresh(){const {data,error}=await supabase.rpc('moymir_wake_status',{p_family:family,p_child:child});if(live&&!error)setStatus(data||null)}
 void refresh();const id=window.setInterval(()=>{if(document.visibilityState==='visible')void refresh();setNow(Date.now())},4000);return()=>{live=false;clearInterval(id)}},[family,child])
 const cooldown=status?Math.max(0,Math.ceil((Date.parse(status.created_at)+120000-now)/1000)):0
 async function send(){if(busy||cooldown||!window.confirm('Отправить '+name+' команду пробуждения?'))return;setBusy(true);setError('');try{const {data,error}=await supabase.rpc('moymir_wake_send',{p_family:family,p_child:child});if(error)throw error;setStatus({id:String(data),created_at:new Date().toISOString(),state:'sent'})}catch(e){setError((e as {message?:string})?.message||'Не удалось отправить команду')}finally{setBusy(false)}}
 return <section className="mw-remote-wake"><div><span className="mw-wake-label">УТРЕННИЙ ПОМОЩНИК</span><h3>☀️ Разбудить Илью</h3><p>Миро подаст звуковой сигнал и попросит подтвердить пробуждение.</p></div><button type="button" disabled={busy||cooldown>0} onClick={()=>void send()}>{busy?'Отправляем…':cooldown?'Повтор через '+cooldown+' с':'🔔 Разбудить Илью'}</button>{status&&<div role="status" className="mw-wake-state">{status.state==='awake'?'✓ ':''}{statusText[status.state]}</div>}{error&&<p role="alert">{error}</p>}<small>Пока удалённый сигнал работает только при открытом приложении на телефоне Ильи. Системный будильник по расписанию работает отдельно.</small></section>
}

export function ChildWake({family}:{family:string}){
 const [request,setRequest]=useState<string|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const audio=useRef<HTMLAudioElement|null>(null),active=useRef(false),deadline=useRef<number|null>(null)
 const stop=()=>{audio.current?.pause();audio.current=null;if(deadline.current!==null){clearTimeout(deadline.current);deadline.current=null}try{navigator.vibrate?.(0)}catch{}}
 useEffect(()=>{let live=true,checking=false;const device=deviceId()
 async function check(){if(!live||checking||active.current||document.visibilityState!=='visible')return;checking=true
 try{const {data,error}=await supabase.rpc('moymir_wake_claim',{p_family:family,p_device:device});if(!live||error||typeof data!=='string'||!data)return;active.current=true;setRequest(data);setError('')
 try{navigator.vibrate?.([300,250,300,250,600])}catch{}
 const tone=new Audio(import.meta.env.BASE_URL+'alarm/sunrise.mp3');tone.loop=true;tone.volume=.8;audio.current=tone
 void tone.play().catch(()=>{})
 deadline.current=window.setTimeout(stop,45000)
 if(Capacitor.isNativePlatform()&&Capacitor.isPluginAvailable('LocalNotifications')){
 try{const permission=await LocalNotifications.checkPermissions();if(!live||!active.current||permission.display!=='granted')return;await LocalNotifications.createChannel({id:'moymir_remote_wake_v1',name:'Пробуждение от родителей',importance:5,vibration:true,sound:'default',visibility:1});if(live&&active.current)await LocalNotifications.schedule({notifications:[{id:7411,title:'☀️ Илья, пора вставать!',body:'Родители просят тебя проснуться. Открой Мой мир и подтверди.',channelId:'moymir_remote_wake_v1',schedule:{at:new Date(Date.now()+1000)}}]})}catch{}
 }
 }finally{checking=false}}
 void check();const id=window.setInterval(()=>void check(),4000);document.addEventListener('visibilitychange',check);return()=>{live=false;clearInterval(id);document.removeEventListener('visibilitychange',check);active.current=false;stop()}
 },[family])
 async function reply(){if(!request||busy)return;stop();setBusy(true);setError('');try{const {data,error}=await supabase.rpc('moymir_wake_reply',{p_id:request});if(error||!data)throw Error(error?.message||'Команда устарела');setRequest(null);active.current=false}catch(e){setError((e as Error).message||'Не удалось отправить ответ')}finally{setBusy(false)}}
 if(!request)return null
 return createPortal(<div className="mw-wake-dialog" role="dialog" aria-modal="true" aria-label="Пора просыпаться"><div className="mw-wake-dialog-card"><span className="mw-wake-sun" aria-hidden="true">☀️</span><h1>Илья, пора вставать!</h1><p>Родители просят тебя проснуться. Миро желает тебе доброго утра.</p><button type="button" disabled={busy} onClick={()=>void reply()}>{busy?'Отправляем…':'✓ Я проснулся!'}</button><button className="mw-wake-quiet" type="button" onClick={stop}>Выключить звук</button>{error&&<><p role="alert">{error}</p><button className="mw-wake-quiet" onClick={()=>{stop();setRequest(null);active.current=false}}>Закрыть</button></>}</div></div>,document.body)
}
