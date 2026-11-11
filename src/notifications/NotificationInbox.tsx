import {useCallback,useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
import './NotificationInbox.css'
import {notificationDestination} from './destinations'
import type {Destination} from './destinations'
type FamilyNotification={
 id:string;kind:string;source_id:string|null;title:string;body:string;created_at:string;read_at:string|null
}
export function NotificationInbox({userId,familyId,onOpen}:{userId:string;familyId:string;onOpen:(destination:Destination)=>void}){
 const [rows,setRows]=useState<FamilyNotification[]>([])
 const [open,setOpen]=useState(false)
 const [error,setError]=useState('')
 const [loading,setLoading]=useState(false)
 const refresh=useCallback(async()=>{
  if(!supabase)return
  const {data,error}=await supabase.from('family_notifications')
   .select('id,kind,source_id,title,body,created_at,read_at')
   .eq('family_id',familyId).eq('recipient_id',userId)
   .order('created_at',{ascending:false}).limit(50)
  if(error){setError('Не удалось обновить уведомления');return}
  setError('');setRows((data??[]) as FamilyNotification[])
 },[familyId,userId])
 useEffect(()=>{
  if(!supabase)return
  const client=supabase
  const initial=window.setTimeout(()=>void refresh(),0)
  const interval=window.setInterval(()=>void refresh(),20000)
  const onFocus=()=>void refresh()
  window.addEventListener('focus',onFocus)
  const channel=client.channel('notifications-'+userId).on(
   'postgres_changes',{event:'INSERT',schema:'public',table:'family_notifications',filter:'recipient_id=eq.'+userId},
   ()=>void refresh()).subscribe()
  return()=>{window.clearTimeout(initial);window.clearInterval(interval);window.removeEventListener('focus',onFocus);void client.removeChannel(channel)}
 },[refresh,userId])
 const unread=rows.filter(r=>!r.read_at).length
 async function deleteRead(id:string){
  if(!supabase)return
  setLoading(true)
  try{
   const {data,error}=await supabase.rpc('delete_read_family_notification',{p_id:id})
   if(error)throw error
   if(!data)throw new Error('Уведомление не найдено либо ещё не прочитано')
   await refresh()
  }catch{setError('Не удалось удалить уведомление')}
  finally{setLoading(false)}
 }
 async function clearRead(){
  if(!supabase)return
  setLoading(true)
  try{
   const {error}=await supabase.rpc('clear_read_family_notifications',{p_family:familyId})
   if(error)throw error
   await refresh()
  }catch{setError('Не удалось очистить прочитанные уведомления')}
  finally{setLoading(false)}
 }
 async function markRead(id:string){
  if(!supabase)return
  setLoading(true)
  try{
   const {error}=await supabase.rpc('read_family_notification',{p_id:id})
   if(error)throw error
   await refresh()
  }catch{setError('Не удалось отметить уведомление прочитанным')}
  finally{setLoading(false)}
 }
 return <section className="notification-inbox" aria-label="Центр уведомлений">
  <button className="notification-toggle" type="button" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
   🔔 Уведомления {unread>0&&<strong className="notification-count">{unread>99?'99+':unread}</strong>}
  </button>
  {open&&<div className="notification-panel">
   <div className="notification-panel-title"><strong>События семьи</strong><div className="notification-actions">{rows.some(n=>n.read_at)&&<button className="reject" disabled={loading} type="button" onClick={()=>void clearRead()}>Удалить прочитанные</button>}<button className="reject" type="button" onClick={()=>setOpen(false)}>Закрыть</button></div></div>
   <p className="muted">Нажмите на уведомление, чтобы открыть связанное событие.</p>
   {error&&<p role="alert">{error}</p>}
   {rows.length===0&&<p className="muted">Новых событий пока нет.</p>}
   {rows.map(n=>{
    const destination=notificationDestination({kind:n.kind,source_id:n.source_id??undefined})
    const date=new Date(n.created_at).toLocaleString('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})
    return <article key={n.id} className={'notification-item '+(!n.read_at?'notification-unread':'')}>
     <div>{destination?<button type="button" className="notification-open" onClick={()=>{
      setOpen(false);onOpen(destination);if(!n.read_at)void markRead(n.id)
     }}><strong>{n.title}</strong><span>{n.body}</span><small>{date}</small></button>:<><strong>{n.title}</strong><p>{n.body}</p><small>{date}</small></>}</div>
     <div className="notification-actions">{!n.read_at?<button className="action" disabled={loading} onClick={()=>void markRead(n.id)}>Прочитано</button>:<button className="reject" disabled={loading} onClick={()=>void deleteRead(n.id)}>Удалить</button>}</div>
    </article>
   })}
  </div>}
 </section>
}
