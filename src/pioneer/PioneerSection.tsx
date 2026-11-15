import {useCallback,useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import type {useFamilyCloud} from '../lib/useFamilyCloud';
import {supabase} from '../lib/supabase';
import {PioneerArena,type PioneerState,type PioneerAnswer,type PioneerHintData} from './PioneerArena';
import pioneerEmblem from './pioneer_emblem.png';
type Cloud=ReturnType<typeof useFamilyCloud>;

export function PioneerSection({cloud}:{cloud:Cloud}){
 const [open,setOpen]=useState(false);
 const [state,setState]=useState<PioneerState|null>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const reload=useCallback(async()=>{
  if(!supabase||!cloud.familyId)throw Error('Для сохранения баллов нужна связь с семейной базой');
  const {data,error:e}=await supabase.rpc('pioneer_state',{p_family:cloud.familyId});
  if(e)throw e;
  setState(data as PioneerState);
 },[cloud.familyId]);
 useEffect(()=>{
  if(!open)return;
  let alive=true;
  setLoading(true);setError('');setState(null);
  void reload().catch(e=>{if(alive)setError(e instanceof Error?e.message:'Сервер недоступен')}).finally(()=>{if(alive)setLoading(false)});
  return()=>{alive=false};
 },[open,reload]);
 async function start(level:number){
  if(!supabase||!cloud.familyId)throw Error('Нет соединения');
  const {error:e}=await supabase.rpc('pioneer_begin',{p_family:cloud.familyId,p_level:level});
  if(e)throw e;
  await reload();
 }
 async function answer(attempt:string,question:number,choice:number){
  if(!supabase||!cloud.familyId)throw Error('Нет соединения');
  const {data,error:e}=await supabase.rpc('pioneer_answer',{p_family:cloud.familyId,p_attempt:attempt,p_question:question,p_choice:choice});
  if(e)throw e;
  if(data?.finished)void cloud.refresh();
  return data as PioneerAnswer;
 }
 async function hint(attempt:string,type:'half'|'audience'|'scripture'){
  if(!supabase||!cloud.familyId)throw Error('Нет соединения');
  const {data,error:e}=await supabase.rpc('pioneer_hint',{p_family:cloud.familyId,p_attempt:attempt,p_type:type});
  if(e)throw e;
  return data as PioneerHintData;
 }
 async function advance(attempt:string){
  if(!supabase||!cloud.familyId)throw Error('Нет соединения');
  const {error:e}=await supabase.rpc('pioneer_advance',{p_family:cloud.familyId,p_attempt:attempt});
  if(e)throw e;
 }
 async function timeout(attempt:string,question:number){
  if(!supabase||!cloud.familyId)throw Error('Нет соединения');
  const {data,error:e}=await supabase.rpc('pioneer_timeout',{p_family:cloud.familyId,p_attempt:attempt,p_question:question});
  if(e)throw e;
  if(data?.pending)return null;
  if(data?.finished)void cloud.refresh();
  return data?.finished?data as PioneerAnswer:null;
 }
 async function cashout(attempt:string){
  if(!supabase||!cloud.familyId)throw Error('Нет соединения');
  const {data,error:e}=await supabase.rpc('pioneer_cashout',{p_family:cloud.familyId,p_attempt:attempt});
  if(e)throw e;
  void cloud.refresh();
  return data as {saved:number;newPoints:number};
 }
 return <><section className="pn-entry">
  <div className="pn-entry-emblem"><img src={pioneerEmblem} alt="Эмблема викторины"/></div>
  <div className="pn-entry-text"><small>НОВАЯ БИБЛЕЙСКАЯ ВИКТОРИНА</small><h3>Кто хочет стать пионером?</h3><p>Шесть ступеней · 300 вопросов · 3 подсказки · несгораемые награды</p></div>
  <button type="button" onClick={()=>setOpen(true)}>{cloud.role==='parent'?'📊 Результаты':'▶ Играть'}</button>
 </section>
 {open&&createPortal(<PioneerArena state={cloud.role==='parent'&&state?{...state,active:null}:state} role={cloud.role==='parent'?'parent':'child'}
 start={start} answer={answer} hint={hint} cashout={cashout} advance={advance} timeout={timeout} reload={reload} onClose={()=>setOpen(false)} loading={loading} error={error}/>,document.body)}
 </>;
}
