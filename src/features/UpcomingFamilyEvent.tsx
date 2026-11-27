import {useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'
import {dateInMadrid} from '../daily/library'
import './CalendarNotice.css'
type Event={id:string;title:string;event_date:string;event_time:string|null}
export function UpcomingFamilyEvent({family,onOpen}:{family:string;onOpen:()=>void}){
 const [state,setState]=useState<{family:string;event:Event|null}>({family,event:null})
 useEffect(()=>{let active=true,busy=false;const refresh=async()=>{if(busy||document.visibilityState==='hidden')return;busy=true;try{const {data,error}=await supabase.from('moymir_family_calendar').select('id,title,event_date,event_time').eq('family_id',family).gte('event_date',dateInMadrid()).order('event_date').order('event_time',{nullsFirst:false}).limit(1);if(active&&!error)setState({family,event:data?.[0]||null})}finally{busy=false}};void refresh();const timer=setInterval(()=>void refresh(),8000);window.addEventListener('online',refresh);document.addEventListener('visibilitychange',refresh);return()=>{active=false;clearInterval(timer);window.removeEventListener('online',refresh);document.removeEventListener('visibilitychange',refresh)}},[family])
 const e=state.family===family?state.event:null
 if(!e)return null
 return <button type="button" className="upcoming-family-event" aria-label="Ближайшее семейное событие" onClick={onOpen}><span aria-hidden="true">📅</span><span><small>БЛИЖАЙШЕЕ СЕМЕЙНОЕ СОБЫТИЕ</small><strong>{e.title}</strong><small>{e.event_date===dateInMadrid()?'Сегодня':e.event_date.split('-').reverse().join('.')} {e.event_time?.slice(0,5)||''}</small></span><b>›</b></button>
}
