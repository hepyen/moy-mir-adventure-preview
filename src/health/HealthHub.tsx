import {useEffect,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {LocalNotifications} from '@capacitor/local-notifications';
import {MiroAvatar} from '../legacyWorld/MiroAvatar';
import {GrowthJournal} from './GrowthJournal';
import {ExerciseAdventure} from './ExerciseAdventure';
import {HealthKitchen} from './HealthKitchen';
import {SleepWell} from './SleepWell';
import {HealthGarden} from './HealthGarden';
import {useHealthFamily,type HealthPlan,type HealthDaily} from './useHealthFamily';
import {AppThemeSwitch,type ThemeChoice} from '../theme/useAppTheme';
import './HealthHub.css';

type Meal={breakfast:string;lunch:string;dinner:string;snack:string};
type Measurement={id:string;date:string;height:number;weight:number};
type HealthData={
  habits:Record<string,string[]>;mood:Record<string,string>;meals:Meal[];
  bed:string;wake:string;measurements:Measurement[];reminders:boolean;notes:string
};
type HealthSection='today'|'growth'|'exercise'|'food'|'sleep'|'garden'|'parent';
const BASE_MEALS:Meal[]=[
 {breakfast:'Овсянка с молоком и бананом',lunch:'Курица, рис и овощи',dinner:'Омлет, помидоры и хлеб',snack:'Фрукт или натуральный йогурт'},
 {breakfast:'Натуральный йогурт, фрукт и тост',lunch:'Чечевичный суп с овощами',dinner:'Запечённая рыба, картофель и салат',snack:'Бутерброд с сыром или фрукт'},
 {breakfast:'Тост с сыром и фрукт',lunch:'Макароны с томатным соусом, индейка и салат',dinner:'Овощной суп, яйцо и хлеб',snack:'Натуральный йогурт или орехи без аллергии'},
 {breakfast:'Овсянка с яблоком',lunch:'Нут с овощами и хлебом',dinner:'Курица в духовке, гречка и овощи',snack:'Фрукт или сыр с хлебом'},
 {breakfast:'Яйцо, цельнозерновой хлеб и фрукт',lunch:'Рыба с рисом и овощами',dinner:'Домашняя пицца с овощами и сыром',snack:'Фрукт или йогурт'},
 {breakfast:'Йогурт, ягоды и овсяные хлопья',lunch:'Домашний плов с курицей и овощной салат',dinner:'Овощной крем-суп и тост с сыром',snack:'Фрукт или небольшая порция орехов'},
 {breakfast:'Сырники или омлет и фрукт',lunch:'Запечённая курица, картофель и овощи',dinner:'Салат с нутом, яйцом и хлебом',snack:'Фрукт или натуральный йогурт'}
];
const HABITS=[
 {id:'morning',icon:'☀️',label:'Подвигался утром',help:'Даже несколько спокойных минут подходят'},
 {id:'breakfast',icon:'🍞',label:'Позавтракал',help:'Выбирай еду по голоду и аппетиту'},
 {id:'water',icon:'💧',label:'В течение дня пил воду',help:'Пей, когда хочется пить, и после активности'},
 {id:'movement',icon:'🌳',label:'Погулял или активно поиграл',help:'Прогулка, мяч, велосипед, танцы'},
 {id:'evening',icon:'🌙',label:'Спокойно готовился ко сну',help:'Убрал экран и завершил вечерние дела'}
];
function dateMadrid(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function madridWeekday(){const iso=dateMadrid();const d=new Date(iso+'T12:00:00Z').getUTCDay();return (d+6)%7}
const defaults=():HealthData=>({habits:{},mood:{},meals:BASE_MEALS.map(x=>({...x})),bed:'21:00',wake:'06:45',measurements:[],reminders:false,notes:''});
function read(key:string):HealthData{
 const fallback=defaults();
 try{
  const raw=JSON.parse(localStorage.getItem(key)||'null');
  if(!raw||typeof raw!=='object')return fallback;
  return {
   habits:raw.habits&&typeof raw.habits==='object'?raw.habits:{},
   mood:raw.mood&&typeof raw.mood==='object'?raw.mood:{},
   meals:Array.isArray(raw.meals)&&raw.meals.length===7?raw.meals.map((m:Partial<Meal>,i:number)=>({
    breakfast:typeof m?.breakfast==='string'?m.breakfast:BASE_MEALS[i].breakfast,
    lunch:typeof m?.lunch==='string'?m.lunch:BASE_MEALS[i].lunch,
    dinner:typeof m?.dinner==='string'?m.dinner:BASE_MEALS[i].dinner,
    snack:typeof m?.snack==='string'?m.snack:BASE_MEALS[i].snack
   })):fallback.meals,
   bed:/^\d\d:\d\d$/.test(raw.bed)?raw.bed:fallback.bed,
   wake:/^\d\d:\d\d$/.test(raw.wake)?raw.wake:fallback.wake,
   measurements:Array.isArray(raw.measurements)?raw.measurements.filter((x:Measurement)=>x&&Number.isFinite(x.height)&&Number.isFinite(x.weight)).slice(-30):[],
   reminders:raw.reminders===true,
   notes:typeof raw.notes==='string'?raw.notes.slice(0,700):''
  };
 }catch{return fallback}
}
function timeMinutes(time:string){const [h,m]=time.split(':').map(Number);return h*60+m}
function sleepMinutes(bed:string,wake:string){return (timeMinutes(wake)-timeMinutes(bed)+1440)%1440}
function clockLabel(m:number){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function asHours(minutes:number){return Math.floor(minutes/60)+' ч '+String(minutes%60).padStart(2,'0')+' мин'}
const IDS=[34810,34811,34812];
async function clearReminders(){if(!Capacitor.isNativePlatform())return;await LocalNotifications.cancel({notifications:IDS.map(id=>({id}))})}
async function setupReminders(bed:string,wake:string){
 if(!Capacitor.isNativePlatform())throw Error('Системные напоминания доступны в Android-приложении.');
 const permission=await LocalNotifications.requestPermissions();
 if(permission.display!=='granted')throw Error('Android не разрешил уведомления. Измените разрешение в настройках телефона.');
 await clearReminders();
 const wind=timeMinutes(bed)-45+1440;
 const items=[
  {id:IDS[0],at:wind%1440,title:'🌙 Миро: спокойный вечер',body:'Постепенно заканчивай игры и готовься ко сну.'},
  {id:IDS[1],at:timeMinutes(bed),title:'🛏️ Миро: пора отдыхать',body:'Илья, спокойной ночи! Кровать, зубы и отдых.'},
  {id:IDS[2],at:timeMinutes(wake),title:'☀️ Миро: доброе утро!',body:'Пора просыпаться! Впереди лёгкая зарядка и завтрак.'}
 ];
 await LocalNotifications.schedule({notifications:items.map(x=>({
  id:x.id,title:x.title,body:x.body,
  schedule:{on:{hour:Math.floor(x.at/60),minute:x.at%60},repeats:true},
  extra:{section:'health'}
 }))});
}
export function HealthHub({parent=false,childId='local',familyId,themeMode,themeResolved,onThemeChange,onOpenSettings}:{parent?:boolean;childId?:string;familyId?:string;themeMode:ThemeChoice;themeResolved:'day'|'night';onThemeChange:(value:ThemeChoice)=>void;onOpenSettings?:()=>void}){
 const key='moymir-health-local-v1:'+childId;
 const [entry,setEntry]=useState<{key:string;data:HealthData}>(()=>({key,data:read(key)}));
 const state=entry.key===key?entry.data:read(key);
 const cloud=useHealthFamily(familyId,childId,parent);
 const plan:HealthPlan={
  meals:cloud.plan?.meals?.length===7?cloud.plan.meals:state.meals,
  bed:cloud.plan?.bed||state.bed,wake:cloud.plan?.wake||state.wake,
  allergies:cloud.plan?.allergies||[],notes:''
 };

 const actualTheme=themeResolved;
 const localHour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
 const greeting=localHour<11?'Доброе утро!':localHour<17?'Хорошего дня!':'Добрый вечер!';
 const [,setClockTick]=useState(0);
 useEffect(()=>{
  const update=()=>setClockTick(n=>n+1);
  const interval=window.setInterval(update,60000);
  const visible=()=>{if(!document.hidden)update()};
  document.addEventListener('visibilitychange',visible);
  return()=>{window.clearInterval(interval);document.removeEventListener('visibilitychange',visible)};
 },[]);
 const [section,setSection]=useState<HealthSection>('today');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 const today=dateMadrid();
 const daily:HealthDaily=cloud.today||{date:today,habits:Array.isArray(state.habits[today])?state.habits[today]:[],mood:state.mood[today]||'',energy:'',sleepQuality:''};
 const done=daily.habits;
 const duration=sleepMinutes(plan.bed,plan.wake);
 const windDown=clockLabel((timeMinutes(plan.bed)-45+1440)%1440);
 const progress=done.filter(id=>HABITS.some(h=>h.id===id)).length;
 const exerciseTotal=420;
 function save(modify:(old:HealthData)=>HealthData){
  const old=entry.key===key?entry.data:read(key);
  const updated=modify(old);
  try{localStorage.setItem(key,JSON.stringify(updated));setEntry({key,data:updated});setNotice('Сохранено на этом устройстве ✓')}
  catch{setNotice('Не удалось сохранить данные на устройстве. Проверь свободное место.')}
 }
 useEffect(()=>{
  if(!cloud.connected||!cloud.loaded||cloud.days.length||!Object.keys(state.habits).length)return;
  const past=Object.keys(state.habits).sort().slice(-30);
  for(const date of past){
   const habits=Array.isArray(state.habits[date])?state.habits[date]:[];
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>today||habits.length===0)continue;
   cloud.updateDaily({date,habits,mood:state.mood[date]||'',energy:'',sleepQuality:''});
  }
 },[cloud.loaded,cloud.connected,cloud.days.length,key]);
 useEffect(()=>{
  if(!cloud.connected||!cloud.loaded||cloud.plan||!parent)return;
  cloud.updatePlan({meals:state.meals,bed:state.bed,wake:state.wake,allergies:[],notes:''});
 },[cloud.connected,cloud.loaded,!!cloud.plan,parent,key]);
 useEffect(()=>{
  if(!state.reminders||!cloud.plan||!Capacitor.isNativePlatform())return;
  void LocalNotifications.checkPermissions().then(permission=>{
   if(permission.display==='granted')return setupReminders(plan.bed,plan.wake);
  }).catch(e=>console.warn('Health reminder reschedule',e));
 },[plan.bed,plan.wake,!!cloud.plan,state.reminders]);
 function savePlan(next:HealthPlan){
  if(!parent)return;
  save(s=>({...s,meals:next.meals,bed:next.bed,wake:next.wake}));
  cloud.updatePlan(next);
 }
 function saveDaily(next:HealthDaily){
  cloud.updateDaily(next);
  save(s=>({...s,habits:{...s.habits,[next.date]:next.habits},mood:{...s.mood,[next.date]:next.mood}}));
 }
 function markHabit(id:string){
  const next=new Set(done);
  if(next.has(id))next.delete(id);else next.add(id);
  saveDaily({...daily,habits:[...next]});
 }
 function changeSleep(field:'bed'|'wake',value:string){
  if(!parent||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))return;
  savePlan({...plan,[field]:value});
  save(s=>({...s,reminders:false}));
  setNotice('Режим обновлён. Если напоминания были включены, включи их заново на нужном телефоне.');
  void clearReminders().catch(()=>{});
 }
 async function toggleReminders(){
  if(busy)return;
  setBusy(true);setNotice('');
  try{
   if(state.reminders){await clearReminders();save(s=>({...s,reminders:false}));}
   else{await setupReminders(plan.bed,plan.wake);save(s=>({...s,reminders:true}));}
  }catch(e){setNotice(e instanceof Error?e.message:'Не удалось изменить напоминания')}
  finally{setBusy(false)}
 }
 return <div className={'h-health h-theme-'+actualTheme} data-theme={actualTheme} data-theme-choice={themeMode}>
   <div className="h-theme-switcher"><AppThemeSwitch compact selection={themeMode} onChange={onThemeChange}/></div>
   <header className="h-hero">
    <div className="h-sky-art" aria-hidden="true">
     <div className="h-orb"/>
     <div className="h-cloud h-cloud-a"/><div className="h-cloud h-cloud-b"/>
     <div className="h-star h-star-one">✦</div><div className="h-star h-star-two">✧</div><div className="h-star h-star-three">✦</div>
     <div className="h-hill h-hill-back"/><div className="h-hill h-hill-front"/>
     <div className="h-flower h-flower-one">✿</div><div className="h-flower h-flower-two">✿</div><div className="h-firefly h-firefly-a"/><div className="h-firefly h-firefly-b"/>
    </div>
    <div className="h-hero-copy">
     <span>✦ МОЙ МИР · ЗДОРОВЬЕ</span>
     <h1>Мой здоровый день</h1>
     <p>{greeting} Я рядом, Илья! Выбирай, чем займёмся сегодня: сон, вкусная еда или движение.</p>
     <div className="h-hero-chip">{actualTheme==='night'?'🌙 Время для спокойных дел':'🌿 Каждый день по-своему хорош'}</div>
    </div>
    <div className="h-miro" aria-label="Миро из мира на поляне"><MiroAvatar face="smile"/><span className="h-miro-orbit" aria-hidden="true">✧</span></div>
   </header>
   <div className="h-navigation" aria-label="Разделы здоровья">
    {([['today','☀️ Сегодня'],['growth','📏 Я расту'],['exercise','🤸 Зарядка'],['food','🥗 Еда'],['sleep','🌙 Сон'],['garden','🌿 Сад здоровья'],...(parent?[['parent','👨‍👩‍👦 Родителю']]:[])] as [HealthSection,string][]).map(([id,label])=>
     <button key={id} className={section===id?'current':''} onClick={()=>{setSection(id);setNotice('')}}>{label}</button>)}
   </div>

   {section==='today'&&<>
    <div className="h-status-grid">
     <div className="h-status-sleep"><span className="h-status-icon" aria-hidden="true">🌙</span><small>Уложиться спать</small><strong>{plan.bed}</strong><span>Спокойный вечер с {windDown}</span></div>
     <div className="h-status-wake"><span className="h-status-icon" aria-hidden="true">☀️</span><small>Проснуться</small><strong>{plan.wake}</strong><span>Потом зарядка {Math.round(exerciseTotal/60)} минут</span></div>
    </div>
    <button type="button" className="h-growth-shortcut" onClick={()=>setSection('growth')}><span>📏</span><span><strong>Я расту!</strong><small>Мой рост, вес и история измерений</small></span><b>Открыть →</b></button>
    <section className="h-card">
     <div className="h-card-heading"><span className="h-card-icon" aria-hidden="true">🌱</span><h2>Мои добрые привычки</h2></div>
     <p>Отмечай то, что получилось. Пропуски не отнимают баллы, и завтра можно начать снова.</p>
     {HABITS.map(h=><label className={'h-habit '+(done.includes(h.id)?'h-habit-done':'')} key={h.id}>
       <span className="h-habit-icon">{h.icon}</span>
       <span className="h-habit-text"><strong>{h.label}</strong><small>{h.help}</small></span>
       <input type="checkbox" checked={done.includes(h.id)} onChange={()=>markHabit(h.id)} aria-label={h.label}/>
     </label>)}
     <div className="h-progress"><div style={{width:Math.min(100,(progress/HABITS.length)*100)+'%'}}/></div>
     <small className="h-muted">Сегодня отмечено {progress} из {HABITS.length}. Ни одной привычке не присуждается оценка.</small>
    </section>
    <section className="h-card">
     <div className="h-card-heading"><span className="h-card-icon" aria-hidden="true">💛</span><h2>Как ты себя чувствуешь?</h2></div>
     <div className="h-mood">
      {([['good','😊 Бодро'],['ok','🙂 Обычно'],['rest','😴 Нужен отдых']] as const).map(([code,label])=>
       <button className={daily.mood===code?'chosen':''} key={code} onClick={()=>saveDaily({...daily,mood:code})}>{label}</button>)}
     </div>
     <small className="h-muted">Если сильно устал, можно выбрать отдых. Миро не заставляет тренироваться.</small>
    </section>
    <div className="h-action-row"><button onClick={()=>setSection('exercise')}>🤸 Начать зарядку</button><button onClick={()=>setSection('food')}>🥗 Меню на сегодня</button></div>
   </>}

   {section==='growth'&&<GrowthJournal childId={childId} familyId={familyId} parent={parent} legacy={state.measurements}/>}
   {section==='exercise'&&<ExerciseAdventure onComplete={()=>{if(!done.includes('morning'))markHabit('morning')}}/>}
   {section==='food'&&<HealthKitchen plan={plan} parent={parent} connected={cloud.connected} requests={cloud.requests}
     onPlan={savePlan} onPropose={cloud.propose} onDecide={cloud.decide}/>}

   {section==='sleep'&&<SleepWell bed={plan.bed} wake={plan.wake} parent={parent} daily={daily} days={cloud.days}
     reminders={state.reminders} working={busy} onSaveDay={saveDaily} onChangeTime={changeSleep}
     onToggleReminders={()=>void toggleReminders()} onGoAlarm={()=>onOpenSettings?.()}/>}
   {section==='garden'&&<HealthGarden days={cloud.days.length?cloud.days:Object.keys(state.habits).map(date=>({date,habits:state.habits[date],mood:state.mood[date]||'',energy:'',sleepQuality:''}))}
     placements={cloud.garden} night={actualTheme==='night'} today={daily} onSaveGarden={cloud.updateGarden} onSaveDay={saveDaily}/>}

   {section==='parent'&&parent&&<section className="h-card">
    <div className="h-card-heading"><span className="h-card-icon" aria-hidden="true">👨‍👩‍👦</span><h2>Кабинет родителя</h2></div>
    <p>Рост и вес теперь можно вводить в общем семейном дневнике «Я расту!». Родитель и ребёнок видят те же измерения после синхронизации.</p>
    <button type="button" className="h-subtle-button" onClick={()=>setSection('growth')}>📏 Открыть семейный дневник измерений</button>
    <p className="h-caution">У детей взрослые нормы ИМТ не подходят. Не используйте измерения для самостоятельного диагноза, ограничения питания или постановки цели похудеть. Оценку роста и массы тела проводит педиатр.</p>
    <label className="h-parent-note">Заметки для семьи или педиатра<textarea maxLength={700} rows={3} value={state.notes} onChange={e=>save(s=>({...s,notes:e.target.value}))} placeholder="Аллергии, ограничения нагрузок, рекомендации врача"/></label>
    <small className="h-muted">Замечания и измерения хранятся только в памяти этого устройства. Удаление приложения или его данных может стереть записи. Это локальный журнал, не медицинская карта.</small>
   </section>}
   {notice&&<div className="h-notice" role="status">{notice}</div>}
   <div className="h-sync-indicator" role="status">{cloud.connected?(cloud.working?'☁️ Синхронизация…':'☁️ Семейная синхронизация подключена'):'📱 Локальные данные (семейный аккаунт не подключён)'}</div>
   <footer className="h-sources">Источники: <a href="https://www.cdc.gov/healthy-schools/sleep/" target="_blank" rel="noreferrer">CDC (сон)</a>, <a href="https://www.who.int/europe/news-room/fact-sheets/item/physical-activity" target="_blank" rel="noreferrer">ВОЗ (движение)</a>, <a href="https://www.aesan.gob.es/es/nutricion/recomendaciones-dieteticas" target="_blank" rel="noreferrer">AESAN (питание)</a>. Этот раздел помогает соблюдать привычки, но не заменяет рекомендации педиатра.</footer>
  </div>;
}
