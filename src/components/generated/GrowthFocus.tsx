import {useEffect,useMemo,useState} from 'react';
import type {useFamilyCloud} from '../../lib/useFamilyCloud';
import {supabase} from '../../lib/supabase';
import {dateInMadrid} from '../../daily/library';
import {GROWTH_QUALITIES,QUALITY_IDS,WEEK_DAYS,GROWTH_DAY_POINTS} from './growthChallenges';
import type {QualityId} from './growthChallenges';
import './GrowthFocus.css';
type Cloud=ReturnType<typeof useFamilyCloud>;
type DailyRecord={activity_date:string;quality:QualityId;points:number};
function monday(iso:string){const d=new Date(iso+'T12:00:00Z'),wd=d.getUTCDay();d.setUTCDate(d.getUTCDate()-(wd===0?6:wd-1));return d.toISOString().slice(0,10)}
function weekDate(iso:string,offset:number){const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)}
const DAY_MS=60_000;
export function GrowthFocus({cloud}:{cloud:Cloud}){
 const [today,setToday]=useState(dateInMadrid);
 const week=monday(today),currentIndex=(new Date(today+'T12:00:00Z').getUTCDay()+6)%7;
 const [stored,setStored]=useState<QualityId|null>(null),[draft,setDraft]=useState<QualityId|null>(null);
 const [records,setRecords]=useState<DailyRecord[]>([]),[activeDay,setActiveDay]=useState(currentIndex);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const isChild=cloud.role==='child';
 const completed=records.some(r=>r.activity_date===today&&r.quality===stored);
 const total=records.filter(r=>r.quality===stored).length;
 const fixed=total>0;
 const preview=draft?GROWTH_QUALITIES[draft]:null;
 const choiceLocked=fixed&&stored!==draft;
 useEffect(()=>{const timer=setInterval(()=>{const day=dateInMadrid();setToday(old=>old===day?old:day)},DAY_MS);return()=>clearInterval(timer)},[]);
 useEffect(()=>{setActiveDay(currentIndex)},[week,currentIndex]);
 useEffect(()=>{
  if(!supabase||!cloud.familyId||!cloud.childId){setStored(null);setDraft(null);setRecords([]);setLoading(false);return}
  let alive=true;setLoading(true);setError('');setMessage('');setStored(null);setDraft(null);setRecords([]);
  const load=async()=>{
   const [f,r]=await Promise.all([
    supabase!.from('moymir_growth_focus').select('quality').eq('family_id',cloud.familyId).eq('child_id',cloud.childId).eq('week_start',week).maybeSingle(),
    supabase!.from('moymir_growth_daily').select('activity_date,quality,points').eq('family_id',cloud.familyId).eq('child_id',cloud.childId).gte('activity_date',week).lte('activity_date',weekDate(week,6)).order('activity_date')
   ]);
   if(!alive)return;
   if(f.error||r.error){setError(f.error?.message||r.error?.message||'Не удалось загрузить задания');setLoading(false);return}
   const saved=QUALITY_IDS.includes(f.data?.quality as QualityId)?f.data?.quality as QualityId:null;
   setStored(saved);setDraft(saved);setRecords((r.data||[]) as DailyRecord[]);setLoading(false)
  };
  void load();return()=>{alive=false}
 },[cloud.familyId,cloud.childId,cloud.session?.user.id,week]);
 const dates=useMemo(()=>WEEK_DAYS.map((label,i)=>({label,date:weekDate(week,i)})),[week]);
 const day=preview?.days[activeDay];
 const dayRecord=records.find(r=>r.activity_date===dates[activeDay]?.date);
 const dayIsToday=dates[activeDay]?.date===today;
 async function choose(){
  if(!isChild||busy||loading||!draft||choiceLocked||draft===stored)return;
  setBusy(true);setError('');setMessage('');
  try{
   await cloud.rpc('moymir_choose_weekly_quality',{p_family:cloud.familyId,p_week:week,p_quality:draft});
   setStored(draft);setMessage('Твой выбор сохранён. Начни с сегодняшнего задания!')
  }catch(e){setError(e instanceof Error?e.message:'Не удалось сохранить выбор')}
  finally{setBusy(false)}
 }
 async function finish(){
  if(!isChild||busy||!stored||draft!==stored||completed||!dayIsToday||loading)return;
  // The child confirms a real action, without a quiz or invasive surveillance.
  setBusy(true);setError('');setMessage('');
  try{
   await cloud.rpc('moymir_complete_growth_day',{p_family:cloud.familyId,p_date:today,p_quality:stored});
   setRecords(old=>old.some(r=>r.activity_date===today)?old:[...old,{activity_date:today,quality:stored,points:GROWTH_DAY_POINTS}]);
   setMessage('🌟 Молодец! +20 баллов духовного роста за сегодняшнее задание.')
  }catch(e){setError(e instanceof Error?e.message:'Не удалось сохранить выполнение')}
  finally{setBusy(false)}
 }
 return <section className="mw-panel growth-focus" aria-label="Качество недели">
   <div className="growth-head"><div><span className="growth-eyebrow">🌱 МОЙ ДУХОВНЫЙ РОСТ</span><h3>Качество недели</h3></div><div className="growth-head-icon">🌻</div></div>
   <p className="growth-intro">{stored?'Семь дней практики: одно небольшое доброе дело каждый день.':'Выбери сам, над каким качеством хочешь работать на этой неделе. Никакого выбора за тебя.'}</p>
   <div className="growth-week-label">📅 {week.split('-').reverse().join('.')} — {weekDate(week,6).split('-').reverse().join('.')} · понедельник–воскресенье</div>
   <div className="growth-options" role="group" aria-label="Выбор одного из семи качеств">
     {QUALITY_IDS.map(id=>{const q=GROWTH_QUALITIES[id],chosen=draft===id;return <button key={id} type="button" aria-pressed={chosen} className={chosen?'chosen':''} disabled={busy||loading||(fixed&&stored!==id&&isChild)} title={fixed&&stored!==id&&isChild?'После первой выполненной задачи выбор закреплён до следующего понедельника':q.short}
       onClick={()=>{setDraft(id);setMessage('');setError('')}}><span>{q.icon}</span><small>{q.name}</small></button>})}
   </div>
   {loading&&<p className="growth-status">Загружаем программу недели…</p>}
   {!loading&&!draft&&<div className="growth-unselected"><strong>👆 Начни с выбора качества</strong><p>Выше семь вариантов. После выбора появятся задания на каждый день недели.</p></div>}
   {!loading&&preview&&<>
    <div className="growth-choice-explainer"><strong>{preview.icon} {preview.name}</strong><p>{preview.short}</p><small>Основано на публикации JW.ORG: {preview.source}</small></div>
    {isChild&&draft!==stored&&!choiceLocked&&<button className="growth-save" type="button" disabled={busy} onClick={()=>void choose()}>{busy?'Сохраняем…':`Выбрать «${preview.name}» на эту неделю`}</button>}
    {choiceLocked&&<p className="growth-fixed">🔒 После первого выполненного задания качество закрепляется до следующего понедельника. Твои баллы сохранены.</p>}
    {!isChild&&<p className="growth-parent-note">👨‍👩‍👦 Это просмотр для родителя. Илья выбирает качество в своём аккаунте.</p>}
    {stored&&draft===stored&&<>
     <div className="growth-progress-head"><strong>Моя неделя</strong><span>{total} из 7 · {total*GROWTH_DAY_POINTS} / 140 ✨</span></div>
     <div className="growth-progress"><span style={{width:`${total/7*100}%`}}/></div>
     <div className="growth-day-nav" role="group" aria-label="Задания по дням недели">
       {dates.map(({label,date},i)=><button type="button" key={date} className={`${activeDay===i?'active ':''}${records.some(r=>r.activity_date===date)?'completed ':''}${date===today?'today':''}`} aria-pressed={activeDay===i} onClick={()=>setActiveDay(i)}><strong>{label.slice(0,2)}</strong><span>{records.some(r=>r.activity_date===date)?'✓':i===currentIndex?'●':String(i+1)}</span></button>)}
     </div>
     {day&&<article className="growth-daily-challenge" aria-label="Задание выбранного дня">
       <div className="growth-day-heading"><span>{dates[activeDay].label}, {dates[activeDay].date.split('-').slice(1).reverse().join('.')}</span><strong>{dayRecord?'✅ Выполнено':dayIsToday?'🌟 Задание на сегодня':dates[activeDay].date>today?'Скоро':'Прошедший день'}</strong></div>
       <h4>{day.title}</h4><p>{day.task}</p>
       <div className="growth-principle">📖 <strong>{day.verse}</strong><span>Библейский принцип для размышления</span></div>
       {isChild&&dayIsToday&&!dayRecord&&<button className="growth-finish" disabled={busy} type="button" onClick={()=>void finish()}>{busy?'Сохраняем…':'✓ Я выполнил задание · +20 ✨'}</button>}
       {dayRecord&&<div className="growth-done" role="status">🌻 Задание выполнено · +20 баллов духовного роста</div>}
       {dayIsToday&&!dayRecord&&<small className="growth-honesty">Отмечай только то, что действительно сделал. Ответов и проверочных вопросов не будет.</small>}
       {!dayIsToday&&!dayRecord&&<small className="growth-honesty">Баллы начисляются только за задание сегодняшнего дня. Пропущенные дни без штрафов.</small>}
     </article>}
    </>}
   </>}
   {message&&<p className="growth-success" role="status">{message}</p>}
   {error&&<p className="school-error" role="alert">{error}</p>}
   <p className="growth-footer">💛 20 баллов за день, максимум 140 за неделю. Баллы учитываются только в духовном росте. Задания составлены по библейским принципам и материалам JW.ORG, без экзаменов.</p>
 </section>
}
