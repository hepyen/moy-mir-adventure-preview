import {useCallback,useEffect,useRef,useState} from 'react';
import {supabase} from '../lib/supabase';
export type Lesson={id:string;family_id:string;child_id:string;weekday:number;lesson_order:number;subject:string;starts_at:string|null;notes:string};
export type Homework={id:string;family_id:string;child_id:string;subject:string;description:string;due_date:string;completed_at:string|null};
export type BackpackItem={id:string;family_id:string;child_id:string;subject:string;item:string};
export type BackpackCheck={id:string;item_id:string;for_date:string;checked_at:string};
export type SchoolPrefs={school_enabled:boolean;school_remind_at:string;homework_enabled:boolean;homework_remind_at:string;verse_enabled:boolean;verse_remind_at:string};
export const initialPrefs:SchoolPrefs={school_enabled:false,school_remind_at:'07:30',homework_enabled:false,homework_remind_at:'18:30',verse_enabled:false,verse_remind_at:'08:00'};
const formatTime=(v:string|null|undefined)=>v?.slice(0,5)||'';
export function useSchool(familyId:string,childId:string,enabled:boolean){
 const[lessons,setLessons]=useState<Lesson[]>([]),[homework,setHomework]=useState<Homework[]>([]),[prefs,setPrefs]=useState<SchoolPrefs>(initialPrefs);
 const[backpackItems,setBackpackItems]=useState<BackpackItem[]>([]),[backpackChecks,setBackpackChecks]=useState<BackpackCheck[]>([]);
 const[loading,setLoading]=useState(false),[error,setError]=useState('');
 const seq=useRef(0);
 const refresh=useCallback(async()=>{
  if(!enabled||!supabase||!familyId||!childId){seq.current++;setLessons([]);setHomework([]);setBackpackItems([]);setBackpackChecks([]);setPrefs(initialPrefs);setError('');return}
  const id=++seq.current;setLoading(true);
  try{
   const [l,h,p,bag,checks]=await Promise.all([
    supabase.from('moymir_school_lessons').select('id,family_id,child_id,weekday,lesson_order,subject,starts_at,notes').eq('family_id',familyId).eq('child_id',childId).order('weekday').order('lesson_order'),
    supabase.from('moymir_school_homework').select('id,family_id,child_id,subject,description,due_date,completed_at').eq('family_id',familyId).eq('child_id',childId).order('due_date',{ascending:true}),
    supabase.from('moymir_school_preferences').select('school_enabled,school_remind_at,homework_enabled,homework_remind_at,verse_enabled,verse_remind_at').eq('family_id',familyId).eq('child_id',childId).maybeSingle(),
    supabase.from('moymir_backpack_items').select('id,family_id,child_id,subject,item').eq('family_id',familyId).eq('child_id',childId).order('subject'),
    supabase.from('moymir_backpack_checks').select('id,item_id,for_date,checked_at').eq('family_id',familyId).eq('child_id',childId).gte('for_date',new Date(Date.now()-86400000).toISOString().slice(0,10)).order('for_date',{ascending:false}).limit(100)
   ]);
   for(const response of [l,h,p,bag,checks])if(response.error)throw response.error;
   if(id!==seq.current)return;
   setLessons((l.data||[]).map(x=>({...x,starts_at:formatTime(x.starts_at)})));
   setHomework(h.data||[]);
   setBackpackItems(bag.data||[]);setBackpackChecks(checks.data||[]);
   const nextPrefs=p.data?{school_enabled:p.data.school_enabled,school_remind_at:formatTime(p.data.school_remind_at),homework_enabled:p.data.homework_enabled,homework_remind_at:formatTime(p.data.homework_remind_at),verse_enabled:p.data.verse_enabled,verse_remind_at:formatTime(p.data.verse_remind_at)}:initialPrefs;
   setPrefs(previous=>JSON.stringify(previous)===JSON.stringify(nextPrefs)?previous:nextPrefs);
   setError('');
  }catch(e){if(id===seq.current)setError(e instanceof Error?e.message:'Ошибка загрузки учебного плана')}
  finally{if(id===seq.current)setLoading(false)}
 },[enabled,familyId,childId]);
 useEffect(()=>{void refresh();if(!enabled)return;
  // Avoid continually downloading five tables when Android is backgrounded.
  const t=setInterval(()=>{if(document.visibilityState==='visible')void refresh()},90_000);
  const visible=()=>{if(document.visibilityState==='visible')void refresh()};
  document.addEventListener('visibilitychange',visible);
  return()=>{clearInterval(t);document.removeEventListener('visibilitychange',visible);seq.current++}
 },[refresh,enabled]);
 async function writeLesson(data:Pick<Lesson,'weekday'|'lesson_order'|'subject'|'starts_at'|'notes'>){
  if(!supabase)throw Error('Нет подключения к базе');
  const {error}=await supabase.from('moymir_school_lessons').upsert({family_id:familyId,child_id:childId,...data,starts_at:data.starts_at||null},{onConflict:'family_id,child_id,weekday,lesson_order'});if(error)throw error;await refresh();
 }
 async function deleteLesson(id:string){if(!supabase)throw Error('Нет подключения к базе');const{error}=await supabase.from('moymir_school_lessons').delete().eq('id',id).eq('family_id',familyId);if(error)throw error;await refresh()}
 async function addHomework(data:Pick<Homework,'subject'|'description'|'due_date'>){if(!supabase)throw Error('Нет подключения к базе');const{error}=await supabase.from('moymir_school_homework').insert({...data,child_id:childId,family_id:familyId});if(error)throw error;await refresh()}
 async function deleteHomework(id:string){if(!supabase)throw Error('Нет подключения к базе');const{error}=await supabase.from('moymir_school_homework').delete().eq('id',id).eq('family_id',familyId);if(error)throw error;await refresh()}
 async function markHomework(id:string,done:boolean){if(!supabase)throw Error('Нет подключения к базе');const{error}=await supabase.rpc('moymir_mark_homework',{p_id:id,p_done:done});if(error)throw error;await refresh()}
 async function savePrefs(next:SchoolPrefs){if(!supabase)throw Error('Нет подключения к базе');const{error}=await supabase.from('moymir_school_preferences').upsert({family_id:familyId,child_id:childId,...next,updated_at:new Date().toISOString()},{onConflict:'family_id,child_id'});if(error)throw error;await refresh()}
 async function addBackpackItem(subject:string,item:string){
  if(!supabase)throw Error('Нет подключения к базе');
  const{error}=await supabase.from('moymir_backpack_items').upsert({family_id:familyId,child_id:childId,subject:subject.trim(),item:item.trim()},{onConflict:'family_id,child_id,subject,item'});
  if(error)throw error;await refresh();
 }
 async function deleteBackpackItem(id:string){if(!supabase)throw Error('Нет подключения к базе');const{error}=await supabase.from('moymir_backpack_items').delete().eq('id',id).eq('family_id',familyId);if(error)throw error;await refresh()}
 async function checkBackpackItem(id:string,date:string,done:boolean){if(!supabase)throw Error('Нет подключения к базе');const{error}=await supabase.rpc('moymir_check_backpack',{p_item:id,p_date:date,p_done:done});if(error)throw error;await refresh()}
 return {lessons,homework,prefs,backpackItems,backpackChecks,loading,error,refresh,writeLesson,deleteLesson,addHomework,deleteHomework,markHomework,savePrefs,addBackpackItem,deleteBackpackItem,checkBackpackItem};
}
