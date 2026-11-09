import {useCallback,useEffect,useRef,useState} from 'react';
import {Capacitor,registerPlugin} from '@capacitor/core';
import {setMusicDucked} from '../features/music';
import './MiroAlarm.css';

type AlarmState={
 enabled:boolean;hour:number;minute:number;days:number;
 tone:'sunrise'|'robot'|'meadow';voice:boolean;vibrate:boolean;
 gradual:boolean;snooze:number;exactAllowed:boolean;
 notificationsAllowed:boolean;fullScreenAllowed:boolean;nextAt:number;
};
type AlarmConfig=Pick<AlarmState,'enabled'|'hour'|'minute'|'days'|'tone'|'voice'|'vibrate'|'gradual'|'snooze'>;
type AlarmNative={
 getState():Promise<AlarmState>;
 save(settings:AlarmConfig):Promise<AlarmState>;
 requestExactAlarm():Promise<AlarmState>;
 requestFullScreen():Promise<AlarmState>;
 requestNotifications():Promise<AlarmState>;
 test():Promise<void>;
};
const plugin=registerPlugin<AlarmNative>('MiroAlarm');
const days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const tones:{id:AlarmState['tone'];name:string;description:string}[]=[
 {id:'sunrise',name:'Солнечный луч',description:'Тихие утренние колокольчики'},
 {id:'robot',name:'Робот просыпается',description:'Весёлые электронные переливы'},
 {id:'meadow',name:'Доброе утро, мир!',description:'Мягкая мелодия луга'},
];
const DEFAULT:AlarmState={enabled:false,hour:7,minute:0,days:31,tone:'sunrise',voice:true,vibrate:true,gradual:true,snooze:5,exactAllowed:false,notificationsAllowed:false,fullScreenAllowed:false,nextAt:0};
const soundFile=(tone:string)=>import.meta.env.BASE_URL+'alarm/'+tone+'.mp3';
const fmtTime=(h:number,m:number)=>String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
const native=Capacitor.isNativePlatform()&&Capacitor.isPluginAvailable('MiroAlarm');

