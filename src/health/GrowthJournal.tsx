import {useCallback,useEffect,useMemo,useState} from 'react';
import {supabase} from '../lib/supabase';
import './GrowthJournal.css';

export type GrowthMeasurement={id:string;date:string;height:number;weight:number};
type GrowthRow=GrowthMeasurement&{ref:string;pending?:boolean;legacy?:boolean};
type SaveInput={date:string;height:number;weight:number};
const TABLE='moymir_health_measurements';
const dateMadrid=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const cacheKey=(childId:string)=>'moymir-growth-journal-v2:'+childId;
const legacyDoneKey=(childId:string)=>'moymir-growth-legacy-imported-v1:'+childId;
const reminderKey=(childId:string)=>'moymir-growth-reminder-v1:'+childId;
const dayGap=(d:string)=>Math.round((Date.parse(dateMadrid()+'T12:00:00Z')-Date.parse(d+'T12:00:00Z'))/86400000);
function safeRows(list:unknown):GrowthRow[]{
 if(!Array.isArray(list))return [];
 return list.filter((r):r is GrowthRow=>!!r&&typeof r==='object'
  &&typeof r.id==='string'&&typeof r.ref==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)
  &&Number.isFinite(r.height)&&r.height>=90&&r.height<=210&&Number.isFinite(r.weight)&&r.weight>=15&&r.weight<=200)
  .slice(-120).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
