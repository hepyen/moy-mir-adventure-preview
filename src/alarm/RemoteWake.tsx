import {useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {Capacitor,registerPlugin} from '@capacitor/core'
import {LocalNotifications} from '@capacitor/local-notifications'
import {supabase} from '../lib/supabase'
import './RemoteWake.css'

type WakeState={id:string;created_at:string;state:'sent'|'received'|'awake'|'expired'|'cancelled'}
export const wakeNative=registerPlugin<{getState():Promise<{featureVersion?:number;notificationsAllowed?:boolean;fullScreenAllowed?:boolean}>;requestNotifications():Promise<unknown>;requestFullScreen():Promise<unknown>;registerRemoteWake(p:{child:string;device:string}):Promise<{token:string}>;clearRemoteWake():Promise<void>}>("MiroAlarm")
export function deviceId(){try{const k='moymir-wake-device-v1';const old=localStorage.getItem(k);if(old&&/^[a-f0-9-]{36}$/i.test(old))return old;const id=crypto.randomUUID();localStorage.setItem(k,id);return id}catch{return crypto.randomUUID()}}
const statusText={sent:'Команда отправлена. Ждём ответа телефона.',received:'Приложение Ильи получило команду. Ждём подтверждения.',awake:'Илья нажал «Я проснулся».',expired:'Телефон не подтвердил получение. Проверь связь и попробуй снова.',cancelled:'Команда отменена.'}
export function ParentWake({family,child,name}:{family:string;child:string;name:string}){
 const [status,setStatus]=useState<WakeState|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[now,setNow]=useState(Date.now())
 useEffect(()=>{let live=true;async function refresh(){const {data,error}=await supabase.rpc('moymir_wake_status',{p_family:family,p_child:child});if(live&&!error)setStatus(data||null)}
 void refresh();const id=window.setInterval(()=>{if(document.visibilityState==='visible')void refresh();setNow(Date.now())},4000);return()=>{live=false;clearInterval(id)}},[family,child])
 const cooldown=status?Math.max(0,Math.ceil((Date.parse(status.created_at)+120000-now)/1000)):0
 async function send(){if(busy||cooldown||!window.confirm('Отправить '+name+' команду пробуждения?'))return;setBusy(true);setError('');try{const {data,error}=await supabase.rpc('moymir_wake_send',{p_family:family,p_child:child});if(error)throw error;setStatus({id:String(data),created_at:new Date().toISOString(),state:'sent'});const delivery=await supabase.functions.invoke('moymir-remote-wake',{body:{id:data}});if(delivery.error||delivery.data?.warning)setError('Фоновая доставка недоступна. Команда может прийти в открытое приложение.')}catch(e){setError((e as {message?:string})?.message||'Не удалось отправить команду')}finally{setBusy(false)}}
 return <section className="mw-remote-wake"><div><span className="mw-wake-label">УТРЕННИЙ ПОМОЩНИК</span><h3>☀️ Разбудить Илью</h3><p>Миро подаст звуковой сигнал и попросит подтвердить пробуждение.</p></div><button type="button" disabled={busy||cooldown>0} onClick={()=>void send()}>{busy?'Отправляем…':cooldown?'Повтор через '+cooldown+' с':'🔔 Разбудить Илью'}</button>{status&&<div role="status" className="mw-wake-state">{status.state==='awake'?'✓ ':''}{statusText[status.state]}</div>}{error&&<p role="alert">{error}</p>}<small>Для фонового сигнала подключи новый Android-модуль на телефоне Ильи. Телефон должен быть включён и подключён к интернету.</small></section>
}

export function RemoteWakeSetup({family,child}:{family:string;child:string}){
 const [state,setState]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false)
 const native=Capacitor.isNativePlatform()&&Capacitor.isPluginAvailable('MiroAlarm')
 async function connect(prompt=false){if(!native)return;setBusy(true);try{
 let info=await wakeNative.getState();if((info.featureVersion??0)<4430){setState('Для фонового пробуждения установи Android-версию 4.4.3.');return}
 if(prompt&&!info.notificationsAllowed){await wakeNative.requestNotifications();info=await wakeNative.getState()}
 if(!info.notificationsAllowed){setReady(false);setState('Разреши уведомления, чтобы получать удалённый будильник.');return}
 const device=deviceId();const {token}=await wakeNative.registerRemoteWake({child,device});
 const {error}=await supabase.rpc('moymir_wake_register',{p_family:family,p_device:device,p_token:token});if(error)throw error;
 setReady(true);setState(info.fullScreenAllowed?'Телефон подключён.':'Телефон подключён. Для экрана пробуждения разреши полноэкранные уведомления.');
 if(prompt&&!info.fullScreenAllowed)await wakeNative.requestFullScreen()
 }catch(e){setReady(false);setState('Подключение не удалось. Проверь интернет и разрешения.')}finally{setBusy(false)}}
 useEffect(()=>{if(!native)return;void connect();const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void connect()},300000);return()=>clearInterval(timer)},[family,child,native])
 if(!native)return null
 return <section className="mw-remote-wake"><h3>☀️ Пробуждение от родителей</h3><p role="status">{state||'Подключаем телефон…'}</p><button disabled={busy} onClick={()=>void connect(true)}>{busy?'Подключение…':ready?'Проверить разрешения':'Подключить будильник'}</button></section>
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
