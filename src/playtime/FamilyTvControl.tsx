import {useState} from 'react'
import {Capacitor} from '@capacitor/core'
import {tv} from './tvTimer'
import {Browser} from '@capacitor/browser'
export function FamilyTvControl({family}:{family:string}){
 const key='moymir-family-tv:'+family
 const [ip,setIp]=useState(()=>localStorage.getItem(key)||''),[busy,setBusy]=useState(false),[status,setStatus]=useState('')
 const available=Capacitor.isNativePlatform()&&Capacitor.isPluginAvailable('FamilyTv')
 async function command(action:'pair'|'off'|'source'){if(busy||!available)return;setBusy(true);setStatus('Ожидаем ответ телевизора…');try{const r=await tv.execute({ip:ip.trim(),command:action});if(!r.accepted)throw Error('Нет подтверждения');localStorage.setItem(key,ip.trim());setStatus(action==='pair'?'Телевизор разрешил подключение.': 'Команда принята телевизором. Проверь результат на экране.')}catch(e){setStatus(e instanceof Error?e.message:'Телевизор не подтвердил команду.')}finally{setBusy(false)}}
 return <details className="family-tv-control"><summary>📺 Семейный телевизор · Samsung F</summary><p>Тестовый локальный пульт для старых Samsung. Телевизор должен быть включён и подключён к той же домашней сети. Для автоматического выключения требуется ТВ-таймер и разрешение точных будильников.</p>{available?<><label>IP-адрес телевизора<input value={ip} onChange={e=>setIp(e.target.value)} placeholder="192.168.1.…" inputMode="decimal" disabled={busy}/></label><button disabled={busy||!ip.trim()} onClick={()=>void command('pair')}>Проверить подключение</button><button disabled={busy||!ip.trim()} onClick={()=>void command('source')}>Источники HDMI</button><button disabled={busy||!ip.trim()} onClick={()=>void command('off')}>Выключить телевизор</button></>:<><p>Для пульта нужен новый системный модуль Android. Веб-обновление его не устанавливает.</p><button onClick={()=>void Browser.open({url:'https://hepyen.github.io/moy-mir-adventure-preview/downloads/'})}>Страница Android-версии</button></>}{status&&<p role="status">{status}</p>}<small>Адрес сохраняется только на этом телефоне. Сопряжение подтверждается на телевизоре. После сопряжения можно запускать ТВ-таймер из запроса игрового времени.</small></details>
}
