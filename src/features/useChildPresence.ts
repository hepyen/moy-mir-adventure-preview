import {useEffect} from 'react';
import {supabase} from '../lib/supabase';
export function useChildPresence(enabled:boolean,userId:string){
 useEffect(()=>{
  if(!enabled||!userId||!supabase)return;
  let disposed=false;const storageKey='moymir28-child-presence-'+userId;
  async function report(){
   if(disposed||document.visibilityState!=='visible')return;
   let last=0;try{last=Number(sessionStorage.getItem(storageKey)||0)}catch{}
   if(Date.now()-last<15*60000)return;
   try{const {error}=await supabase!.rpc('report_child_app_open');if(error){console.warn('Child app presence notification:',error.message);return}if(!disposed)sessionStorage.setItem(storageKey,String(Date.now()))}catch(e){console.warn('Child presence failed',e)}
  }
  void report();const focus=()=>void report();window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);
  return()=>{disposed=true;window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus)};
 },[enabled,userId]);
}
