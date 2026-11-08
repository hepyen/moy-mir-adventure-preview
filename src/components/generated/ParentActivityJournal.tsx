import {useCallback,useEffect,useState} from 'react';
import type {useFamilyCloud} from '../../lib/useFamilyCloud';
import {supabase} from '../../lib/supabase';
import './ParentActivityJournal.css';
type Cloud=ReturnType<typeof useFamilyCloud>;
type Entry={date:string;category:string;title:string;status:string;amount:number|null};
const states:Record<string,string>={approved:'Подтверждено',pending:'Ожидает решения',rejected:'Отклонено',submitted:'Отправлено',finished:'Завершено',active:'В процессе','выполнено':'Выполнено','выдано':'Выдано'};
export function ParentActivityJournal({cloud}:{cloud:Cloud}){
 const[open,setOpen]=useState(false),[entries,setEntries]=useState<Entry[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const refresh=useCallback(async()=>{
  if(!supabase||cloud.role!=='parent'||!cloud.familyId||!cloud.childId)return;
  setLoading(true);setError('');
  const{data,error}=await supabase.rpc('moymir_parent_activity_feed',{p_family:cloud.familyId,p_child:cloud.childId,p_limit:50});
  if(error)setError(error.message);else setEntries(Array.isArray(data)?data as Entry[]:[]);
  setLoading(false);
 },[cloud.familyId,cloud.childId,cloud.role]);
 useEffect(()=>{if(open)void refresh()},[open,refresh]);
 if(cloud.role!=='parent')return null;
 return <details className="mw-panel parent-journal" open={open} onToggle={e=>setOpen((e.currentTarget as HTMLDetailsElement).open)}>
  <summary>📋 Журнал семейных достижений и решений</summary>
  {open&&<><p>История без возможности незаметного удаления: кто что выполнил, какие награды выданы и сколько начислено баллов.</p><button type="button" className="parent-journal-refresh" onClick={()=>void refresh()} disabled={loading}>↻ {loading?'Обновляем…':'Обновить журнал'}</button>
   {error&&<p className="parent-journal-error" role="alert">{error}</p>}
   {entries.length===0&&!loading?<p>Записей пока нет.</p>:<div className="parent-journal-list">{entries.map((x,i)=><div className="parent-journal-item" key={i}><div><span>{x.category}</span><strong>{x.title}</strong><small>{x.date?.split('-').reverse().join('.')||'Без даты'} · {states[x.status]||x.status}</small></div>{x.amount!==null&&<b>{x.amount>0?'+':''}{x.amount}</b>}</div>)}</div>}
   <small>Здесь отображаются последние 50 записей из защищённой семейной базы. Историю нельзя изменить через этот раздел.</small>
  </>}
 </details>;
}
