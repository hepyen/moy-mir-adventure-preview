import {MiroAvatar} from './MiroAvatar'
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
 const robot=<MiroAvatar face={face}/>
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
