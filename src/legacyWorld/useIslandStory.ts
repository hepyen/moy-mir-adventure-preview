import {useCallback,useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
import {dateInMadrid} from '../daily/library';
function monday(iso:string){const d=new Date(iso+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));return d.toISOString().slice(0,10)}
export function useIslandStory(familyId:string,childId:string,enabled:boolean){
 const[chapters,setChapters]=useState<number[]>([]),[total,setTotal]=useState(0),[error,setError]=useState('');
 const date=dateInMadrid(),week=monday(date);
 const refresh=useCallback(async()=>{
  if(!supabase||!enabled||!familyId||!childId){setChapters([]);setTotal(0);return}
  const [list,count]=await Promise.all([
   supabase.from('moymir_story_chapters').select('chapter').eq('family_id',familyId).eq('child_id',childId).eq('week_start',week).order('chapter'),
   supabase.from('moymir_story_chapters').select('id',{count:'exact',head:true}).eq('family_id',familyId).eq('child_id',childId)
  ]);
  if(list.error||count.error){setError(list.error?.message||count.error?.message||'Ошибка загрузки истории');return}
  setChapters((list.data||[]).map(x=>Number(x.chapter)));setTotal(Number(count.count||0));setError('')
 },[familyId,childId,enabled,week]);
 useEffect(()=>{void refresh();const onFocus=()=>{if(document.visibilityState==='visible')void refresh()};document.addEventListener('visibilitychange',onFocus);return()=>document.removeEventListener('visibilitychange',onFocus)},[refresh]);
 return {chapters,total,error,week,refresh};
}
