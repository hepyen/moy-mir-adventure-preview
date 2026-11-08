import {BackpackAssistant} from './BackpackAssistant';
import {Fragment,useEffect,useMemo,useState} from 'react';
import type {useFamilyCloud} from '../lib/useFamilyCloud';
import type {SchoolPrefs} from './useSchool';
import {useSchool} from './useSchool';
import {askReminderPermission,getReminderStatus,syncReminders} from './reminders';
import './SchoolHub.css';
type Cloud=ReturnType<typeof useFamilyCloud>;
type School=ReturnType<typeof useSchool>;
const DAYS=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const WEEK=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
function localDay(){const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).formatToParts(new Date());const obj=Object.fromEntries(p.map(x=>[x.type,x.value]));return {iso:`${obj.year}-${obj.month}-${obj.day}`,weekday:new Date(`${obj.year}-${obj.month}-${obj.day}T12:00:00`).getDay()}}
function deadlineDate(add:number){const d=new Date();d.setDate(d.getDate()+add);return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(d)}
export function useSchoolNotificationSync(school:School,cloud:Cloud){
 const[notice,setNotice]=useState('');const[allowed,setAllowed]=useState(false);
 const loaded=!!cloud.session&&cloud.role==='child'&&!!cloud.childId;
 const key=useMemo(()=>JSON.stringify({uid:cloud.session?.user.id,lessons:school.lessons.map(x=>[x.weekday,x.lesson_order,x.subject]),prefs:school.prefs}),[cloud.session?.user.id,school.lessons,school.prefs]);
 useEffect(()=>{if(!loaded||school.loading||school.error)return;let active=true;
  void getReminderStatus().then(async state=>{
   if(!active)return;setAllowed(state.allowed);
   if(!state.available||!state.allowed)return;
   const localKey='moymir29-reminders-'+cloud.session?.user.id;
   let prev='';try{prev=localStorage.getItem(localKey)||''}catch{}
   if(prev===key&&state.pending>0)return;
   const out=await syncReminders(school.lessons,school.prefs,cloud.session?.user.id||'');
   if(!active)return;if(out.error)setNotice(out.error);else {setNotice('Напоминания на этом телефоне настроены ✓');try{localStorage.setItem(localKey,key)}catch{}}
  });return()=>{active=false};
 },[loaded,school.loading,school.error,key,cloud.session?.user.id,school.lessons,school.prefs]);
 async function enable(){try{const ok=await askReminderPermission();setAllowed(ok);if(!ok){setNotice('Разреши уведомления для «Моего Мира» в настройках Android');return}
  const r=await syncReminders(school.lessons,school.prefs,cloud.session?.user.id||'');setNotice(r.error||`Запланировано ${r.pending} напоминаний на этом телефоне ✓`);
  if(!r.error)try{localStorage.setItem('moymir29-reminders-'+cloud.session?.user.id,key)}catch{}
 }catch(e){setNotice(e instanceof Error?e.message:'Не удалось разрешить уведомления')}}
 return {allowed,notice,enable};
}
export function SchoolHub({cloud,school,reminders,onAskMiro}:{cloud:Cloud;school:School;reminders:ReturnType<typeof useSchoolNotificationSync>;onAskMiro:(question:string)=>void}){
 const today=localDay();
 const[parentDay,setParentDay]=useState(today.weekday>=1&&today.weekday<=5?today.weekday:1),[slot,setSlot]=useState('1'),[subject,setSubject]=useState(''),[starts,setStarts]=useState(''),[note,setNote]=useState('');
 const[hwSubject,setHwSubject]=useState(''),[hwDescription,setHwDescription]=useState(''),[due,setDue]=useState(deadlineDate(1));
 const[error,setError]=useState(''),[busy,setBusy]=useState(false),[showPrefs,setShowPrefs]=useState(false);
 const[prefsDraft,setPrefsDraft]=useState<SchoolPrefs>(school.prefs);
 const[notice,setNotice]=useState('');

 useEffect(()=>setPrefsDraft(school.prefs),[school.prefs]);
 const todayLessons=school.lessons.filter(x=>x.weekday===today.weekday).sort((a,b)=>a.lesson_order-b.lesson_order);
 const selected=school.lessons.filter(x=>x.weekday===parentDay).sort((a,b)=>a.lesson_order-b.lesson_order);
 const pending=school.homework.filter(x=>!x.completed_at);
 async function action(work:()=>Promise<unknown>){setBusy(true);setError('');try{await work();setNotice('Сохранено ✓')}catch(e){setError(e instanceof Error?e.message:'Не удалось сохранить')}finally{setBusy(false)}}
 return <>
 <section className="mw-greeting"><div className="mw-eyebrow">МОЯ ШКОЛА</div><h1>📚 Учёба</h1><p>Уроки, домашние задания и помощь Миро. Расписание заполняется вручную и сохраняется для обоих аккаунтов.</p></section>
 <div className="school-today"><div><span>HOY · {DAYS[today.weekday]}</span><strong>{todayLessons.length?`${todayLessons.length} clases`:'No hay clases hoy'}</strong></div><div className="school-chip">🎒</div></div>
 <section className="mw-panel school-card"><div className="school-heading"><h3>🗓️ Horario escolar</h3><button aria-label="Actualizar horario" title="Actualizar horario" onClick={()=>void school.refresh()}>↻</button></div>
 <div className="school-days">{WEEK.slice(1,6).map((d,i)=><button key={i+1} className={parentDay===i+1?'chosen':''} onClick={()=>setParentDay(i+1)}>{d}</button>)}</div>
 <p className="school-daytitle">{DAYS[parentDay]} · {selected.length?`${selected.length} clases`:'Sin clases'}</p>
 {selected.length?selected.map(x=><Fragment key={x.id}><div className="school-line"><span className="school-number">{x.lesson_order}</span><div><strong>{x.subject}</strong><small>{x.starts_at?x.starts_at+' · ':''}{x.notes}</small></div>{cloud.role==='parent'&&<button className="school-danger" onClick={()=>void action(()=>school.deleteLesson(x.id))}>Удалить</button>}</div>{x.lesson_order===4&&selected.some(l=>l.starts_at==='12:30')&&<div className="school-recess" aria-label="Recreo de 12:00 a 12:30"><span>☀️ Recreo</span><small>12:00–12:30</small></div>}</Fragment>):<p className="school-empty">No hay clases programadas para este día.</p>}
 {cloud.role==='parent'&&<form className="school-entry" onSubmit={e=>{e.preventDefault();void action(async()=>{await school.writeLesson({weekday:parentDay,lesson_order:Number(slot),subject:subject.trim(),starts_at:starts||null,notes:note});setSubject('');setNote('')})}}>
  <strong>Добавить урок</strong><div className="school-form-row"><label>№ урока<select value={slot} onChange={e=>setSlot(e.target.value)}>{Array.from({length:12},(_,i)=><option value={i+1} key={i}>{i+1}</option>)}</select></label><label>Начало (необязательно)<input type="time" value={starts} onChange={e=>setStarts(e.target.value)}/></label></div>
  <input required maxLength={80} placeholder="Предмет, например: Matemáticas" value={subject} onChange={e=>setSubject(e.target.value)}/><input maxLength={280} placeholder="Класс или заметка (необязательно)" value={note} onChange={e=>setNote(e.target.value)}/><button disabled={busy} type="submit">Сохранить урок</button>
 </form>}
 </section>
 <BackpackAssistant cloud={cloud} school={school}/>
 <section className="mw-panel school-card"><h3>📝 Домашние задания</h3><p className="school-help">Ближайшие задания и сроки сдачи. Выполненное сохраняется в истории.</p>
 {pending.length?pending.map(h=><div className="school-homework" key={h.id}><div><strong>{h.subject}</strong><span>{h.due_date<today.iso?'⚠ Просрочено · ':''}Сдать: {h.due_date}</span><p>{h.description}</p></div><div className="school-actions"><button onClick={()=>void action(()=>school.markHomework(h.id,true))}>✓ Готово</button><button onClick={()=>onAskMiro('Помоги мне разобраться с домашним заданием по предмету '+h.subject+': '+h.description+'. Объясняй по шагам, чтобы я понял решение.')}>🤖 Миро</button>{cloud.role==='parent'&&<button className="school-danger" onClick={()=>void action(()=>school.deleteHomework(h.id))}>Удалить</button>}</div></div>):<p className="school-empty">Пока нет заданий, ожидающих выполнения.</p>}
 {school.homework.filter(x=>x.completed_at).length>0&&<details className="school-done"><summary>✓ Выполненные ({school.homework.filter(x=>x.completed_at).length})</summary>{school.homework.filter(x=>x.completed_at).map(h=><div className="school-line" key={h.id}><div><strong>{h.subject}</strong><small>{h.description}</small></div><button onClick={()=>void action(()=>school.markHomework(h.id,false))}>Вернуть</button></div>)}</details>}
 {cloud.role==='parent'&&<form className="school-entry" onSubmit={e=>{e.preventDefault();void action(async()=>{await school.addHomework({subject:hwSubject.trim(),description:hwDescription.trim(),due_date:due});setHwDescription('')})}}><strong>Добавить домашнее задание</strong><input required maxLength={80} placeholder="Предмет" value={hwSubject} onChange={e=>setHwSubject(e.target.value)}/><textarea required maxLength={1200} placeholder="Что нужно выполнить: параграф, упражнения, страницы" value={hwDescription} onChange={e=>setHwDescription(e.target.value)}/><label>Срок сдачи<input type="date" required value={due} onChange={e=>setDue(e.target.value)}/></label><button disabled={busy}>Сохранить домашнее задание</button></form>}
 </section>
 <section className="mw-panel school-card"><h3>🤖 Миро помогает учиться</h3><p className="school-help">Миро объясняет испанские слова, дроби, биологию и помогает разобраться с задачами. Ответы нейросети нужно проверять.</p><button className="school-ask" onClick={()=>onAskMiro('Привет, Миро! Помоги мне с домашними заданиями на сегодня. Объясняй доступно и помогай научиться решать самому.')}>Открыть Миро и спросить об уроках</button></section>
 <section className="mw-panel school-card"><div className="school-heading"><h3>🔔 Напоминания</h3>{cloud.role==='parent'&&<button onClick={()=>setShowPrefs(x=>!x)}>{showPrefs?'Скрыть':'Настроить'}</button>}</div><p className="school-help">После разрешения Android напомнит об уроках утром и о домашних заданиях вечером. Время и включение задаёт родитель.</p>
 {cloud.role==='parent'&&showPrefs&&<form className="school-entry" onSubmit={e=>{e.preventDefault();void action(()=>school.savePrefs(prefsDraft))}}>{([['school_enabled','school_remind_at','🎒 Школьные уроки'],['homework_enabled','homework_remind_at','📝 Домашние задания'],['verse_enabled','verse_remind_at','📖 Ежедневный стих']] as const).map(([flag,clock,label])=><label className="school-pref" key={flag}><input type="checkbox" checked={prefsDraft[flag]} onChange={e=>setPrefsDraft(v=>({...v,[flag]:e.target.checked}))}/><span>{label}</span><input type="time" value={prefsDraft[clock]} onChange={e=>setPrefsDraft(v=>({...v,[clock]:e.target.value}))}/></label>)}<button disabled={busy}>Сохранить время напоминаний</button></form>}
 {cloud.role==='child'&&<div className="school-reminder-child"><button onClick={()=>void reminders.enable()}>🔔 {reminders.allowed?'Обновить напоминания':'Разрешить напоминания'}</button><small>{reminders.notice||'Напоминания будут запланированы на этом телефоне после разрешения.'}</small></div>}
 <small className="school-caveat">При изменении расписания ребёнку нужно открыть приложение с интернетом хотя бы один раз, чтобы обновить уведомления на его телефоне. Настройки не меняют школьное расписание автоматически.</small>
 </section>
 {(error||school.error)&&<p className="school-error" role="alert">{error||school.error}</p>}{notice&&<p className="school-success" role="status">{notice}</p>}{school.loading&&<small>Синхронизация…</small>}
 </>;
}
