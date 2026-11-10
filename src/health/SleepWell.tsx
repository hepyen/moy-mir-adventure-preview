import type {HealthDaily} from './useHealthFamily';
import './SleepWell.css';
const WEEK=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const fmt=(s:string)=>s.slice(0,5);
function minutes(v:string){const [h,m]=v.split(':').map(Number);return h*60+m}
function clock(v:number){v=(v+1440)%1440;return String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0')}
const dayNow=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const QUALITY=[{key:'great',text:'😌 Хорошо'}, {key:'ok',text:'🙂 Обычно'}, {key:'poor',text:'😴 Не выспался'}] as const;
const ENERGY=[{key:'high',text:'⚡ Бодрый'}, {key:'normal',text:'🌿 Обычно'}, {key:'low',text:'☁️ Устал'}] as const;
export function SleepWell({bed,wake,parent,daily,days,reminders,working,onSaveDay,onChangeTime,onToggleReminders,onGoAlarm}:{
 bed:string;wake:string;parent:boolean;daily:HealthDaily;days:HealthDaily[];reminders:boolean;working:boolean;
 onSaveDay:(d:HealthDaily)=>void;onChangeTime:(field:'bed'|'wake',v:string)=>void;
 onToggleReminders:()=>void;onGoAlarm:()=>void;
}){
 const total=(minutes(wake)-minutes(bed)+1440)%1440;
 const wind=clock(minutes(bed)-45),quiet=clock(minutes(bed)-30);
 const entries=Array.from({length:7},(_,i)=>{
  const day=new Date(dayNow()+'T12:00:00Z');day.setUTCDate(day.getUTCDate()-(6-i));
  const date=day.toISOString().slice(0,10);return {date,weekday:WEEK[day.getUTCDay()],record:days.find(r=>r.date===date)};
 });
 return <section className="h-sleepwell" aria-label="Мой сон и самочувствие">
  <div className="h-sleep-night"><div className="h-sleep-moon" aria-hidden="true">☾</div><div className="h-sleep-stars" aria-hidden="true">✦　✧　　 ✦　　✧</div>
   <small>🌙 МОЙ СПОКОЙНЫЙ ВЕЧЕР</small><h2>Пора отдыхать</h2><p>Миро поможет закончить день без спешки, чтобы утром было легче проснуться.</p>
  </div>
  <div className="h-sleep-clocks">
   <div><small>🌙 Отбой</small><strong>{fmt(bed)}</strong></div>
   <div><small>☀️ Подъём</small><strong>{fmt(wake)}</strong></div>
  </div>
  <div className="h-sleep-duration"><span>На сон отведено</span><strong>{Math.floor(total/60)} ч {String(total%60).padStart(2,'0')} мин</strong><small>Рекомендованный диапазон для 12 лет: 9–12 часов сна</small></div>
  {(total<540||total>720)&&<p className="h-caution">Расписание выходит за рекомендованный диапазон. Обсудите режим с родителем и при необходимости с педиатром.</p>}
  <div className="h-card"><div className="h-card-heading"><span className="h-card-icon">✨</span><h2>Вечерний маршрут</h2></div>
   <div className="h-sleep-steps">
    <div><span>🎮</span><b>{wind}</b><p>Заканчиваем игры, убираем телефон, приглушаем свет</p></div>
    <div><span>🪥</span><b>{quiet}</b><p>Душ, чистка зубов, подготовка одежды и рюкзака</p></div>
    <div><span>📖</span><b>{clock(minutes(bed)-15)}</b><p>Тихое чтение, спокойные семейные дела</p></div>
    <div><span>🌙</span><b>{bed}</b><p>Уютно укладываемся спать</p></div>
   </div>
  </div>
  <div className="h-card"><div className="h-card-heading"><span className="h-card-icon">🌤️</span><h2>Как я спал сегодня?</h2></div>
   <p>Не ставим оценок. Если устал, можно отдохнуть и рассказать родителям.</p>
   <h3>Качество сна</h3>
   <div className="h-sleep-options">{QUALITY.map(x=><button key={x.key} aria-pressed={daily.sleepQuality===x.key} className={daily.sleepQuality===x.key?'active':''} onClick={()=>onSaveDay({...daily,sleepQuality:x.key})}>{x.text}</button>)}</div>
   <h3>Моя бодрость</h3>
   <div className="h-sleep-options">{ENERGY.map(x=><button key={x.key} aria-pressed={daily.energy===x.key} className={daily.energy===x.key?'active':''} onClick={()=>onSaveDay({...daily,energy:x.key})}>{x.text}</button>)}</div>
  </div>
  <div className="h-card"><div className="h-card-heading"><span className="h-card-icon">📅</span><h2>Как прошла неделя</h2></div>
   <div className="h-sleep-week">{entries.map(x=><div key={x.date}><strong>{x.weekday}</strong><span>{x.record?.sleepQuality==='great'?'😊':x.record?.sleepQuality==='ok'?'🙂':x.record?.sleepQuality==='poor'?'😴':'·'}</span><small>{x.date.slice(8)}</small></div>)}</div>
   <p className="h-muted">В дневнике видны только твои отметки. Если несколько дней подряд плохо спишь, расскажи родителю.</p>
  </div>
  <div className="h-card"><div className="h-card-heading"><span className="h-card-icon">⏰</span><h2>Будильник и напоминания</h2></div>
   <p>Вечером Миро напомнит о подготовке ко сну. Системный будильник с голосом и уроками настраивается отдельно.</p>
   {parent&&<div className="h-sleep-time-controls"><label>Во сколько ложиться<input type="time" value={fmt(bed)} onChange={e=>onChangeTime('bed',e.target.value)}/></label><label>Во сколько вставать<input type="time" value={fmt(wake)} onChange={e=>onChangeTime('wake',e.target.value)}/></label></div>}
   <button className="h-sleep-notification" disabled={working} onClick={onToggleReminders}>{reminders?'🔕 Выключить уведомления на этом телефоне':'🔔 Включить вечерние и утренние уведомления'}</button>
   <button className="h-sleep-open-alarm" onClick={onGoAlarm}>🤖 Открыть будильник Миро в настройках</button>
   <small className="h-muted">Уведомления действуют на том телефоне, на котором их включили, при разрешении Android. Они не заменяют системный будильник.</small>
  </div>
 </section>;
}
