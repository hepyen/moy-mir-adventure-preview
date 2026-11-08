import {useEffect,useMemo,useState} from 'react';
import type {useSchool} from '../school/useSchool';
import type {useFamilyCloud} from '../lib/useFamilyCloud';
import {dateInMadrid} from '../daily/library';
import './MyDay.css';
type Cloud=ReturnType<typeof useFamilyCloud>;
type School=ReturnType<typeof useSchool>;
type Section='tasks'|'school'|'spiritual'|'shop';
type Mode='morning'|'afternoon'|'evening';
const weekday=(iso:string)=>new Date(iso+'T12:00:00Z').getUTCDay();
const offset=(iso:string,n:number)=>{const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const TIMEZONE='Europe/Madrid';
function timeInSpain(){const parts=new Intl.DateTimeFormat('en-GB',{timeZone:TIMEZONE,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());return Number(parts.find(x=>x.type==='hour')?.value||0)*60+Number(parts.find(x=>x.type==='minute')?.value||0)}
function getMode(minutes:number,schoolDay:boolean):Mode{return minutes<(schoolDay?14*60+30:12*60)?'morning':minutes<19*60?'afternoon':'evening'};
const MODES:{id:Mode,label:string,icon:string}[]=[{id:'morning',label:'Утро',icon:'🌅'},{id:'afternoon',label:'После школы',icon:'🌤️'},{id:'evening',label:'Вечер',icon:'🌙'}];
const dayNames=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
export function MyDay({cloud,school,onGo,onAskMiro}:{cloud:Cloud;school:School;onGo:(section:Section)=>void;onAskMiro:(question:string)=>void}){
 const [clock,setClock]=useState(()=>({date:dateInMadrid(),hour:timeInSpain()}));
 const [manual,setManual]=useState<Mode|null>(null);
 useEffect(()=>{const tick=()=>setClock({date:dateInMadrid(),hour:timeInSpain()});const t=setInterval(tick,60_000);document.addEventListener('visibilitychange',tick);return()=>{clearInterval(t);document.removeEventListener('visibilitychange',tick)}},[]);
 const date=clock.date;
 const weekdayToday=weekday(date);
 const lessons=school.lessons.filter(x=>x.weekday===weekdayToday).sort((a,b)=>a.lesson_order-b.lesson_order);
 const active=manual||getMode(clock.hour,lessons.length>0);
 const nextSchool=useMemo(()=>{for(let i=1;i<=7;i++){const iso=offset(date,i);if(school.lessons.some(x=>x.weekday===weekday(iso)))return {iso,day:weekday(iso)}}return null},[date,school.lessons]);
 const tomorrowLessons=nextSchool?school.lessons.filter(x=>x.weekday===nextSchool.day).sort((a,b)=>a.lesson_order-b.lesson_order):[];
 const overdue=school.homework.filter(x=>!x.completed_at&&x.due_date<=date);
 const outstanding=school.homework.filter(x=>!x.completed_at).sort((a,b)=>a.due_date.localeCompare(b.due_date));
 const pending=cloud.tasks.filter(x=>x.status!=='approved'&&x.status!=='submitted')||[];
 const dailyPending=cloud.daily.filter(x=>x.status!=='approved'&&x.status!=='submitted')||[];
 const verseDone=cloud.spiritual.some(x=>x.activity_date===date&&x.step_id==='daily-text'&&Number(x.points)>=10);
 const backpackItems=nextSchool?school.backpackItems.filter(x=>tomorrowLessons.some(l=>l.subject===x.subject)):[];
 const backpackDone=nextSchool?new Set(school.backpackChecks.filter(x=>x.for_date===nextSchool.iso).map(x=>x.item_id)):new Set<string>();
 const bagReady=backpackItems.length>0&&backpackItems.every(x=>backpackDone.has(x.id));
 const cards=active==='morning'?[{icon:'🌾',title:'Текст дня',description:verseDone?'Сегодня уже прочитан ✓':'Читай в своём темпе, без вопросов',section:'spiritual' as Section,button:verseDone?'Посмотреть':'Открыть стих'},
 {icon:'📚',title:lessons.length?`Сегодня ${lessons.length} clases`:'Hoy no hay clases',description:lessons.map(x=>x.subject).join(' · ')||'Свободный от уроков день',section:'school' as Section,button:'Horario escolar'},
 {icon:'🎒',title:'Школьный рюкзак',description:lessons.length?'Проверь, всё ли взял в школу':'Можно подготовиться к следующему учебному дню',section:'school' as Section,button:'Мой рюкзак'}]
 :active==='afternoon'?[{icon:'📝',title:'Домашние задания',description:outstanding.length?`${outstanding.length} заданий ещё не завершено${overdue.length?` · ${overdue.length} на сегодня или просрочено`:''}`:'Нет невыполненных домашних заданий',section:'school' as Section,button:'К заданиям'},
 {icon:'✅',title:'Мои дела',description:`${dailyPending.length+pending.length} текущих дел ждут выполнения`,section:'tasks' as Section,button:'Посмотреть дела'},
 {icon:'🌿',title:'Отдых и прогулка',description:'Время для отдыха тоже важно. Не нужно заполнять делами весь день.',section:'tasks' as Section,button:'Открыть дела'}]
 :[{icon:'🎒',title:'Собери рюкзак на следующий день',description:nextSchool?`${dayNames[nextSchool.day]}: ${tomorrowLessons.map(x=>x.subject).join(' · ')||'уроки ещё не введены'}${bagReady?' · Рюкзак готов ✓':''}`:'Школьное расписание ещё не заполнено',section:'school' as Section,button:'Подготовить'},
 {icon:'✅',title:'Закончить дела',description:dailyPending.length?`${dailyPending.length} ежедневных дел ещё без подтверждения`:'Ежедневные дела выполнены или ожидают подтверждения',section:'tasks' as Section,button:'Мои дела'},
 {icon:'🌙',title:'Спокойный вечер',description:'Подготовь одежду, отложи экран и оставь время для семьи.',section:'spiritual' as Section,button:'Духовный рост'}];
 return <section className="mw-panel myday" aria-label="Мой день">
  <div className="myday-top"><div><small>☀️ ПЛАН НА СЕГОДНЯ</small><h3>Мой день</h3><p>{dayNames[weekdayToday]} · {date.split('-').reverse().join('.')}</p></div><span className="myday-emblem">{MODES.find(x=>x.id===active)?.icon}</span></div>
  <div className="myday-modes" role="group" aria-label="Режимы дня">{MODES.map(x=><button key={x.id} type="button" className={active===x.id?'active':''} aria-pressed={active===x.id} onClick={()=>setManual(x.id)}><span>{x.icon}</span>{x.label}</button>)}<button type="button" onClick={()=>setManual(null)} className={manual===null?'auto active-auto':'auto'} title="Выбирать режим по времени Испании">Авто</button></div>
  <div className="myday-cards">{cards.map(x=><div className="myday-card" key={x.title}><div className="myday-card-icon">{x.icon}</div><div className="myday-card-copy"><strong>{x.title}</strong><p>{x.description}</p></div><button type="button" onClick={()=>onGo(x.section)}>{x.button}</button></div>)}</div>
  <button className="myday-miro" type="button" onClick={()=>onAskMiro(active==='morning'?'Какие уроки у меня сегодня?':active==='evening'?'Что мне положить в рюкзак на следующий учебный день?':'Какие у меня невыполненные домашние задания?')}>🤖 Спросить Миро про сегодняшний день</button>
  {cloud.role==='parent'&&<p className="myday-parent">👨‍👩‍👦 Родитель видит тот же план, но только Илья отмечает выполненные задания. Баллы начисляются по прежним правилам.</p>}
 </section>;
}
