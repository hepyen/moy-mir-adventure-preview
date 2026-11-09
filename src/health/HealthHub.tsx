import {useEffect,useMemo,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {LocalNotifications} from '@capacitor/local-notifications';
import {MiroAvatar} from '../legacyWorld/MiroAvatar';
import './HealthHub.css';

type Meal={breakfast:string;lunch:string;dinner:string;snack:string};
type Measurement={id:string;date:string;height:number;weight:number};
type HealthData={
  habits:Record<string,string[]>;mood:Record<string,string>;meals:Meal[];
  bed:string;wake:string;measurements:Measurement[];reminders:boolean;notes:string
};
type HealthSection='today'|'exercise'|'food'|'sleep'|'parent';
const WEEK=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
const SHORT=['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
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
const ROUTINE=[
 {title:'Проснись и потянись',seconds:40,icon:'🌤️',tip:'Мягко потяни руки вверх, спокойно подыши. Не тянись через боль.'},
 {title:'Круги плечами',seconds:60,icon:'🙆',tip:'Плечи вперёд и назад, медленно и без напряжения.'},
 {title:'Разминка рук',seconds:60,icon:'👐',tip:'Плавно подними и опусти руки, раскрой плечи.'},
 {title:'Шагаем на месте',seconds:90,icon:'🚶',tip:'Лёгкий темп. Если болит стопа или голеностоп, делай движения сидя.'},
 {title:'Встаём со стула',seconds:60,icon:'🪑',tip:'Медленно сядь и встань несколько раз. При боли можно пропустить.'},
 {title:'Потянись в стороны',seconds:60,icon:'🌿',tip:'Вытяни руки вверх и осторожно потянись в стороны, без резких наклонов.'},
 {title:'Спокойное дыхание',seconds:50,icon:'🌈',tip:'Расслабь руки, сделай несколько обычных неторопливых вдохов.'}
];
const GROCERY=[
 'Овощи и зелень','Фрукты и ягоды','Картофель','Яйца','Молоко и натуральный йогурт','Сыр или творог',
 'Курица и индейка','Рыба','Чечевица и нут','Рис и гречка','Овсяные хлопья','Макароны и цельнозерновой хлеб','Оливковое масло'
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
export function HealthHub({parent=false,childId='local'}:{parent?:boolean;childId?:string}){
 const key='moymir-health-local-v1:'+childId;
 const [entry,setEntry]=useState<{key:string;data:HealthData}>(()=>({key,data:read(key)}));
 const state=entry.key===key?entry.data:read(key);
 const [,setClockTick]=useState(0);
 useEffect(()=>{
  const update=()=>setClockTick(n=>n+1);
  const interval=window.setInterval(update,60000);
  const visible=()=>{if(!document.hidden)update()};
  document.addEventListener('visibilitychange',visible);
  return()=>{window.clearInterval(interval);document.removeEventListener('visibilitychange',visible)};
 },[]);
 const [section,setSection]=useState<HealthSection>('today');
 const [selectedDay,setSelectedDay]=useState(madridWeekday);
 const [shopping,setShopping]=useState(false);
 const [mealEdit,setMealEdit]=useState(false);
 const [exerciseStep,setExerciseStep]=useState(0);
 const [secondsLeft,setSecondsLeft]=useState(ROUTINE[0].seconds);
 const [running,setRunning]=useState(false);
 const [completed,setCompleted]=useState(false);
 const [measureHeight,setMeasureHeight]=useState('');
 const [measureWeight,setMeasureWeight]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 const today=dateMadrid();
 const done=Array.isArray(state.habits[today])?state.habits[today]:[];
 const currentMeal=state.meals[selectedDay];
 const duration=sleepMinutes(state.bed,state.wake);
 const windDown=clockLabel((timeMinutes(state.bed)-45+1440)%1440);
 const progress=done.filter(id=>HABITS.some(h=>h.id===id)).length;
 const exerciseTotal=useMemo(()=>ROUTINE.reduce((n,s)=>n+s.seconds,0),[]);
 function save(modify:(old:HealthData)=>HealthData){
  const old=entry.key===key?entry.data:read(key);
  const updated=modify(old);
  try{localStorage.setItem(key,JSON.stringify(updated));setEntry({key,data:updated});setNotice('Сохранено на этом устройстве ✓')}
  catch{setNotice('Не удалось сохранить данные на устройстве. Проверь свободное место.')}
 }
 function markHabit(id:string){
  save(s=>{
   const current=Array.isArray(s.habits[today])?s.habits[today]:[];
   const items=current.includes(id)?current.filter(x=>x!==id):[...current,id];
   const copy={...s.habits,[today]:items};
   const recent=Object.keys(copy).sort();
   for(const old of recent.slice(0,-90))delete copy[old];
   return {...s,habits:copy};
  });
 }
 function changeMeal(field:keyof Meal,value:string){
  if(!parent)return;
  save(s=>({...s,meals:s.meals.map((meal,i)=>i===selectedDay?{...meal,[field]:value.slice(0,180)}:meal)}));
 }
 function changeSleep(field:'bed'|'wake',value:string){
  if(!parent||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value))return;
  save(s=>({...s,[field]:value,reminders:false}));
  setNotice('Режим обновлён. Если напоминания были включены, включите их снова после изменения времени.');
  void clearReminders().catch(()=>{});
 }
 async function toggleReminders(){
  if(!parent||busy)return;
  setBusy(true);setNotice('');
  try{
   if(state.reminders){await clearReminders();save(s=>({...s,reminders:false}));}
   else{await setupReminders(state.bed,state.wake);save(s=>({...s,reminders:true}));}
  }catch(e){setNotice(e instanceof Error?e.message:'Не удалось изменить напоминания')}
  finally{setBusy(false)}
 }
 function addMeasurement(){
  if(!parent)return;
  const h=Number(measureHeight.replace(',','.')),w=Number(measureWeight.replace(',','.'));
  if(!Number.isFinite(h)||h<90||h>210||!Number.isFinite(w)||w<15||w>200){setNotice('Проверьте рост (90–210 см) и вес (15–200 кг).');return}
  save(s=>({...s,measurements:[...s.measurements,{id:String(Date.now()),date:today,height:h,weight:w}].slice(-30)}));
  setMeasureHeight('');setMeasureWeight('');
 }
 function nextExercise(){
  if(exerciseStep===ROUTINE.length-1){setRunning(false);setCompleted(true);setSecondsLeft(0);return}
  const n=exerciseStep+1;setExerciseStep(n);setSecondsLeft(ROUTINE[n].seconds);
 }
 useEffect(()=>{
  if(!running)return;
  const timer=window.setInterval(()=>{
   setSecondsLeft(left=>left>1?left-1:0);
  },1000);
  return()=>window.clearInterval(timer);
 },[running]);
 useEffect(()=>{if(running&&secondsLeft===0)nextExercise()},[secondsLeft,running]);
 function startExercise(){if(completed){setExerciseStep(0);setSecondsLeft(ROUTINE[0].seconds);setCompleted(false)}setRunning(true)}
 const safeNote='При боли, головокружении или неприятных ощущениях остановись. Прыжки не нужны. После травмы ноги нагрузку согласуйте с врачом.';
 return <div className="h-health">
   <header className="h-hero">
    <div className="h-hero-copy">
     <span>МОЙ МИР · ЗДОРОВЬЕ</span>
     <h1>Мой здоровый день 💚</h1>
     <p>Миро помогает заботиться о себе. Сон, вкусная еда, движение и отдых.</p>
    </div>
    <div className="h-miro" aria-label="Миро из мира на поляне"><MiroAvatar face="smile"/></div>
   </header>
   <div className="h-navigation" aria-label="Разделы здоровья">
    {([['today','☀️ Сегодня'],['exercise','🤸 Зарядка'],['food','🥗 Еда'],['sleep','🌙 Сон'],...(parent?[['parent','👨‍👩‍👦 Родителю']]:[])] as [HealthSection,string][]).map(([id,label])=>
     <button key={id} className={section===id?'current':''} onClick={()=>{setSection(id);setNotice('')}}>{label}</button>)}
   </div>

   {section==='today'&&<>
    <div className="h-status-grid">
     <div><small>Уложиться спать</small><strong>{state.bed}</strong><span>Спокойный вечер с {windDown}</span></div>
     <div><small>Проснуться</small><strong>{state.wake}</strong><span>Потом зарядка {Math.round(exerciseTotal/60)} минут</span></div>
    </div>
    <section className="h-card">
     <h2>Мои добрые привычки</h2>
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
     <h2>Как ты себя чувствуешь?</h2>
     <div className="h-mood">
      {([['good','😊 Бодро'],['ok','🙂 Обычно'],['rest','😴 Нужен отдых']] as const).map(([code,label])=>
       <button className={state.mood[today]===code?'chosen':''} key={code} onClick={()=>save(s=>({...s,mood:{...s.mood,[today]:code}}))}>{label}</button>)}
     </div>
     <small className="h-muted">Если сильно устал, можно выбрать отдых. Миро не заставляет тренироваться.</small>
    </section>
    <div className="h-action-row"><button onClick={()=>setSection('exercise')}>🤸 Начать зарядку</button><button onClick={()=>setSection('food')}>🥗 Меню на сегодня</button></div>
   </>}

   {section==='exercise'&&<section className="h-card">
    <h2>Зарядка с Миро</h2>
    <p>Семь спокойных движений, примерно 7 минут. Начинай в своём темпе, без прыжков и перегрузки.</p>
    <div className="h-exercise-stage">
     <span className="h-exercise-icon">{completed?'🌟':ROUTINE[exerciseStep].icon}</span>
     <small>Шаг {exerciseStep+1} из {ROUTINE.length}</small>
     <h3>{completed?'Зарядка завершена!':ROUTINE[exerciseStep].title}</h3>
     <strong className="h-timer">{String(Math.floor(secondsLeft/60)).padStart(2,'0')}:{String(secondsLeft%60).padStart(2,'0')}</strong>
     <p>{completed?'Хорошее начало дня. Теперь можно спокойно позавтракать.':ROUTINE[exerciseStep].tip}</p>
    </div>
    <div className="h-action-row">
     <button onClick={()=>{if(completed)startExercise();else if(running)setRunning(false);else startExercise()}}>{completed?'🔁 Повторить':running?'⏸ Пауза':'▶ Начать / продолжить'}</button>
     <button className="h-secondary" onClick={()=>{setRunning(false);nextExercise()}} disabled={completed}>Следующее движение →</button>
    </div>
    <div className="h-exercise-list">{ROUTINE.map((step,i)=><button key={step.title} className={i===exerciseStep?'active':''} onClick={()=>{setRunning(false);setCompleted(false);setExerciseStep(i);setSecondsLeft(step.seconds)}}>{i+1}. {step.title} · {step.seconds} с</button>)}</div>
    <p className="h-caution">{safeNote}</p>
   </section>}

   {section==='food'&&<section className="h-card">
    <h2>Наше меню на неделю</h2>
    <p>Обычная семейная еда, без диет, подсчёта калорий и запретов. Можно заменять блюда и добавлять перекус, когда голоден.</p>
    <div className="h-week">{SHORT.map((d,i)=><button className={selectedDay===i?'active':''} key={d} onClick={()=>setSelectedDay(i)}>{d}</button>)}</div>
    <h3 className="h-day-name">{WEEK[selectedDay]}</h3>
    {([['breakfast','🌤️ Завтрак'],['lunch','🥘 Обед'],['dinner','🌙 Ужин'],['snack','🍎 Перекус при голоде']] as [keyof Meal,string][]).map(([field,label])=>
     <div className="h-meal" key={field}><strong>{label}</strong>
      {parent&&mealEdit?<textarea rows={2} maxLength={180} value={currentMeal[field]} onChange={e=>changeMeal(field,e.target.value)} aria-label={label}/>:<p>{currentMeal[field]}</p>}
     </div>)}
    {parent&&<div className="h-action-row">
     <button className="h-secondary" onClick={()=>setMealEdit(x=>!x)}>{mealEdit?'✓ Завершить редактирование':'✏️ Изменить меню'}</button>
     <button className="h-secondary" onClick={()=>{if(window.confirm('Вернуть меню этого дня к первоначальному варианту?'))save(s=>({...s,meals:s.meals.map((m,i)=>i===selectedDay?{...BASE_MEALS[i]}:m)}))}}>↺ Вернуть день</button>
    </div>}
    <p className="h-water">💧 Вода — основной напиток. Размер порций выбирайте по голоду, насыщению и рекомендациям врача, а не по баллам.</p>
    <button className="h-subtle-button" onClick={()=>setShopping(x=>!x)}>{shopping?'Скрыть список покупок':'🛒 Пример списка покупок'}</button>
    {shopping&&<div className="h-shopping"><p>Список составлен по исходному меню. Если меняли блюда, проверьте его вручную.</p>{GROCERY.map(x=><div key={x}>• {x}</div>)}</div>}
   </section>}

   {section==='sleep'&&<section className="h-card">
    <h2>Спокойный сон</h2>
    <p>В 12 лет обычно требуется 9–12 часов сна за сутки. Режим можно изменить вместе с родителем.</p>
    <div className="h-status-grid">
     <div><small>Ложиться спать</small><strong>{state.bed}</strong></div>
     <div><small>Просыпаться</small><strong>{state.wake}</strong></div>
    </div>
    <div className="h-sleep-total">🌙 Между отбоем и подъёмом: <strong>{asHours(duration)}</strong></div>
    {duration<540||duration>720?<p className="h-caution">Этот интервал выходит за обычные рекомендации для 12-летних. Посмотрите режим вместе с педиатром.</p>:<p className="h-positive">Это позволяет выделить достаточно времени на сон, если удаётся уснуть близко ко времени отбоя.</p>}
    <div className="h-timeline">
     <div><strong>{windDown}</strong><span>Заканчиваем игры, приглушаем свет, убираем экран</span></div>
     <div><strong>{clockLabel((timeMinutes(state.bed)-30+1440)%1440)}</strong><span>Душ, зубы, удобная одежда, спокойная подготовка</span></div>
     <div><strong>{state.bed}</strong><span>Тихо, темно, сон</span></div>
     <div><strong>{state.wake}</strong><span>Доброе утро с Миро</span></div>
    </div>
    {parent&&<div className="h-sleep-edit">
     <label>Время отбоя<input type="time" value={state.bed} onChange={e=>changeSleep('bed',e.target.value)}/></label>
     <label>Время подъёма<input type="time" value={state.wake} onChange={e=>changeSleep('wake',e.target.value)}/></label>
     <button disabled={busy} onClick={()=>void toggleReminders()}>{state.reminders?'🔕 Выключить напоминания':'🔔 Включить напоминания Android'}</button>
     <small>При включении на этом телефоне появятся вечернее напоминание и утренний сигнал. Системный будильник Миро настраивается отдельно.</small>
    </div>}
   </section>}

   {section==='parent'&&parent&&<section className="h-card">
    <h2>Кабинет родителя</h2>
    <p>Рост и вес необязательны. Данные видны только в родительском разделе интерфейса и сохраняются локально на этом устройстве, без отправки в семейный чат или облако.</p>
    <p className="h-caution">У детей взрослые нормы ИМТ не подходят. Не используйте эту историю для самостоятельного диагноза, ограничения питания или постановки цели похудеть. Оценку роста и массы тела проводит педиатр.</p>
    <div className="h-measure-entry">
     <label>Рост, см<input type="number" min="90" max="210" step=".1" placeholder="Например, 151" value={measureHeight} onChange={e=>setMeasureHeight(e.target.value)}/></label>
     <label>Вес, кг<input type="number" min="15" max="200" step=".1" placeholder="Например, 48" value={measureWeight} onChange={e=>setMeasureWeight(e.target.value)}/></label>
    </div>
    <button className="h-subtle-button" onClick={addMeasurement}>Сохранить измерение</button>
    {state.measurements.length>0&&<div className="h-measure-list">{[...state.measurements].reverse().map(m=><div key={m.id}><span>{m.date.split('-').reverse().join('.')} · {m.height} см · {m.weight} кг</span><button aria-label="Удалить измерение" onClick={()=>{if(window.confirm('Удалить запись измерения?'))save(s=>({...s,measurements:s.measurements.filter(x=>x.id!==m.id)}))}}>✕</button></div>)}</div>}
    <label className="h-parent-note">Заметки для семьи или педиатра<textarea maxLength={700} rows={3} value={state.notes} onChange={e=>save(s=>({...s,notes:e.target.value}))} placeholder="Аллергии, ограничения нагрузок, рекомендации врача"/></label>
    <small className="h-muted">Замечания и измерения хранятся только в памяти этого устройства. Удаление приложения или его данных может стереть записи. Это локальный журнал, не медицинская карта.</small>
   </section>}
   {notice&&<div className="h-notice" role="status">{notice}</div>}
   <footer className="h-sources">Источники: <a href="https://www.cdc.gov/healthy-schools/sleep/" target="_blank" rel="noreferrer">CDC (сон)</a>, <a href="https://www.who.int/europe/news-room/fact-sheets/item/physical-activity" target="_blank" rel="noreferrer">ВОЗ (движение)</a>, <a href="https://www.aesan.gob.es/es/nutricion/recomendaciones-dieteticas" target="_blank" rel="noreferrer">AESAN (питание)</a>. Этот раздел помогает соблюдать привычки, но не заменяет рекомендации педиатра.</footer>
  </div>;
}
