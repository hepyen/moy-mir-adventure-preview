import {useEffect,useRef,useState} from 'react'
import {supabase} from '../lib/supabase'
import type {useFamilyCloud} from '../lib/useFamilyCloud'
import {Browser} from '@capacitor/browser'
import {Capacitor} from '@capacitor/core'
import './FamilySafety.css'
type Cloud=ReturnType<typeof useFamilyCloud>
type Log={id:string;app_name:string;action:string;old_rule:string|null;new_rule:string|null;created_at:string}
const rules:Record<string,string>={allowed:'Разрешено',ask:'Спросить родителей',not_allowed:'Не разрешено'}
const checklist=[
 ['play','Проверить Google Play Protect'],
 ['unknown','Проверить установку из неизвестных источников'],
 ['perms','Проверить разрешения камеры, микрофона и местоположения'],
 ['sites','Настроить разрешённые и запрещённые сайты'],
 ['recovery','Проверить доступ к электронной почте для восстановления']
]
type Battery={level:number;charging:boolean}
export function SafetyToolkit({cloud,onSettings}:{cloud:Cloud;onSettings:()=>void}){
 const parent=cloud.role==='parent'
 const [online,setOnline]=useState(navigator.onLine),[battery,setBattery]=useState<Battery|null>(null),[diagnostic,setDiagnostic]=useState('Не проверено'),[checked,setChecked]=useState(''),[busy,setBusy]=useState(false),[account,setAccount]=useState('Не проверено'),[log,setLog]=useState<Log[]>([]),[logStatus,setLogStatus]=useState('Открой журнал для загрузки'),[note,setNote]=useState(''),[selected,setSelected]=useState(''),[helpBusy,setHelpBusy]=useState(false)
 const key='moymir-safety-checklist:'+cloud.session?.user.id
 const [checks,setChecks]=useState<string[]>(()=>{try{const a=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(a)?a.filter(v=>checklist.some(c=>c[0]===v)):[]}catch{return []}})
 const inFlight=useRef(false)
 useEffect(()=>{const f=()=>setOnline(navigator.onLine);window.addEventListener('online',f);window.addEventListener('offline',f);return()=>{window.removeEventListener('online',f);window.removeEventListener('offline',f)}},[])
 async function test(){if(inFlight.current)return;inFlight.current=true;setBusy(true);setDiagnostic('Проверяем…');try{const {data,error}=await supabase.from('family_members').select('role').eq('family_id',cloud.familyId).eq('user_id',cloud.session?.user.id).maybeSingle();setDiagnostic(!error&&data?.role===cloud.role?'Семейная база отвечает, роль подтверждена':'Не удалось подтвердить связь и роль');const n=navigator as Navigator&{getBattery?:()=>Promise<Battery>};try{const b=await n.getBattery?.();setBattery(b&&Number.isFinite(b.level)?{level:b.level,charging:b.charging}:null)}catch{setBattery(null)}setChecked(new Date().toLocaleTimeString('ru-RU'))}catch{setDiagnostic('Не удалось проверить связь')}finally{inFlight.current=false;setBusy(false)}}
 async function checkAccount(){setAccount('Проверяем…');try{const [u,m]=await Promise.all([supabase.auth.getUser(),supabase.auth.mfa.getAuthenticatorAssuranceLevel()]);if(u.error||u.data.user?.id!==cloud.session?.user.id){setAccount('Сервер не подтвердил текущий аккаунт. Проверь вход.');return}setAccount('Аккаунт подтверждён. '+(m.error?'Статус двухфакторной защиты неизвестен.':m.data.currentLevel==='aal2'?'Текущая сессия подтверждена вторым фактором.':m.data.nextLevel==='aal2'?'Второй фактор зарегистрирован, текущая сессия без подтверждения.':'Текущая сессия использует обычный вход.'))}catch{setAccount('Проверка недоступна')}}
 async function readLog(){setLogStatus('Загрузка…');const {data,error}=await supabase.from('moymir_safety_rule_log').select('id,app_name,action,old_rule,new_rule,created_at').eq('family_id',cloud.familyId).order('created_at',{ascending:false}).limit(50);if(error){setLog([]);setLogStatus('Не удалось загрузить журнал');return}setLog(data as Log[]||[]);setLogStatus(data?.length?'Последние изменения правил':'Пока нет записей')}
 function toggle(id:string){const next=checks.includes(id)?checks.filter(x=>x!==id):[...checks,id];try{localStorage.setItem(key,JSON.stringify(next));setChecks(next)}catch{setNote('Не удалось сохранить отметку')}}
 function open(url:string){void Browser.open({url}).catch(()=>setNote('Не удалось открыть страницу'))}
 async function send(){if(parent||!selected||helpBusy||!cloud.session)return;setHelpBusy(true);try{const {error}=await supabase.from('family_chat_messages').insert({family_id:cloud.familyId,sender_id:cloud.session.user.id,body:selected});if(error)throw error;setNote('Сообщение сохранено в семейном чате. Прочтение не подтверждено.');setSelected('')}catch{setNote('Нет подтверждения отправки. Если срочно, позвони взрослому или 112.')}finally{setHelpBusy(false)}}
 return <section className="mw-panel family-safety safety-toolkit" aria-label="Расширенная безопасность">
 <h3>🛡️ Инструменты безопасности</h3>
 <details><summary>📶 Диагностика этого устройства</summary><p>Сеть: {online?'есть соединение по данным браузера':'нет соединения по данным браузера'}. Платформа: {Capacitor.getPlatform()}.</p><p>{diagnostic}{checked?' · '+checked:''}</p><p>Аккумулятор: {battery?Math.round(battery.level*100)+'%'+(battery.charging?' · заряжается':''):'нет данных'}. Показатели не отправляются на другие устройства.</p><button disabled={busy} onClick={()=>void test()}>Проверить связь и аккумулятор</button></details>
 {parent&&<details><summary>🔐 Защита родительского аккаунта</summary><p>{account}</p><button onClick={()=>void checkAccount()}>Проверить аккаунт и второй фактор</button><button onClick={onSettings}>Открыть настройки и восстановление доступа ребёнка</button><small>Это проверка состояния сессии, а не включение Passkeys или обязательной двухфакторной защиты.</small></details>}
 <details><summary>🌐 Безопасный интернет</summary><p>Системные фильтры настраиваются отдельно. Сайт может быть запрещён в Chrome, но доступен в другом браузере.</p><button onClick={()=>open('https://support.google.com/families/answer/7087030?hl=ru')}>Фильтры сайтов Family Link</button><button onClick={()=>open('https://github.com/AdguardTeam/AdGuardHome')}>AdGuard Home — защита домашней сети</button><small>DNS-фильтр не установлен автоматически и не читает переписку.</small></details>
 <details><summary>🔎 Проверка подозрительного приложения</summary><p>Проверь издателя, источник установки и разрешения. Публичные отчёты о трекерах не доказывают безопасность APK.</p><button onClick={()=>open('https://reports.exodus-privacy.eu.org/en/')}>Публичные отчёты Exodus Privacy</button><button onClick={()=>open('https://support.google.com/googleplay/answer/2812853?hl=ru')}>Google Play Protect</button><small>Файлы и список установленных приложений не собираются.</small></details>
 {!parent&&<details><summary>🤝 Быстрая связь с семьёй</summary><p>Выбери сообщение, затем подтверди отправку. Геолокация отдельно.</p>{['Я благополучно добрался.','Я задерживаюсь. Свяжитесь со мной, пожалуйста.','Мне нужна помощь. Пожалуйста, позвоните мне.'].map(v=><button key={v} aria-pressed={selected===v} onClick={()=>setSelected(v)}>{v}</button>)}{selected&&<button disabled={helpBusy} onClick={()=>void send()}>Подтвердить отправку сообщения</button>}<a className="safety-emergency" href="tel:112">Экстренная помощь 112</a></details>}
 <details onToggle={e=>{if(e.currentTarget.open)void readLog()}}><summary>📋 Журнал изменений семейных правил</summary><button onClick={()=>void readLog()}>Обновить журнал</button><p>{logStatus}</p>{log.map(r=><article className="safety-rule" key={r.id}><strong>{r.app_name}</strong><small>{new Date(r.created_at).toLocaleString('ru-RU')} · {({created:'Создано',updated:'Изменено',deleted:'Удалено'} as Record<string,string>)[r.action]}</small><p>{[r.old_rule&&rules[r.old_rule],r.new_rule&&rules[r.new_rule]].filter(Boolean).join(' → ')}</p></article>)}<small>Журнал хранится 90 дней; это история правил, а не действий ребёнка в других приложениях.</small></details>
 <details><summary>✅ Проверка безопасности и восстановления</summary><p>Отмечено {checks.length}/{checklist.length}. Отметки локальные и не подтверждают фактическое состояние Android.</p>{checklist.map(([id,label])=><label key={id}><input type="checkbox" checked={checks.includes(id)} onChange={()=>toggle(id)}/>{label}</label>)}<button onClick={onSettings}>Настройки «Моего мира»</button></details>
 {note&&<p role="status">{note}</p>}
 </section>
}
