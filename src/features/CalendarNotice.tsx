import {useEffect,useState,useRef} from 'react'
import {supabase} from '../lib/supabase'
import {dateInMadrid} from '../daily/library'
import './CalendarNotice.css'

type EventRow={id:string;revision:number;title:string;event_date:string;event_time:string|null;note:string}
type Receipt={event_id:string;revision:number}
const keyOf=(e:Receipt)=>e.event_id+':'+e.revision
const eventKey=(e:EventRow)=>keyOf({event_id:e.id,revision:e.revision})
const storageKey=(family:string,child:string)=>'moymir-calendar-pending-v1:'+family+':'+child
function readPending(key:string):Receipt[]{
 try{const rows:unknown=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(rows)?rows.filter((x):x is Receipt=>!!x&&typeof x.event_id==='string'&&Number.isInteger(x.revision)&&x.revision>0):[]}catch{return []}
}
function savePending(key:string,rows:Receipt[]){
 try{if(rows.length)localStorage.setItem(key,JSON.stringify(rows));else localStorage.removeItem(key)}catch{/* in-memory state still allows dismissal */}
}
export function CalendarNotice({family,child}:{family:string;child:string}){
 const [events,setEvents]=useState<EventRow[]>([])
 const accepted=useRef(new Set<string>()),pending=useRef<Receipt[]>([]),wake=useRef<()=>void>(()=>{})
 useEffect(()=>{
  let alive=true,loading=false,sending=false
  const key=storageKey(family,child)
  const controller=new AbortController()
  pending.current=readPending(key)
  accepted.current=new Set(pending.current.map(keyOf))
  setEvents([])
  const signal=()=>{const c=new AbortController();const stop=()=>c.abort();if(controller.signal.aborted)stop();else{controller.signal.addEventListener('abort',stop,{once:true});setTimeout(()=>{controller.signal.removeEventListener('abort',stop);stop()},8000)}return c.signal}
  const flush=async()=>{
   if(sending||!alive||!navigator.onLine)return
   sending=true
   try{
    for(const receipt of [...pending.current]){
     if(!alive)break
     const {error}=await supabase.from('moymir_calendar_read').insert(receipt).abortSignal(signal())
     if(!alive)break
     if(!error||error.code==='23505'){
      pending.current=pending.current.filter(x=>keyOf(x)!==keyOf(receipt))
      savePending(key,pending.current)
     }
    }
   }catch{/* retry on next online/focus/poll */}
   finally{sending=false}
  }
  const load=async()=>{
   if(loading||!alive||document.visibilityState==='hidden')return
   loading=true
   try{
    const e=await supabase.from('moymir_family_calendar').select('id,revision,title,event_date,event_time,note').eq('family_id',family).gte('event_date',dateInMadrid()).order('event_date').limit(100).abortSignal(signal())
    if(e.error||!alive)return
    const rows=e.data||[]
    if(!rows.length){setEvents([]);return}
    const r=await supabase.from('moymir_calendar_read').select('event_id,revision').eq('child_id',child).in('event_id',rows.map(x=>x.id)).abortSignal(signal())
    if(r.error||!alive)return
    const seen=new Set((r.data||[]).map(keyOf))
    setEvents(rows.filter(x=>!seen.has(eventKey(x))&&!accepted.current.has(eventKey(x))))
   }catch{/* keep app accessible */}
   finally{loading=false}
  }
  const refresh=()=>{void flush();void load()}
  wake.current=refresh
  refresh()
  const timer=setInterval(refresh,8000)
  window.addEventListener('online',refresh)
  document.addEventListener('visibilitychange',refresh)
  return()=>{alive=false;controller.abort();wake.current=()=>{};clearInterval(timer);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh)}
 },[family,child])
 const event=events[0]
 function ack(){
  if(!event||accepted.current.has(eventKey(event)))return
  const receipt={event_id:event.id,revision:event.revision}
  accepted.current.add(eventKey(event))
  pending.current=[...pending.current,receipt]
  savePending(storageKey(family,child),pending.current)
  setEvents(old=>old.filter(x=>eventKey(x)!==eventKey(event)))
  wake.current()
 }
 function close(){
  // No read receipt is fabricated when the child chooses to defer.
  for(const row of events)accepted.current.add(eventKey(row))
  setEvents([])
 }
 if(!event)return null
 return <div className="calendar-notice-overlay" role="dialog" aria-modal="true" aria-label="Новое семейное событие"><article><span className="calendar-notice-icon">📅</span><small>СЕМЕЙНЫЙ КАЛЕНДАРЬ</small><h2>Родители запланировали событие</h2><h3>{event.title}</h3><p>{event.event_date.split('-').reverse().join('.')} {event.event_time?.slice(0,5)||''}</p>{event.note&&<p className="calendar-notice-note">{event.note}</p>}<p>Подтверди, что прочитал. Если нет связи, отметка отправится позже.</p>{events.length>1&&<small>Ещё событий: {events.length-1}</small>}<button type="button" onClick={ack}>✓ Я прочитал</button><button type="button" onClick={close} className="calendar-notice-later">Позже · вернуться в приложение</button></article></div>
}
