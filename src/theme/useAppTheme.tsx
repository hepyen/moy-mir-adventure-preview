import {useEffect,useState} from 'react';
import './AppTheme.css';
export type ThemeChoice='day'|'night'|'auto';
const KEY='moymir-app-theme-v1';
function getStored(childId:string):ThemeChoice{
 try{
  const stored=localStorage.getItem(KEY);
  if(stored==='day'||stored==='night'||stored==='auto')return stored;
  const old=localStorage.getItem('moymir-health-theme-v1:'+childId);
  if(old==='day'||old==='night'||old==='auto'){localStorage.setItem(KEY,old);return old}
 }catch{}
 return 'auto';
}
export function useAppTheme(childId:string){
 const [selection,setSelection]=useState<ThemeChoice>(()=>getStored(childId));
 const [systemDark,setSystemDark]=useState(()=>window.matchMedia('(prefers-color-scheme: dark)').matches);
 useEffect(()=>{
  try{
   if(localStorage.getItem(KEY))return;
   const legacy=localStorage.getItem('moymir-health-theme-v1:'+childId);
   if(legacy==='day'||legacy==='night'||legacy==='auto'){
    localStorage.setItem(KEY,legacy);setSelection(legacy);
   }
  }catch{}
 },[childId]);

 useEffect(()=>{
  const media=window.matchMedia('(prefers-color-scheme: dark)');
  const callback=()=>setSystemDark(media.matches);
  callback();media.addEventListener('change',callback);
  return()=>media.removeEventListener('change',callback);
 },[]);
 useEffect(()=>{
  if(selection!=='auto')return;
  // Auto follows the device appearance at all times, even when backgrounded.
  const callback=()=>setSystemDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.addEventListener('visibilitychange',callback);
  return()=>document.removeEventListener('visibilitychange',callback);
 },[selection]);
 const resolved=selection==='auto'?(systemDark?'night':'day'):selection;
 const setTheme=(value:ThemeChoice)=>{
  setSelection(value);
  try{localStorage.setItem(KEY,value)}catch{}
 };
 useEffect(()=>{
  document.documentElement.dataset.moymirTheme=resolved;
  document.documentElement.style.colorScheme=resolved==='night'?'dark':'light';
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',resolved==='night'?'#11243e':'#25ad8a');

  return()=>{delete document.documentElement.dataset.moymirTheme;document.documentElement.style.colorScheme=''};
 },[resolved]);
 return {selection,resolved,setTheme};
}
export function AppThemeSwitch({selection,onChange,compact=false}:{selection:ThemeChoice;onChange:(value:ThemeChoice)=>void;compact?:boolean}){
 return <div className={'mw-theme-switch '+(compact?'mw-theme-switch-compact':'')} role="group" aria-label="Тема оформления всего приложения">
  {!compact&&<strong>🎨 Оформление всего «Моего мира»</strong>}
  <div className="mw-theme-options">{([['day','☀️','День'],['night','🌙','Ночь'],['auto','✦','Авто']] as const).map(([mode,icon,label])=>
   <button key={mode} type="button" aria-label={'Тема: '+label} aria-pressed={selection===mode} className={selection===mode?'selected':''} onClick={()=>onChange(mode)}><span aria-hidden="true">{icon}</span> {label}</button>
  )}</div>
 </div>;
}
