import {useEffect,useMemo,useState} from 'react';
import type {useFamilyCloud} from '../lib/useFamilyCloud';
import type {useSchool} from './useSchool';
import {askReminderPermission,getReminderStatus,syncReminders} from './reminders';
type Cloud=ReturnType<typeof useFamilyCloud>;
type School=ReturnType<typeof useSchool>;
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
