import {Capacitor} from '@capacitor/core';
import {LocalNotifications,Weekday} from '@capacitor/local-notifications';
import type {Lesson,SchoolPrefs} from './useSchool';
const IDS=[29001,29002,29003,29004,29005,29006,29007,29011,29012];
export type ReminderStatus={available:boolean;allowed:boolean;pending:number;error?:string};
export async function getReminderStatus():Promise<ReminderStatus>{
 if(!Capacitor.isNativePlatform()||!Capacitor.isPluginAvailable('LocalNotifications'))return {available:false,allowed:false,pending:0};
 try{
  const permission=await LocalNotifications.checkPermissions();
  const scheduled=await LocalNotifications.getPending();
  return {available:true,allowed:permission.display==='granted',pending:scheduled.notifications.filter(x=>IDS.includes(x.id)).length};
 }catch(e){return {available:true,allowed:false,pending:0,error:String(e)}}
}
export async function askReminderPermission():Promise<boolean>{
 const status=await getReminderStatus();if(!status.available)return false;
 const permission=await LocalNotifications.requestPermissions();
 return permission.display==='granted';
}
export async function syncReminders(lessons:Lesson[],prefs:SchoolPrefs,userId:string):Promise<ReminderStatus>{
 const status=await getReminderStatus();if(!status.available||!status.allowed)return status;
 const notification:any[]=[];
 const clock=(time:string)=>{const[a,b]=time.split(':').map(Number);return {hour:a,minute:b}};
 for(let weekday=0;weekday<7;weekday++){
  const items=lessons.filter(x=>x.weekday===weekday).sort((a,b)=>a.lesson_order-b.lesson_order);
  if(!prefs.school_enabled||!items.length)continue;
  const body=items.map(x=>x.subject).join(' · ').slice(0,220);
  notification.push({id:29001+weekday,title:'🎒 Уроки сегодня',body,
   schedule:{on:{weekday:(weekday+1) as Weekday,...clock(prefs.school_remind_at)},allowWhileIdle:true},
   extra:{section:'school',userId}});
 }
 if(prefs.homework_enabled)notification.push({id:29011,title:'📚 Проверь домашние задания',body:'Открой «Мой Мир → Учёба» и посмотри, что нужно сделать к ближайшим урокам.',schedule:{on:clock(prefs.homework_remind_at),allowWhileIdle:true},extra:{section:'school',userId}});
 if(prefs.verse_enabled)notification.push({id:29012,title:'📖 Ежедневный текст',body:'Время прочитать стих и комментарий. Открой «Духовный рост» в «Моём Мире».',schedule:{on:clock(prefs.verse_remind_at),allowWhileIdle:true},extra:{section:'spiritual',userId}});
 try{
  await LocalNotifications.createChannel({id:'moymir_school',name:'Школа и домашние задания',importance:4,visibility:1});
  await LocalNotifications.createChannel({id:'moymir_verse',name:'Ежедневный стих',importance:3,visibility:1});
  if(status.pending){const current=await LocalNotifications.getPending();await LocalNotifications.cancel({notifications:current.notifications.filter(x=>IDS.includes(x.id)).map(x=>({id:x.id}))})}
  if(notification.length){
   await LocalNotifications.schedule({notifications:notification.map(x=>({...x,channelId:x.id===29012?'moymir_verse':'moymir_school'}))});
  }
  return {available:true,allowed:true,pending:notification.length};
 }catch(e){return {available:true,allowed:true,pending:0,error:e instanceof Error?e.message:String(e)}}
}
