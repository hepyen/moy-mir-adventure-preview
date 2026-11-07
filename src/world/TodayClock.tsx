import {useEffect,useState} from 'react'
import './TodayClock.css'

const timezone='Europe/Madrid'
function formatToday(now:Date){
 const date=new Intl.DateTimeFormat('ru-RU',{timeZone:timezone,weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now)
 const time=new Intl.DateTimeFormat('ru-RU',{timeZone:timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(now)
 return {date:date.charAt(0).toUpperCase()+date.slice(1),time}
}
export function TodayClock(){
 const [now,setNow]=useState(()=>new Date())
 useEffect(()=>{
  const update=()=>setNow(new Date())
  const interval=window.setInterval(update,1000)
  document.addEventListener('visibilitychange',update)
  window.addEventListener('focus',update)
  return()=>{window.clearInterval(interval);document.removeEventListener('visibilitychange',update);window.removeEventListener('focus',update)}
 },[])
 const {date,time}=formatToday(now)
 return <div className="today-clock" role="group" aria-label="Сегодняшняя дата и время">
  <span className="today-clock-icon" aria-hidden="true">🗓️</span>
  <div className="today-clock-date"><small>Сегодня</small><strong>{date}</strong></div>
  <div className="today-clock-time"><small>Время</small><strong>{time}</strong></div>
 </div>
}
