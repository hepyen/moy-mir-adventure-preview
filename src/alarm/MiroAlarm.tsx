import {MiroAvatar} from '../legacyWorld/MiroAvatar';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Capacitor,registerPlugin} from '@capacitor/core';
import {Browser} from '@capacitor/browser';
import {setMusicDucked} from '../features/music';
import './MiroAlarm.css';

type AlarmState={
 enabled:boolean;hour:number;minute:number;days:number;
 tone:'sunrise'|'robot'|'meadow';voice:boolean;vibrate:boolean;
 gradual:boolean;snooze:number;exactAllowed:boolean;
 notificationsAllowed:boolean;fullScreenAllowed:boolean;nextAt:number;featureVersion?:number;
};
type AlarmConfig=Pick<AlarmState,'enabled'|'hour'|'minute'|'days'|'tone'|'voice'|'vibrate'|'gradual'|'snooze'>;
type AlarmNative={
 getState():Promise<AlarmState>;
 save(settings:AlarmConfig):Promise<AlarmState>;
 requestExactAlarm():Promise<AlarmState>;
 requestFullScreen():Promise<AlarmState>;
 requestNotifications():Promise<AlarmState>;
 test():Promise<void>;
 syncLessons(payload:{lessons:{weekday:number;subject:string}[]}):Promise<{saved:boolean;today:string}>;
};
const plugin=registerPlugin<AlarmNative>('MiroAlarm');
const days=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const tones:{id:AlarmState['tone'];name:string;description:string}[]=[
 {id:'sunrise',name:'Солнечный луч',description:'Новая утренняя мелодия: светлые переливы колокольчиков'},
 {id:'robot',name:'Робот просыпается',description:'Весёлые электронные переливы'},
 {id:'meadow',name:'Доброе утро, мир!',description:'Мягкая мелодия луга'},
];
const DEFAULT:AlarmState={enabled:false,hour:7,minute:0,days:31,tone:'sunrise',voice:true,vibrate:true,gradual:true,snooze:5,exactAllowed:false,notificationsAllowed:false,fullScreenAllowed:false,nextAt:0,featureVersion:0};
const soundFile=(tone:string)=>import.meta.env.BASE_URL+'alarm/'+tone+'.mp3';
const fmtTime=(h:number,m:number)=>String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
const native=Capacitor.isNativePlatform()&&Capacitor.isPluginAvailable('MiroAlarm');
type Lesson={weekday:number;subject:string;lesson_order?:number};
export async function syncMiroAlarmLessons(lessons:Lesson[]){
 if(!native)return;
 await plugin.syncLessons({lessons:[...lessons].sort((a,b)=>(a.weekday-b.weekday)||((a.lesson_order||0)-(b.lesson_order||0))).map(x=>({weekday:x.weekday,subject:x.subject}))});
}
function subjectAudio(subject:string){
 const s=subject.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 if(s.includes('matemat'))return 'subject_math';
 if(s.includes('fisica')&&s.includes('educacion')||s==='ef')return 'subject_pe';
 if(s.includes('biolog')||s.includes('geolog'))return 'subject_biology';
 if(s.includes('geograf')||s.includes('histori'))return 'subject_history';
 if(s.includes('ingles')||s.includes('english'))return 'subject_english';
 if(s.includes('frances'))return 'subject_french';
 if(s.includes('aleman'))return 'subject_german';
 if(s.includes('lengua')||s.includes('castellan')||s.includes('espanol'))return 'subject_spanish';
 if(s.includes('tecnolog'))return 'subject_technology';
 if(s.includes('informat')||s.includes('digital'))return 'subject_computing';
 if(s.includes('musica'))return 'subject_music';
 if(s.includes('plastica')||s.includes('artist')||s.includes('dibujo'))return 'subject_art';
 if(s.includes('tutor'))return 'subject_tutor';
 if(s.includes('religion'))return 'subject_religion';
 if(s.includes('valores')||s.includes('etica'))return 'subject_values';
 if(s.includes('quimica'))return 'subject_physics';
 if(s.includes('natural'))return 'subject_nature';
 if(s.includes('social'))return 'subject_social';
 if(s.includes('latin'))return 'subject_latin';
 if(s.includes('econom'))return 'subject_economics';
 if(s.includes('danza')||s.includes('baile'))return 'subject_dance';
 if(s.includes('lectura'))return 'subject_reading';
 if(s.includes('ciencia'))return 'subject_science';
 return '';
}

const LEGACY_NATIVE=Capacitor.isNativePlatform()&&!native;
const APK_URL='https://hepyen.github.io/moy-mir-adventure-preview/downloads/MOY_MIR_3.3.0_TEST.apk';