function readCache(childId:string):GrowthRow[]{try{return safeRows(JSON.parse(localStorage.getItem(cacheKey(childId))||'[]'))}catch{return []}}
function toRow(r:any):GrowthRow{return {id:r.id,ref:r.client_ref,date:r.measured_on,height:Number(r.height_cm),weight:Number(r.weight_kg)}}
const sameRecord=(a:GrowthRow,b:GrowthRow)=>a.ref===b.ref;
function merge(remote:GrowthRow[],pending:GrowthRow[]){return safeRows([...remote,...pending.filter(p=>!remote.some(r=>sameRecord(r,p)))])}
function localRecord(data:SaveInput):GrowthRow{
 const id='local-'+Date.now()+'-'+Math.random().toString(36).slice(2,9);
 return {id,ref:id,date:data.date,height:data.height,weight:data.weight,pending:true};
}
const sorted=(x:GrowthRow[])=>[...x].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
function GrowthGraph({items,metric}:{items:GrowthRow[];metric:'height'|'weight'}){
 const values=sorted(items).map(x=>({value:x[metric],date:x.date}));
 const title=metric==='height'?'Мой рост':'Мой вес';
 const suffix=metric==='height'?'см':'кг';
 if(!values.length)return <div className="h-growth-plot"><div className="h-growth-plot-head"><strong>{title}</strong><span>— {suffix}</span></div><div className="h-growth-empty">График появится после первого измерения.</div></div>;
 const lo=Math.min(...values.map(p=>p.value)),hi=Math.max(...values.map(p=>p.value));
 const range=Math.max(2,hi-lo);const min=lo-range*.3,max=hi+range*.3;
 const p=values.map((x,i)=>{
   const px=values.length===1?154:22+(i/(values.length-1))*264;
   const py=105-((x.value-min)/(max-min))*82;
   return {x:px,y:py,...x};
 });
 return <div className="h-growth-plot">
  <div className="h-growth-plot-head"><strong>{title}</strong><span>{values.at(-1)!.value.toLocaleString('ru-RU')} {suffix}</span></div>
  <svg viewBox="0 0 310 152" role="img" aria-label={title+': история измерений'} preserveAspectRatio="xMidYMid meet">
   <title>{title}: даты и значения измерений</title>
   {[28,64,104].map((y,i)=><line key={i} x1="13" y1={y} x2="297" y2={y} stroke="currentColor" strokeOpacity=".12" strokeDasharray="4 5"/>)}
   <polyline fill="none" stroke="var(--h-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={p.map(x=>x.x+','+x.y).join(' ')}/>
   {p.map((x,i)=><g key={i}>
    <circle cx={x.x} cy={x.y} r="5" fill="var(--h-accent)" stroke="var(--h-card)" strokeWidth="2"/>
    <title>{new Date(x.date+'T12:00:00Z').toLocaleDateString('ru-RU',{timeZone:'UTC'})}: {x.value} {suffix}</title>
   </g>)}
   <text x="15" y="133" fontSize="10" fill="currentColor" opacity=".7">{values[0].date.slice(8,10)+'.'+values[0].date.slice(5,7)}</text>
   {values.length>1&&<text x="297" y="133" fontSize="10" textAnchor="end" fill="currentColor" opacity=".7">{values.at(-1)!.date.slice(8,10)+'.'+values.at(-1)!.date.slice(5,7)}</text>}
  </svg>
  <small>{values.length===1?'Первое измерение сохранено.':values.length+' измерений · история без оценок и целей похудения'}</small>
 </div>
}
export function GrowthJournal({childId,familyId,parent,legacy=[]}:{childId:string;familyId?:string;parent:boolean;legacy?:GrowthMeasurement[]}){
 const effectiveId=childId||'local-ilya';
 const [record,setRecord]=useState<{key:string;items:GrowthRow[]}>(()=>({key:effectiveId,items:readCache(effectiveId)}));
 const rows=record.key===effectiveId?record.items:readCache(effectiveId);
 const [loading,setLoading]=useState(false);
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const [date,setDate]=useState(dateMadrid);
 const [height,setHeight]=useState('');
 const [weight,setWeight]=useState('');
 const [editId,setEditId]=useState<string|null>(null);
 const [reminder,setReminder]=useState(()=>{try{return localStorage.getItem(reminderKey(effectiveId))!=='off'}catch{return true}});
 const [legacyImported,setLegacyImported]=useState(()=>{try{return localStorage.getItem(legacyDoneKey(effectiveId))==='yes'}catch{return false}});
 const connected=!!familyId&&!!childId&&!!supabase;
 function setItems(rows:GrowthRow[]){
  const clean=safeRows(rows);
  try{localStorage.setItem(cacheKey(effectiveId),JSON.stringify(clean))}catch{}
  setRecord({key:effectiveId,items:clean});
 }
 const refresh=useCallback(async()=>{
  if(!connected||!supabase)return;
  setLoading(true);
  try{
   const {data,error}=await supabase.from(TABLE).select('id,client_ref,measured_on,height_cm,weight_kg')
      .eq('family_id',familyId!).eq('child_id',childId).order('measured_on',{ascending:true}).limit(120);
   if(error)throw error;
   const local=readCache(effectiveId);
   const remote=(data||[]).map(toRow);
   const pending=local.filter(x=>x.pending&&!remote.some(y=>y.ref===x.ref));
   const merged=merge(remote,pending);
   localStorage.setItem(cacheKey(effectiveId),JSON.stringify(merged));
   setRecord({key:effectiveId,items:merged});
   setStatus('☁️ Измерения синхронизированы с семьёй');
   for(const unsent of pending){
    const result=await supabase.from(TABLE).insert({
      family_id:familyId,child_id:childId,client_ref:unsent.ref,measured_on:unsent.date,height_cm:unsent.height,weight_kg:unsent.weight
    }).select('id,client_ref,measured_on,height_cm,weight_kg').single();
    if(result.error&&result.error.code!=='23505')continue;
    let found=result.data?toRow(result.data):null;
    if(result.error?.code==='23505'){
      const fetched=await supabase.from(TABLE).select('id,client_ref,measured_on,height_cm,weight_kg')
        .eq('family_id',familyId!).eq('child_id',childId).eq('client_ref',unsent.ref).maybeSingle();
      if(!fetched.error&&fetched.data)found=toRow(fetched.data);
    }
    if(found){
     setRecord(prev=>{
      const previous=prev.key===effectiveId?prev.items:readCache(effectiveId);
      const updated=safeRows([...previous.filter(x=>x.ref!==found.ref),found]);
      try{localStorage.setItem(cacheKey(effectiveId),JSON.stringify(updated))}catch{}
      return {key:effectiveId,items:updated};
     });
    }
   }
  }catch(e){setStatus('Сервер недоступен. Показываю сохранённые на телефоне измерения. '+(e instanceof Error?e.message:''))}
  finally{setLoading(false)}
 },[effectiveId,connected,childId,familyId]);
 useEffect(()=>{void refresh()},[refresh]);
 useEffect(()=>{
  const action=()=>{if(!document.hidden)void refresh()};
  window.addEventListener('online',action);
  document.addEventListener('visibilitychange',action);
  return()=>{window.removeEventListener('online',action);document.removeEventListener('visibilitychange',action)};
 },[refresh]);
 const newest=sorted(rows).at(-1);
 const oldMeasurements=legacy.filter(x=>Number.isFinite(x.height)&&Number.isFinite(x.weight)&&/^\d{4}-\d{2}-\d{2}$/.test(x.date));
 const showLegacy=parent&&oldMeasurements.length>0&&!legacyImported;
 const due=reminder&&(!newest||dayGap(newest.date)>=28);
 const reset=()=>{setEditId(null);setDate(dateMadrid());setHeight('');setWeight('')};
 function edit(row:GrowthRow){setEditId(row.id);setDate(row.date);setHeight(String(row.height));setWeight(String(row.weight));setStatus('Редактирование записи от '+row.date)}
 async function save(){
  const h=Number(height.replace(',','.'));const w=Number(weight.replace(',','.'));
  if(!Number.isFinite(h)||h<90||h>210||!Number.isFinite(w)||w<15||w>200){setStatus('Проверь рост (90–210 см) и вес (15–200 кг).');return}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||date>dateMadrid()||date<'2020-01-01'){setStatus('Выбери правильную дату измерения.');return}
  if(busy)return;setBusy(true);
  try{
   const data={date,height:Math.round(h*10)/10,weight:Math.round(w*10)/10};
   let didSaveOffline=false;
   const previous=rows.find(x=>x.id===editId);
   if(previous&&connected&&supabase&&!previous.pending&&!previous.legacy){
    const {data:updated,error}=await supabase.from(TABLE).update({measured_on:data.date,height_cm:data.height,weight_kg:data.weight,updated_at:new Date().toISOString()})
       .eq('id',previous.id).eq('family_id',familyId!).eq('child_id',childId).select('id,client_ref,measured_on,height_cm,weight_kg').single();
    if(error)throw error;
    setItems(rows.map(x=>x.id===previous.id?toRow(updated):x));
   }else if(previous){
    setItems(rows.map(x=>x.id===previous.id?{...x,...data}:x));
   }else{
    const candidate=localRecord(data);
    if(connected&&supabase){
     try{
      const {data:saved,error}=await supabase.from(TABLE).insert({
        family_id:familyId,child_id:childId,client_ref:candidate.ref,measured_on:data.date,height_cm:data.height,weight_kg:data.weight
       }).select('id,client_ref,measured_on,height_cm,weight_kg').single();
      if(error)throw error;
      setItems([...rows,toRow(saved)]);
     }catch{setItems([...rows,candidate]);didSaveOffline=true;setStatus('Нет связи. Запись сохранена на телефоне и отправится после подключения.')}
    }else{setItems([...rows,candidate]);setStatus('Измерение сохранено на этом телефоне. Для семейной синхронизации подключи семейный аккаунт.')}
   }
   reset();
   if(connected&&!didSaveOffline)setStatus('Сохранено. История доступна родителю и ребёнку.');
  }catch(e){setStatus('Не удалось изменить запись. '+(e instanceof Error?e.message:'Попробуй ещё раз.'))}
  finally{setBusy(false)}
 }
 async function remove(row:GrowthRow){
  if(busy||!window.confirm('Удалить измерение за '+row.date+'?'))return;
  setBusy(true);
  try{
   if(connected&&supabase&&!row.pending){
    const {error}=await supabase.from(TABLE).delete().eq('id',row.id).eq('family_id',familyId!).eq('child_id',childId);
    if(error)throw error;
   }
   setItems(rows.filter(x=>x.id!==row.id));setStatus('Измерение удалено.');
   if(editId===row.id)reset();
  }catch(e){setStatus('Удаление не удалось. '+(e instanceof Error?e.message:''))}
  finally{setBusy(false)}
 }
 async function importLegacy(){
  if(!parent||!showLegacy||!connected||!supabase)return;
  setBusy(true);setStatus('Сохраняю прежние измерения в семейный аккаунт…');
  try{
   let count=0;
   for(const m of oldMeasurements){
    const ref='legacy-'+m.id;
    const {error}=await supabase.from(TABLE).insert({
     family_id:familyId,child_id:childId,client_ref:ref,measured_on:m.date,height_cm:m.height,weight_kg:m.weight
    });
    if(error&&error.code!=='23505')throw error;
    count++;
   }
   localStorage.setItem(legacyDoneKey(effectiveId),'yes');setLegacyImported(true);
   await refresh();
   setStatus('Перенесено прежних измерений: '+count+'. Они доступны в обоих аккаунтах.');
  }catch(e){setStatus('Не удалось перенести измерения: '+(e instanceof Error?e.message:''))}
  finally{setBusy(false)}
 }
 return <section className="h-growth" aria-label="Мой дневник роста">
  <div className="h-growth-intro">
   <div><small>🌱 МОЁ РАЗВИТИЕ</small><h2>Я расту!</h2><p>Смотри, как ты меняешься со временем. Каждый растёт в своём темпе.</p></div>
   <span aria-hidden="true">📏</span>
  </div>
  <div className="h-growth-stats">
   <div><span>📐 Мой рост</span><strong>{newest?newest.height.toLocaleString('ru-RU'):'—'} <small>см</small></strong></div>
   <div><span>⚖️ Мой вес</span><strong>{newest?newest.weight.toLocaleString('ru-RU'):'—'} <small>кг</small></strong></div>
  </div>
  {due&&<div className="h-growth-reminder" role="status">🗓️ {newest?'Прошёл почти месяц с последнего измерения.':'Пока нет измерений.'} Если хочется, можно спокойно записать рост и вес. <button type="button" onClick={()=>document.getElementById('growth-measure-form')?.scrollIntoView({behavior:'smooth',block:'center'})}>Записать</button></div>}
  <div className="h-card" id="growth-measure-form">
   <div className="h-card-heading"><span className="h-card-icon">✏️</span><h2>{editId?'Исправить измерение':'Добавить измерение'}</h2></div>
   <div className="h-growth-form">
    <label>Дата<input type="date" min="2020-01-01" max={dateMadrid()} value={date} onChange={e=>setDate(e.target.value)}/></label>
    <label>Рост, см<input inputMode="decimal" type="number" min="90" max="210" step=".1" value={height} onChange={e=>setHeight(e.target.value)} placeholder="Рост"/></label>
    <label>Вес, кг<input inputMode="decimal" type="number" min="15" max="200" step=".1" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Вес"/></label>
   </div>
   <div className="h-action-row"><button type="button" disabled={busy||!date||!height||!weight} onClick={()=>void save()}>{busy?'Сохраняю…':editId?'✓ Сохранить исправление':'+ Сохранить измерение'}</button>{editId&&<button className="h-secondary" type="button" onClick={reset}>Отмена</button>}</div>
   <p className="h-growth-privacy">🔒 Измерения не влияют на баллы и награды. Ребёнку не ставятся цели по весу. Семейная синхронизация доступна после входа в аккаунт.</p>
  </div>
  <div className="h-card">
   <div className="h-card-heading"><span className="h-card-icon">📈</span><h2>Как я расту</h2></div>
   <GrowthGraph items={rows} metric="height"/>
   <GrowthGraph items={rows} metric="weight"/>
  </div>
  <div className="h-card">
   <div className="h-card-heading"><span className="h-card-icon">📖</span><h2>История измерений</h2></div>
   {loading&&<p>Загружаю семейную историю…</p>}
   {!rows.length&&<p>Пока нет записей. Первое измерение появится здесь.</p>}
   {[...rows].reverse().map(x=><div className="h-growth-history" key={x.ref}>
     <div><strong>{x.date.split('-').reverse().join('.')}</strong><span>{x.height.toLocaleString('ru-RU')} см · {x.weight.toLocaleString('ru-RU')} кг</span>{x.pending&&<small>⏳ Ожидает синхронизации</small>}</div>
     <button aria-label={'Исправить измерение '+x.date} onClick={()=>edit(x)}>✏️</button>
     <button aria-label={'Удалить измерение '+x.date} onClick={()=>void remove(x)}>✕</button>
    </div>)}
   <label className="h-growth-toggle"><input type="checkbox" checked={reminder} onChange={e=>{setReminder(e.target.checked);localStorage.setItem(reminderKey(effectiveId),e.target.checked?'on':'off')}}/> Ненавязчивое напоминание в приложении примерно раз в месяц</label>
  </div>
  {showLegacy&&<div className="h-card"><h2>Прежние измерения</h2><p>На этом устройстве найдены {oldMeasurements.length} старых записей из родительского журнала. Они пока хранятся локально.</p>
   <button className="h-subtle-button" type="button" disabled={!connected||busy} onClick={()=>void importLegacy()}>☁️ Перенести в семейный дневник</button>
   {!connected&&<small>Для переноса нужен вход в семейный аккаунт.</small>}
  </div>}
  {status&&<div className="h-notice" role="status">{status}</div>}
  <p className="h-growth-guidance">🌿 Рост и масса тела у детей оцениваются с учётом возраста и развития. Записи полезны для обсуждения с педиатром, но приложение не ставит диагноз, не оценивает фигуру и не предлагает диет.</p>
 </section>;
}
