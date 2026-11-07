import {useEffect,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {PushNotifications} from '@capacitor/push-notifications';
import type {PluginListenerHandle} from '@capacitor/core';
import {supabase} from '../lib/supabase';
import {playSound} from './sounds';
import './system.css';
export function PushCenter({userId}:{userId:string}){
 const [status,setStatus]=useState('');
 const [enabled,setEnabled]=useState(false);
 const [busy,setBusy]=useState(false);
 const [lastEvent,setLastEvent]=useState('');
 const native=Capacitor.isNativePlatform()&&Capacitor.isPluginAvailable('PushNotifications');
 useEffect(()=>{
  if(!native)return;
  let active=true;const listeners:PluginListenerHandle[]=[];
  void PushNotifications.checkPermissions().then(p=>{if(active)setEnabled(p.receive==='granted');if(p.receive==='granted')void PushNotifications.register()}).catch(()=>{});
  void PushNotifications.addListener('registration',async t=>{
   if(!supabase||!active)return;
   const {error}=await supabase.from('device_push_tokens').upsert({token:t.value,user_id:userId,platform:'android',updated_at:new Date().toISOString()},{onConflict:'token'});
   if(error)setStatus('Ошибка сохранения токена: '+error.message);
   else{setEnabled(true);setStatus('Телефон подключён к системным уведомлениям ✓')}
  }).then(l=>listeners.push(l)).catch(()=>{});
  void PushNotifications.addListener('registrationError',e=>{if(active)setStatus('Ошибка Firebase: '+JSON.stringify(e.error))}).then(l=>listeners.push(l)).catch(()=>{});
  void PushNotifications.addListener('pushNotificationReceived',n=>{
   if(!active)return;playSound('notification');setLastEvent(String(n.title||'Новое уведомление'));
  }).then(l=>listeners.push(l)).catch(()=>{});
  void PushNotifications.addListener('pushNotificationActionPerformed',n=>{
    if(!active)return;
    const data=n.notification.data||{};
    window.dispatchEvent(new CustomEvent('moymir-notification-open',{detail:data}));
    playSound('notification');
  }).then(l=>listeners.push(l)).catch(()=>{});
  return()=>{active=false;listeners.forEach(l=>void l.remove())};
 },[native,userId]);
 async function enable(){
  if(!native||busy)return;
  setBusy(true);setStatus('');
  try{
   const perm=await PushNotifications.requestPermissions();
   if(perm.receive!=='granted')throw Error('Разреши уведомления для «Моего Мира» в настройках Android.');
   await PushNotifications.register();setEnabled(true);setStatus('Запрашиваем токен Firebase…');
  }catch(e){setStatus(e instanceof Error?e.message:'Не получилось включить уведомления')}
  finally{setBusy(false)}
 }
 return <section className="mw-push-center">
  <div><strong>🔔 Уведомления Android</strong><p>{native?'Родительские решения, задания, сообщения семьи и достижения.':'Системные push доступны в установленном Android-приложении.'}</p></div>
  {native&&<button type="button" disabled={busy} onClick={()=>void enable()}>{busy?'Подключение…':enabled?'↻ Обновить регистрацию':'Включить уведомления'}</button>}
  {status&&<small role="status">{status}</small>}{lastEvent&&<small>Последнее: {lastEvent}</small>}
 </section>;
}