export function MiroAlarmPanel({parent=false,lessons=[]}:{parent?:boolean;lessons?:Lesson[]}){
 const [settings,setSettings]=useState<AlarmState>(DEFAULT);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const [preview,setPreview]=useState<'off'|'ring'|'snooze'|'awake'>('off');
 const [phase,setPhase]=useState(0);
 const music=useRef<HTMLAudioElement|null>(null);
 const voice=useRef<HTMLAudioElement|null>(null);
 const timers=useRef<number[]>([]);
 const todayLessons=lessons.filter(x=>x.weekday===new Date().getDay()).sort((a,b)=>(a.lesson_order||0)-(b.lesson_order||0)).map(x=>x.subject);
 const lessonSpeech=todayLessons.length?'Сегодня у тебя уроки: '+todayLessons.join(', ')+'.':new Date().getDay()%6===0?'В расписании сегодня нет уроков.':'Расписание уроков пока не заполнено. Посмотри раздел «Учёба».';
 const previewLines=[
  'Илья, вставай! Пора просыпаться. Новый день уже начался!',
  lessonSpeech,
  'Илья, вставай! Пора просыпаться.',
  'Илья, почисти зубы и заправь кровать!',
  'Проверь школьный рюкзак перед выходом!'
 ];
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
  if(settings.voice){
   const audioForLessons=todayLessons.length?['lessons_intro',...todayLessons.map(subjectAudio).filter(Boolean)]:[new Date().getDay()%6===0?'weekend':'no_schedule'];
   if(todayLessons.some(x=>!subjectAudio(x)))audioForLessons.push('other_subject');
   const groups=[['wake'],audioForLessons,['wake'],['chores'],['bag']];
   let turn=0;
   const playGroup=()=>{
    if(!music.current)return;
    const clips=groups[turn%groups.length];setPhase(turn%groups.length);turn++;
    let index=0;
    const playClip=()=>{
     if(!music.current)return;
     if(index>=clips.length){
      if(music.current)music.current.volume=.36;
      timers.current.push(window.setTimeout(playGroup,9000));return;
     }
     if(music.current)music.current.volume=.13;
     const speech=new Audio(soundFile(clips[index++]));speech.volume=1;voice.current=speech;
     speech.onended=()=>{voice.current=null;timers.current.push(window.setTimeout(playClip,200))};
     void speech.play().catch(()=>{timers.current.push(window.setTimeout(playClip,250))});
    };
    playClip();
   };
   timers.current.push(window.setTimeout(playGroup,5000));
  }else{
   [12000,24000,36000,48000].forEach((ms,i)=>timers.current.push(window.setTimeout(()=>setPhase(i+1),ms)));
  }
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
   <div className={"miro-alarm-avatar "+(preview==="ring"?"waking":"")} role="img" aria-label="Миро из мира с домиком"><MiroAvatar face={preview==="ring"&&phase%2===1?"wink":"smile"}/></div>
   <strong>{preview==='ring'?'Илья, доброе утро!':preview==='awake'?'Ура! Новый день начался!':preview==='snooze'?'Миро немного подождёт':'Доброе утро, Илья!'}</strong>
   <p>{preview==='ring'?previewLines[phase%previewLines.length]:'Улыбнись новому дню. Я рядом!'}</p>
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
   <label className="miro-alarm-check"><input type="checkbox" checked={settings.voice} onChange={e=>edit('voice',e.target.checked)} disabled={!parent}/> Миро напоминает об уроках, зубах и кровати каждые несколько секунд</label>
   <p className="miro-alarm-note">📚 {lessonSpeech} Уроки берутся из раздела «Учёба» и сохраняются на телефоне для пробуждения без интернета.</p>
   <label className="miro-alarm-check"><input type="checkbox" checked={settings.vibrate} onChange={e=>edit('vibrate',e.target.checked)} disabled={!parent}/> Вибрация при пробуждении</label>
   {!parent&&<p className="miro-alarm-note">Изменить расписание может родитель в своём профиле на устройстве Ильи. Ты можешь посмотреть анимацию.</p>}
   {(LEGACY_NATIVE||(native&&settings.featureVersion!==3300))&&<div className="miro-alarm-warning"><strong>Нужен Android APK 3.3.0</strong><p>Для нового голоса и школьного расписания нужен системный модуль будильника версии 3.3.0. Установи APK поверх текущего «Моего мира», не удаляя приложение.</p><button type="button" onClick={()=>void Browser.open({url:APK_URL}).catch(e=>setError(String(e)))}>⬇ Установить будильник Миро (APK)</button></div>}
   {!Capacitor.isNativePlatform()&&<p className="miro-alarm-warning">В браузере доступен только предпросмотр. Реальный будильник работает в Android APK.</p>}
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
