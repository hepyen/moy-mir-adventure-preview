import {miroOfflineAnswer} from './miroOffline';
import {setMusicDucked} from '../features/music';
import {useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import './MiroRobot.css'
import {playMiroChirp} from './miroSound'
type Turn={role:'user'|'assistant';content:string}
const ENDPOINT='https://ueqtitxbvsnqmbudwxwu.supabase.co/functions/v1/moymir2-miro-ai'
const MAX_HISTORY=14
const INITIAL:Turn={role:'assistant',content:'Привет! Я Миро, твой помощник. Можешь спросить меня о математике, испанском, английском, уроках или о нашем острове. Чем помочь?'}
function savedHistory(userId:string):Turn[]{try{const saved=JSON.parse(localStorage.getItem('moymir30-ai-chat:'+userId)||'null');return Array.isArray(saved)&&saved.length?saved.slice(-MAX_HISTORY):[INITIAL]}catch{return [INITIAL]}}
export function MiroRobot({worldPoints,spiritualPoints,soundEnabled=true,userId='guest'}:{worldPoints:number;spiritualPoints:number;soundEnabled?:boolean;userId?:string}){
 const [expanded,setExpanded]=useState(false)
 useEffect(()=>{setMusicDucked(expanded);return()=>setMusicDucked(false)},[expanded])
 const [face,setFace]=useState<'smile'|'wink'|'wow'>('smile')
 const [draft,setDraft]=useState('')
 const [history,setHistory]=useState<Turn[]>(()=>savedHistory(userId))
 const[historyOwner,setHistoryOwner]=useState(userId)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [message,setMessage]=useState<string|null>(null)
 const lastTouch=useRef(0)
 const historyEnd=useRef<HTMLDivElement|null>(null)
 const controller=useRef<AbortController|null>(null)
 const previousWorld=useRef(worldPoints)
 const previousSpiritual=useRef(spiritualPoints)
 const sounds=useRef(0)
 useEffect(()=>{if(historyOwner!==userId){controller.current?.abort();setHistory(savedHistory(userId));setHistoryOwner(userId)}},[historyOwner,userId])
 useEffect(()=>{if(historyOwner!==userId)return;try{localStorage.setItem('moymir30-ai-chat:'+userId,JSON.stringify(history.slice(-MAX_HISTORY)))}catch{};historyEnd.current?.parentElement?.scrollTo({top:historyEnd.current.parentElement.scrollHeight,behavior:'smooth'})},[history,historyOwner,userId])
 useEffect(()=>()=>{controller.current?.abort()},[])
 useEffect(()=>{const question=sessionStorage.getItem('moymir-miro-next-question');if(question){sessionStorage.removeItem('moymir-miro-next-question');setDraft(question);setExpanded(true)}},[])
 useEffect(()=>{if(worldPoints>previousWorld.current){setFace('wow');setMessage('Ура! Наш мир становится красивее! ✨')}previousWorld.current=worldPoints},[worldPoints])
 useEffect(()=>{if(spiritualPoints>previousSpiritual.current){setFace('smile');setMessage('Отлично! Ещё один хороший шаг! 🌱')}previousSpiritual.current=spiritualPoints},[spiritualPoints])
 function open(){playMiroChirp(sounds.current++,soundEnabled);setFace('wink');setExpanded(true);setMessage(null)}
 function close(){setExpanded(false);setError('');setFace('smile')}
 async function send(question:string){
  const text=question.trim()
  if(!text||busy||text.length>1600)return
  const next:Turn[]=[...history,{role:'user' as const,content:text}].slice(-MAX_HISTORY)
  setHistory(next);setDraft('');setBusy(true);setError('');setFace('wow')
  const local=miroOfflineAnswer(text,userId);
  if(local){setHistory([...next,{role:'assistant' as const,content:local}].slice(-MAX_HISTORY));setBusy(false);setFace('smile');return}
  const ac=new AbortController();controller.current=ac
  try{
   const response=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:next.filter(t=>t.role==='user'||t.role==='assistant').slice(-10)}),signal:ac.signal})
   const output=await response.json()
   if(!response.ok||!output?.answer)throw new Error(output?.error||'Сервис недоступен')
   setHistory(old=>[...old,{role:'assistant' as const,content:String(output.answer)}].slice(-MAX_HISTORY))
   setFace('smile')
  }catch(err){if(ac.signal.aborted)return;setFace('wow');setError(err instanceof Error?err.message:'Не получается связаться с нейросетью')}
  finally{setBusy(false);controller.current=null}
 }
 const robot=<>
    <svg viewBox="0 0 150 172" aria-hidden="true">
     <defs>
      <linearGradient id="miroWhite" x1=".15" x2=".9" y1="0" y2="1"><stop stopColor="#fff"/><stop offset=".55" stopColor="#e5f7ff"/><stop offset="1" stopColor="#91c7e3"/></linearGradient>
      <linearGradient id="miroFace" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#17466e"/><stop offset="1" stopColor="#061b35"/></linearGradient>
      <radialGradient id="miroGlow"><stop stopColor="#86f8f4" stopOpacity=".85"/><stop offset="1" stopColor="#54bcef" stopOpacity="0"/></radialGradient>
     </defs>
     <ellipse cx="75" cy="152" rx="53" ry="19" fill="url(#miroGlow)" className="miro-beam"/>
     <path d="M42 76 Q32 92 41 122 Q55 144 75 145 Q103 142 112 121 Q119 95 106 76Z" fill="url(#miroWhite)" stroke="#b7e8fb" strokeWidth="2"/>
     <path d="M36 85 Q18 80 18 99 Q18 117 36 120 L42 109Z" fill="url(#miroWhite)"/>
     <path d="M114 85 Q132 80 132 99 Q132 117 114 120 L108 109Z" fill="url(#miroWhite)"/>
     <path d="M25 46 Q25 16 74 15 Q123 16 125 47 Q130 73 104 86 Q76 99 47 86 Q19 72 25 46Z" fill="url(#miroWhite)" stroke="#b4dff5" strokeWidth="2.5"/>
     <path d="M32 48 Q33 30 73 29 Q111 30 117 49 Q120 72 95 78 Q74 85 52 77 Q29 70 32 48Z" fill="url(#miroFace)"/>
     <g className="miro-eyes" fill="none" stroke="#66f4ed" strokeWidth="5.5" strokeLinecap="round">
      {face==='wink'?<><path d="M53 56 Q61 61 70 56"/><path d="M83 51 Q91 40 99 51 Q91 62 83 51"/></>:face==='wow'?<><ellipse cx="61" cy="53" rx="7" ry="10"/><ellipse cx="93" cy="53" rx="7" ry="10"/></>:<><path d="M52 53 Q60 44 68 53"/><path d="M83 53 Q91 44 99 53"/></>}
     </g>
     <path d="M69 66 Q75 71 81 66" stroke="#60f5e9" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
     <ellipse cx="74" cy="110" rx="11" ry="5" fill="#9be7f5" opacity=".8"/>
     <circle cx="35" cy="37" r="3" fill="#fff" opacity=".65"/>
    </svg>
 </>
 const overlay=expanded?createPortal(<div className="miro-fullscreen" role="dialog" aria-modal="true" aria-label="Миро — нейросеть и помощь с уроками">
  <div className="miro-full-top"><strong>🤖 Миро · ИИ-помощник</strong><button type="button" onClick={close} aria-label="Уменьшить Миро">↘ Свернуть</button></div>
  <button type="button" className="miro-big-avatar" onDoubleClick={close} onTouchEnd={e=>{const now=Date.now();if(now-lastTouch.current<400){e.preventDefault();close()}lastTouch.current=now}} title="Нажми дважды, чтобы уменьшить">{robot}<span>Нажми дважды, чтобы уменьшить меня</span></button>
  <section className="miro-ai-chat"><div className="miro-ai-history" aria-live="polite">
  {history.map((m,i)=><div key={i} className={'miro-ai-turn '+(m.role==='user'?'mine':'robot')}>{m.content}</div>)}
  {busy&&<div className="miro-ai-turn robot">Миро думает…</div>}
  {error&&<div className="miro-ai-error" role="alert">{error}<button onClick={()=>void send(history.filter(x=>x.role==='user').at(-1)?.content||'')} disabled={busy}>Повторить</button></div>}
  <div ref={historyEnd}/>
  </div>
  <div className="miro-ai-examples">{['Что взять в рюкзак?','Какие уроки сегодня?','Где ежедневный стих?','Помоги с дробями'].map(x=><button key={x} onClick={()=>void send(x)} disabled={busy}>{x}</button>)}</div>
  <form className="miro-ai-compose" onSubmit={e=>{e.preventDefault();void send(draft)}}><textarea aria-label="Вопрос Миро" value={draft} maxLength={1600} rows={2} onChange={e=>setDraft(e.target.value)} placeholder="Спроси что угодно об уроках…"/><button type="submit" disabled={!draft.trim()||busy}>➤</button></form>
  <div className="miro-ai-note"><span>Простые подсказки работают без интернета. Сложные ответы даёт онлайн-нейросеть. Миро может ошибаться: проверяй решения.</span><button onClick={()=>{if(confirm('Очистить историю вопросов Миро?'))setHistory([INITIAL])}}>Очистить чат</button></div>
  </section>
 </div>,document.body):null
 return <div className="miro-flight-zone" aria-label="Летающий робот Миро"><div className="miro-orbit">
  {message&&<div className="miro-speech" role="status">{message}<button type="button" onClick={()=>setMessage(null)}>×</button></div>}
  <button type="button" className={'miro-robot miro-'+face} onClick={open} aria-label="Открыть чат с Миро" title="Нажми, чтобы поговорить с нейросетью">{robot}</button>
  </div>{overlay}</div>
}
