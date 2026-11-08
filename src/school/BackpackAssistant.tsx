import {useEffect,useMemo,useState} from 'react';
import type {useSchool} from './useSchool';
import type {useFamilyCloud} from '../lib/useFamilyCloud';
import {dateInMadrid} from '../daily/library';
import './BackpackAssistant.css';
type School=ReturnType<typeof useSchool>;
type Cloud=ReturnType<typeof useFamilyCloud>;
const WEEK=['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
function schoolDate(iso:string,days:number){const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return {iso:d.toISOString().slice(0,10),weekday:d.getUTCDay()}}
export function BackpackAssistant({cloud,school}:{cloud:Cloud;school:School}){
 const today=dateInMadrid();
 const next=useMemo(()=>{for(let days=1;days<=7;days++){const d=schoolDate(today,days);if(school.lessons.some(x=>x.weekday===d.weekday))return d}return schoolDate(today,1)},[today,school.lessons]);
 const [selected,setSelected]=useState<'today'|'next'>('next'),[subject,setSubject]=useState(''),[item,setItem]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [optimistic,setOptimistic]=useState<Record<string,boolean>>({});
 const date=selected==='today'?schoolDate(today,0):next;
 const lessons=school.lessons.filter(x=>x.weekday===date.weekday).sort((a,b)=>a.lesson_order-b.lesson_order);
 const subjects=[...new Set(lessons.map(x=>x.subject.trim()))];
 const allSubjects=[...new Set(school.lessons.map(x=>x.subject.trim()))].sort((a,b)=>a.localeCompare(b,'ru'));
 const items=school.backpackItems.filter(x=>subjects.includes(x.subject));
 const checked=new Set(school.backpackChecks.filter(x=>x.for_date===date.iso).map(x=>x.item_id));
 for(const [id,state] of Object.entries(optimistic))if(state)checked.add(id);else checked.delete(id);
 const prepared=items.length?Math.round(checked.size/items.length*100):0;
 useEffect(()=>setOptimistic({}),[date.iso,cloud.session?.user.id]);
 useEffect(()=>{if(allSubjects.length&&!allSubjects.includes(subject))setSubject(allSubjects[0]);else if(!allSubjects.length)setSubject('')},[school.lessons,subject]);
 async function checkItem(id:string,desired:boolean){
  if(busy)return;setOptimistic(old=>({...old,[id]:desired}));setBusy(true);setError('');setNotice('');
  try{await school.checkBackpackItem(id,date.iso,desired);setNotice('Сохранено ✓')}
  catch(e){setOptimistic(old=>{const copy={...old};delete copy[id];return copy});setError(e instanceof Error?e.message:'Не удалось сохранить рюкзак')}
  finally{setBusy(false)}
 }
 async function save(action:()=>Promise<unknown>){if(busy)return;setBusy(true);setError('');setNotice('');try{await action();setNotice('Сохранено ✓')}catch(e){setError(e instanceof Error?e.message:'Не удалось сохранить')}finally{setBusy(false)}}
 return <section className="mw-panel backpack-hub" aria-label="Рюкзак на следующий учебный день">
  <div className="backpack-header"><div><span>🎒 СОБИРАЮСЬ В ШКОЛУ</span><h3>Мой рюкзак</h3></div><div className="backpack-progress-icon">{items.length&&prepared===100?'✅':'🎒'}</div></div>
  <div className="backpack-days"><button type="button" className={selected==='today'?'selected':''} onClick={()=>setSelected('today')}>Сегодня</button><button type="button" className={selected==='next'?'selected':''} onClick={()=>setSelected('next')}>Следующий учебный день</button></div>
  <p className="backpack-date">{WEEK[date.weekday]} · {date.iso.split('-').reverse().join('.')} · {lessons.length} уроков</p>
  {lessons.length===0?<p className="backpack-empty">Пока нет расписания на этот день. Родитель может ввести предметы выше.</p>:<>
    <p className="backpack-subjects">{subjects.join(' · ')}</p>
    {items.length>0?<><div className="backpack-meter"><span style={{width:prepared+'%'}}/></div><small className="backpack-counter">{items.filter(x=>checked.has(x.id)).length} из {items.length} вещей готово</small>
      {items.map(row=><label key={row.id} className={'backpack-item '+(checked.has(row.id)?'done':'')}><input type="checkbox" disabled={busy||cloud.role!=='child'} checked={checked.has(row.id)} onChange={e=>void checkItem(row.id,e.target.checked)}/><span><strong>{row.item}</strong><small>{row.subject}</small></span>{cloud.role==='parent'&&<button type="button" className="backpack-remove" disabled={busy} onClick={()=>void save(()=>school.deleteBackpackItem(row.id))}>Убрать</button>}</label>)}
      {cloud.role==='child'&&prepared===100&&<div className="backpack-cheer" role="status">🌟 Всё готово! Рюкзак собран. Хорошего учебного дня!</div>}
    </>:<p className="backpack-empty">Для этих уроков принадлежности пока не указаны. Родитель добавляет их один раз, затем можно отмечать каждое утро или вечером.</p>}
  </>}
  {cloud.role==='parent'&&<form className="backpack-parent-form" onSubmit={e=>{e.preventDefault();void save(async()=>{await school.addBackpackItem(subject,item);setItem('')})}}><strong>Добавить предмет в рюкзак</strong><p>Укажи реальные принадлежности для каждого предмета: учебник, тетрадь, пенал и т. д. Илья увидит список в день соответствующего урока.</p><label>Урок<select aria-label="Предмет для рюкзака" disabled={allSubjects.length===0} value={subject} onChange={e=>setSubject(e.target.value)}>{allSubjects.map(x=><option key={x} value={x}>{x}</option>)}</select></label><label>Что взять<input required maxLength={90} placeholder="Например, тетрадь по математике" value={item} onChange={e=>setItem(e.target.value)}/></label><button type="submit" disabled={busy||!subject.trim()||!item.trim()}>Добавить принадлежность</button></form>}
  {error&&<p role="alert" className="school-error">{error}</p>}{notice&&<small role="status" className="backpack-success">{notice}</small>}
 </section>;
}
