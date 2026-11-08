import {useCallback,useEffect,useState} from 'react';
import {Capacitor} from '@capacitor/core';
import {CapacitorUpdater} from '@capgo/capacitor-updater';
import {Browser} from '@capacitor/browser';
import {LocalNotifications} from '@capacitor/local-notifications';
import {playSound} from './sounds';
import './system.css';
const APP_VERSION='3.1.0';
const BASE_VERSION='2.7.0';
const MANIFEST='https://hepyen.github.io/moy-mir-adventure-preview/updates/latest.json';
type Manifest={version:string;title:string;notes:string[];url:string;sha256:string;nativeBaseVersion:string;required?:boolean;apkUrl?:string};
function newer(a:string,b:string){const x=a.split('.').map(Number),y=b.split('.').map(Number);return x.some((n,i)=>n>y[i]&&x.slice(0,i).every((v,j)=>v===y[j]))}
async function notifyUpdate(manifest:Manifest){
 if(!Capacitor.isNativePlatform()||!Capacitor.isPluginAvailable('LocalNotifications'))return;
 const cacheKey='moymir27-local-update-alert-'+manifest.version;
 if(localStorage.getItem(cacheKey))return;
 try{
  const status=await LocalNotifications.checkPermissions();
  if(status.display!=='granted')return;
  await LocalNotifications.createChannel({id:'moymir_updates',name:'Обновления Моего Мира',importance:4,sound:'default',visibility:1});
  const parts=manifest.version.split('.').map(Number);
  const id=271000+parts[0]*1000+parts[1]*10+parts[2];
  await LocalNotifications.schedule({notifications:[{id,title:'🚀 Мой Мир — новая версия '+manifest.version,
   body:'Нажми, чтобы открыть приложение и установить обновление.',channelId:'moymir_updates',
   schedule:{at:new Date(Date.now()+800)},extra:{section:'updates'}}]});
  localStorage.setItem(cacheKey,'yes');
 }catch(e){console.warn('Update notification unavailable',e)}
}
function valid(a:unknown):a is Manifest{
 if(!a||typeof a!=='object')return false;
 const v=a as Record<string,unknown>;
 return typeof v.version==='string'&&/^\d+\.\d+\.\d+$/.test(v.version)&&typeof v.title==='string'&&typeof v.url==='string'&&typeof v.sha256==='string'&&/^[a-f\d]{64}$/.test(v.sha256)&&Array.isArray(v.notes)&&v.nativeBaseVersion===BASE_VERSION&&v.url.startsWith('https://github.com/hepyen/moy-mir-adventure-preview/releases/download/');
}
export function UpdateCenter(){
 const [available,setAvailable]=useState<Manifest|null>(null);
 const [status,setStatus]=useState('');
 const [installing,setInstalling]=useState(false);
 const [percent,setPercent]=useState<number|null>(null);
 const [checked,setChecked]=useState(false);
 const isNative=Capacitor.isNativePlatform();
 const check=useCallback(async(manual=false)=>{
  try{
   const r=await fetch(MANIFEST+'?t='+Date.now(),{cache:'no-store',signal:AbortSignal.timeout(10000)});
   if(!r.ok)throw Error('Сервер обновлений пока не отвечает');
   const payload=await r.json();
   if(!valid(payload))throw Error('Некорректный файл обновлений');
   if(newer(payload.version,APP_VERSION)){setAvailable(payload);setStatus('');void notifyUpdate(payload);if(!localStorage.getItem('moymir-update-seen-'+payload.version)){playSound('notification');localStorage.setItem('moymir-update-seen-'+payload.version,'true')}}
   else{setAvailable(null);if(manual)setStatus('Установлена актуальная версия ✓')}
  }catch(e){if(manual)setStatus(e instanceof Error?e.message:'Не удалось проверить обновление')}
  finally{setChecked(true)}
 },[]);
 useEffect(()=>{if(!isNative)return;void CapacitorUpdater.notifyAppReady().catch(e=>console.warn('OTA initialization',e))},[isNative]);
 useEffect(()=>{
  const start=window.setTimeout(()=>void check(),3500);
  const timer=window.setInterval(()=>void check(),5*60*1000);
  const focus=()=>{if(document.visibilityState==='visible')void check()};
  document.addEventListener('visibilitychange',focus);
  return()=>{clearTimeout(start);clearInterval(timer);document.removeEventListener('visibilitychange',focus)}
 },[check]);
 async function install(){
  if(!available||installing)return;
  if(!isNative){window.location.reload();return}
  if(!Capacitor.isPluginAvailable('CapacitorUpdater')){setStatus('Для обновлений требуется Android-версия 2.7');return}
  setInstalling(true);setPercent(0);setStatus('');
  let listener:({remove:()=>Promise<void>})|null=null;
  try{
   listener=await CapacitorUpdater.addListener('download',e=>setPercent(Math.round(e.percent||0)));
   const bundle=await CapacitorUpdater.download({url:available.url,version:available.version,checksum:available.sha256});
   await CapacitorUpdater.set({id:bundle.id});
  }catch(e){
   setStatus('Не удалось установить обновление через интернет. '+(e instanceof Error?e.message:'Попробуй снова.'));
   setInstalling(false);
  }finally{if(listener)void listener.remove()}
 }
 return <section className={'mw-update-center '+(available?'mw-update-available':'')}>
  <div><strong>{available?'🚀 '+available.title:'🔄 Обновления приложения'}</strong>
  <p>{available?available.notes.join(' · '):'Версия '+APP_VERSION+' · Обновления без переустановки APK'}</p>
  {percent!==null&&installing&&<p>Загрузка {percent}%…</p>}
  {status&&<small role="status">{status}</small>}
  </div>
  <div className="mw-update-controls">
   {available?<button disabled={installing} onClick={()=>void install()}>{installing?'Устанавливаем…':isNative?'Обновить сейчас':'Открыть новую версию'}</button>:<button onClick={()=>void check(true)}>{checked?'Проверить':'Проверка…'}</button>}
   {available?.apkUrl&&<button onClick={()=>void Browser.open({url:available.apkUrl!})}>Android APK</button>}
  </div>
 </section>;
}
