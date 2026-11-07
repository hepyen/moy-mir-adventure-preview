import {useEffect,useState} from 'react'
import {Capacitor} from '@capacitor/core'
import {PushNotifications} from '@capacitor/push-notifications'
import {supabase} from '../lib/supabase'

// Render only for native Android installations containing the plugin.
export function PushRegistration({userId}:{userId:string}){
 const [status,setStatus]=useState('')
 const [busy,setBusy]=useState(false)
 const [enabled,setEnabled]=useState(false)
 useEffect(()=>{
  let alive=true
  if(!Capacitor.isNativePlatform()||!Capacitor.isPluginAvailable('PushNotifications'))return
  void PushNotifications.checkPermissions().then(result=>{
   if(alive)setEnabled(result.receive==='granted')
  }).catch(()=>{})
  return()=>{alive=false}
 },[])
 async function activate(){
  if(!supabase||busy)return
  setBusy(true);setStatus('')
  try{
   if(!Capacitor.isPluginAvailable('PushNotifications'))throw new Error('Нужна новая версия Android-приложения')
   const permission=await PushNotifications.requestPermissions()
   if(permission.receive!=='granted')throw new Error('Разрешите уведомления для «МОЕГО МИРА» в настройках Android')
   const registration=await PushNotifications.addListener('registration',async ({value})=>{
    if(!supabase)return
    const {error}=await supabase.from('device_push_tokens').upsert({token:value,user_id:userId,platform:'android',updated_at:new Date().toISOString()},{onConflict:'token'})
    if(error)setStatus('Ошибка регистрации телефона: '+error.message)
    else {setEnabled(true);setStatus('Телефон зарегистрирован. Доставка уведомлений ожидает подключения Firebase на сервере.')}
   })
   const failure=await PushNotifications.addListener('registrationError',({error})=>{
    setStatus('Не удалось зарегистрировать телефон в Firebase: '+String(error))
   })
   await PushNotifications.register()
   // Listeners persist while this settings section is mounted; remove on unmount.
   void registration;void failure
  }catch(e){setStatus(e instanceof Error?e.message:'Ошибка регистрации push-уведомлений')}
  finally{setBusy(false)}
 }
 if(!Capacitor.isNativePlatform()||!Capacitor.isPluginAvailable('PushNotifications'))return null
 return <section className="push-registration"><h3>🔔 Уведомления Android</h3>
  <p>Настройка системных уведомлений о сообщениях, заданиях и обновлениях.</p>
  <button type="button" className="action" disabled={busy} onClick={()=>void activate()}>{enabled?'Обновить регистрацию телефона':'Разрешить уведомления'}</button>
  {status&&<p role="status">{status}</p>}
 </section>
}