export function MiroAlarmPanel({parent=false}:{parent?:boolean}){
 const [settings,setSettings]=useState<AlarmState>(DEFAULT);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [preview,setPreview]=useState<'off'|'ring'|'snooze'|'awake'>('off');
 const [phase,setPhase]=useState(0);
 const music=useRef<HTMLAudioElement|null>(null);
 const voice=useRef<HTMLAudioElement|null>(null);
 const timers=useRef<number[]>([]);
 const edit=<K extends keyof AlarmState>(key:K,value:AlarmState[K])=>setSettings(s=>({...s,[key]:value}));
 const refresh=useCallback(async()=>{if(!native)return;try{setSettings(await plugin.getState())}catch(e){setError(e instanceof Error?e.message:'Не удалось загрузить настройки Android')}},[]);
 useEffect(()=>{void refresh();const visible=()=>{if(!document.hidden)void refresh()};document.addEventListener('visibilitychange',visible);return()=>document.removeEventListener('visibilitychange',visible)},[refresh]);
 function clearAudio(){
  timers.current.forEach(window.clearTimeout);timers.current=[];
  if(music.current){music.current.pause();music.current.src='';music.current=null}
  if(voice.current){voice.current.pause();voice.current.src='';voice.current=null}
  setMusicDucked(false);
 }
 useEffect(()=>()=>clearAudio(),[]);
 async function listen(){
  clearAudio();setMessage('');setError('');setPhase(0);setPreview('ring');
  setMusicDucked(true);
  const song=new Audio(soundFile(settings.tone));song.loop=true;song.volume=.36;music.current=song;
  try{await song.play()}catch{setMessage('Автовоспроизведение заблокировано устройством. Нажми ещё раз для звука.')}
  timers.current.push(window.setTimeout(()=>setPhase(1),7000));
  if(settings.voice)timers.current.push(window.setTimeout(()=>{
   if(!music.current)return;
   music.current.volume=.18;
   const v=new Audio(soundFile('greeting'));v.volume=.9;voice.current=v;
   v.onended=()=>{if(music.current)music.current.volume=.36};
   void v.play().catch(()=>{if(music.current)music.current.volume=.36});
  },10000));
  timers.current.push(window.setTimeout(()=>setPhase(2),29000));
 }
 async function nativeAction(fn:()=>Promise<unknown>,success?:string){
  setBusy(true);setError('');setMessage('');
  try{await fn();if(success)setMessage(success);await refresh()}
  catch(e){setError(e instanceof Error?e.message:'Не удалось выполнить действие')}
  finally{setBusy(false)}
 }
 async function save(){
  await nativeAction(()=>plugin.save({
   enabled:settings.enabled,hour:settings.hour,minute:settings.minute,days:settings.days,
   tone:settings.tone,voice:settings.voice,vibrate:settings.vibrate,gradual:settings.gradual,snooze:settings.snooze
  }),settings.enabled?'Будильник сохранён в Android':'Будильник выключен');
 }
 const toggleDay=(i:number)=>edit('days',settings.days^(1<<i));
 return <section className="miro-alarm-panel" aria-label="Будильник Миро">
  <div className="miro-alarm-heading"><div className="miro-alarm-clock-icon">⏰</div><div><span>МОЙ МИР · УТРО</span><h2>Миро будит Илью</h2><p>Будильник на этом телефоне. Работает без интернета в установленной Android-версии.</p></div></div>
  <div className="miro-alarm-scene">
   <div className="miro-alarm-sun" aria-hidden="true">☀</div>
   <div className="miro-alarm-cloud one" aria-hidden="true">☁</div><div className="miro-alarm-cloud two" aria-hidden="true">☁</div>
   <span className="miro-alarm-stars" aria-hidden="true">✧ ✦ ✧</span>
   <div className="miro-alarm-time">{fmtTime(settings.hour,settings.minute)}</div>
   <img className={'miro-alarm-avatar '+(preview==='ring'?'waking':'')} src={import.meta.env.BASE_URL+'art/robot.png'} alt="Миро EV" />
   <strong>{preview==='ring'?'Илья, доброе утро!':preview==='awake'?'Ура! Новый день начался!':preview==='snooze'?'Миро немного подождёт':'Доброе утро, Илья!'}</strong>
   <p>{preview==='ring'?(phase===0?'Пи-пи! Это Миро! Солнце уже проснулось.':phase===1?'Я уже открыл шторы! Пора начинать день!':'Нажми «Я проснулся», когда встанешь.'):'Улыбнись новому дню. Я рядом!'}</p>
   {preview==='ring'?<div className="miro-alarm-scene-actions">
     {settings.snooze>0&&<button onClick={()=>{clearAudio();setPreview('snooze')}}>💤 Ещё {settings.snooze} мин</button>}
     <button onClick={()=>{clearAudio();setPreview('awake')}}>☀️ Я проснулся!</button>
   </div>:<button className="miro-alarm-preview" type="button" onClick={()=>void listen()}>▶ {preview==='off'?'Посмотреть и послушать':'Повторить анимацию'}</button>}
  </div>
  <div className="miro-alarm-form">
   <label className="miro-alarm-switch"><span><b>Включить будильник</b><small>Рабочие дни по умолчанию</small></span>
    <input type="checkbox" checked={settings.enabled} onChange={e=>edit('enabled',e.target.checked)} disabled={!parent}/></label>
   <div className="miro-alarm-row"><label>Время пробуждения<input aria-label="Время будильника" type="time" value={fmtTime(settings.hour,settings.minute)} onChange={e=>{const [h,m]=e.target.value.split(':').map(Number);if(Number.isInteger(h)&&Number.isInteger(m)){setSettings(s=>({...s,hour:h,minute:m}))}}} disabled={!parent}/></label>
   <label>Повтор через<select value={settings.snooze} onChange={e=>edit('snooze',Number(e.target.value))} disabled={!parent}><option value={0}>Без повтора</option><option value={5}>5 минут</option><option value={10}>10 минут</option></select></label></div>
   <div className="miro-alarm-week"><span>Дни недели</span><div>{days.map((d,i)=><button type="button" key={d} className={(settings.days&(1<<i))?'selected':''} aria-pressed={!!(settings.days&(1<<i))} onClick={()=>toggleDay(i)} disabled={!parent}>{d}</button>)}</div></div>
   <label className="miro-alarm-field">Мелодия<select value={settings.tone} onChange={e=>edit('tone',e.target.value as AlarmState['tone'])} disabled={!parent}>{tones.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select><small>{tones.find(t=>t.id===settings.tone)?.description}</small></label>
   <label className="miro-alarm-check"><input type="checkbox" checked={settings.gradual} onChange={e=>edit('gradual',e.target.checked)} disabled={!parent}/> Постепенно увеличивать громкость</label>
   <label className="miro-alarm-check"><input type="checkbox" checked={settings.voice} onChange={e=>edit('voice',e.target.checked)} disabled={!parent}/> Голосовое приветствие Миро</label>
   <label className="miro-alarm-check"><input type="checkbox" checked={settings.vibrate} onChange={e=>edit('vibrate',e.target.checked)} disabled={!parent}/> Вибрация при пробуждении</label>
   {!parent&&<p className="miro-alarm-note">Изменить расписание может родитель в своём профиле на устройстве Ильи. Ты можешь посмотреть анимацию.</p>}
   {!native&&<p className="miro-alarm-warning">В браузере доступен только предпросмотр. Чтобы настоящий будильник работал при закрытом приложении, установи новую Android APK с модулем Миро.</p>}
   {native&&<div className="miro-alarm-permissions">
      {!settings.exactAllowed&&<button type="button" disabled={busy} onClick={()=>void nativeAction(()=>plugin.requestExactAlarm())}>Разрешить точные сигналы Android</button>}
      {!settings.notificationsAllowed&&<button type="button" disabled={busy} onClick={()=>void nativeAction(()=>plugin.requestNotifications())}>Разрешить уведомления Android</button>}
      {!settings.fullScreenAllowed&&<button type="button" disabled={busy} onClick={()=>void nativeAction(()=>plugin.requestFullScreen())}>Разрешить экран будильника поверх блокировки</button>}
     </div>}
   {native&&settings.enabled&&settings.nextAt>0&&<p className="miro-alarm-next">⏰ Следующий сигнал: {new Date(settings.nextAt).toLocaleString('ru-RU',{weekday:'long',day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})}</p>}
   {error&&<p className="miro-alarm-error" role="alert">{error}</p>}
   {message&&<p className="miro-alarm-success" role="status">{message}</p>}
   <div className="miro-alarm-buttons">
      <button disabled={busy||!native||!parent} onClick={()=>void save()}>{busy?'Сохраняю…':'Сохранить будильник'}</button>
      {native&&<button disabled={busy||!settings.enabled} onClick={()=>void nativeAction(()=>plugin.test(),'Пробный сигнал назначен через 4 секунды')}>Тест на телефоне (4 с)</button>}
   </div>
  </div>
  <p className="miro-alarm-footnote">Утренний сигнал не расходует баллы и не зависит от подключения к семейной базе. Для работы при закрытом приложении нужны разрешения Android. Если телефон полностью выключен, сигнал не прозвучит.</p>
 </section>;
}
