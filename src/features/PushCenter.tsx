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
 const [testing,setTesting]=useState(false);
 // The installed Android package is com.moymir.adventure, but the only available
 // google-services.json belongs to com.moymir.family. Calling register() with no
 // default FirebaseApp throws on Capacitor's native thread and kills the entire app.
 // Enable ONLY after Firebase config for the actual package is installed and verified.
 const firebaseConfigured=false;
 const native=Capacitor.isNativePlatform()&&Capacitor.isPluginAvailable('PushNotifications')&&firebaseConfigured;
 const pushNeedsConfiguration=Capacitor.isNativePlatform()&&!firebaseConfigured;
 useEffect(()=>{
  if(!native)return;
  let active=true;
  const subscriptions:Promise<PluginListenerHandle>[]=[];
  subscriptions.push(PushNotifications.addListener('registration',async t=>{
   if(!supabase||!active)return;
   const {error}=await supabase.from('device_push_tokens').upsert({token:t.value,user_id:userId,platform:'android',updated_at:new Date().toISOString()},{onConflict:'token'});
   if(!active)return;
   if(error)setStatus('Ошибка сохранения токена: '+error.message);
   else{
    try{localStorage.setItem('moymir2-owned-push-token',JSON.stringify({token:t.value,userId}))}catch{}
    setEnabled(true);setStatus('Телефон зарегистрирован в Firebase ✓');
   }
  }));
  subscriptions.push(PushNotifications.addListener('registrationError',e=>{if(active)setStatus('Ошибка Firebase: '+JSON.stringify(e.error))}));
  subscriptions.push(PushNotifications.addListener('pushNotificationReceived',n=>{
   if(!active)return;playSound('notification');setLastEvent(String(n.title||'Новое уведомление'));
  }));
  subscriptions.push(PushNotifications.addListener('pushNotificationActionPerformed',n=>{
   if(!active)return;
   const data=n.notification.data||{};
   window.dispatchEvent(new CustomEvent('moymir-notification-open',{detail:data}));
   playSound('notification');
  }));
  // Register only once all listeners are mounted: fast FCM callbacks must never be lost.
  void Promise.all(subscriptions).then(async()=>{
    if(!active)return;
    const permission=await PushNotifications.checkPermissions();
    if(!active)return;
    setEnabled(permission.receive==='granted');
    if(permission.receive==='granted')await PushNotifications.register();
  }).catch(e=>{if(active)setStatus('Ошибка регистрации уведомлений: '+String(e))});
  return()=>{
    active=false;
    void Promise.allSettled(subscriptions).then(items=>items.forEach(item=>{if(item.status==='fulfilled')void item.value.remove()}));
  };
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
 async function testPush(){
  if(!supabase||testing)return;
  setTesting(true);setStatus('Отправляем проверочное уведомление…');
  const {data,error}=await supabase.rpc('test_own_push');
  if(error)setStatus('Ошибка теста: '+error.message);
  else if(data===false)setStatus('Тест уже отправлен. Повторите через минуту.');
  else setStatus('Тест отправлен. Проверь системную панель уведомлений Android.');
  setTesting(false);
 }
 return <section className="mw-push-center">
  <div><strong>🔔 Уведомления Android</strong><p>{native?'Родительские решения, задания, сообщения семьи и достижения.':pushNeedsConfiguration?'Push-уведомления временно отключены: требуется регистрация Android-приложения в Firebase. Миро, местные напоминания и остальные разделы продолжают работать.':'Системные push доступны в установленном Android-приложении.'}</p></div>
  {native&&<button type="button" disabled={busy} onClick={()=>void enable()}>{busy?'Подключение…':enabled?'↻ Обновить регистрацию':'Включить уведомления'}</button>}
  {native&&enabled&&<button type="button" disabled={testing} onClick={()=>void testPush()}>{testing?'Отправка…':'Отправить тестовое уведомление'}</button>}
  {status&&<small role="status">{status}</small>}{lastEvent&&<small>Последнее: {lastEvent}</small>}
 </section>;
}
