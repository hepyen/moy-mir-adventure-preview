import {MiroAvatar} from './MiroAvatar'
import {miroOfflineAnswer} from './miroOffline';
import {setMusicDucked} from '../features/music';
import {useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import './MiroRobot.css'
import {playMiroChirp} from './miroSound'
import {MIRO_TOPICS,MIRO_LEVELS,readMiroProfile,saveMiroProfile,miroLevel,localStudySummary} from './miroProfile'
import type {MiroProfile,MiroTopicId} from './miroProfile'
import {canListen,speakMiro,listenMiro,stopSpeaking} from './miroVoice'
type Turn={role:'user'|'assistant';content:string}
const ENDPOINT='https://ueqtitxbvsnqmbudwxwu.supabase.co/functions/v1/moymir2-miro-ai'
const MAX_HISTORY=14
const INITIAL:Turn={role:'assistant',content:'Привет! Я Миро, твой помощник. Можешь спросить меня о математике, испанском, английском, уроках или о нашем острове. Чем помочь?'}
function savedHistory(userId:string):Turn[]{try{const saved=JSON.parse(localStorage.getItem('moymir30-ai-chat:'+userId)||'null');return Array.isArray(saved)&&saved.length?saved.slice(-MAX_HISTORY):[INITIAL]}catch{return [INITIAL]}}
export function MiroRobot({worldPoints,spiritualPoints,soundEnabled=true,userId='guest',announcement='',announcementId=0}:{worldPoints:number;spiritualPoints:number;soundEnabled?:boolean;userId?:string;announcement?:string;announcementId?:number}){
 const [expanded,setExpanded]=useState(false)
 const [profile,setProfile]=useState<MiroProfile>(()=>readMiroProfile(userId))
 const [profileTab,setProfileTab]=useState<'chat'|'study'|'robot'>('chat')
 const [talking,setTalking]=useState(false),[listening,setListening]=useState(false),[voiceError,setVoiceError]=useState('')
 const visibleRef=useRef(false)
 useEffect(()=>{visibleRef.current=expanded},[expanded])
 const mic=useRef<(()=>void)|null>(null)
 const level=miroLevel(worldPoints)
 const style=MIRO_LEVELS.some(l=>l.style===profile.style&&l.at<=worldPoints)?profile.style:level.style
 const study=expanded&&profileTab==='study'?localStudySummary(userId):[]
 function changeProfile(next:MiroProfile){setProfile(next);saveMiroProfile(userId,next)}
 function toggleTopic(id:MiroTopicId){changeProfile({...profile,topics:profile.topics.includes(id)?profile.topics.filter(t=>t!==id):[...profile.topics,id]})}
 function speak(text:string,lang=profile.language){if(!soundEnabled){setVoiceError('Включи звук в настройках приложения.');return}mic.current?.();setListening(false);setVoiceError('');setTalking(true);speakMiro(text,lang,()=>setTalking(false),()=>{setTalking(false);setVoiceError('Озвучивание недоступно. Проверь голосовой движок Android.')})}
 function stopVoice(){mic.current?.();mic.current=null;stopSpeaking();setListening(false);setTalking(false)}
 function startMic(){if(listening){mic.current?.();mic.current=null;setListening(false);return}stopSpeaking();setTalking(false);setVoiceError('');setListening(true);mic.current=listenMiro(profile.language,t=>{if(t&&visibleRef.current)setDraft(old=>(old+' '+t).trim().slice(0,1600));setListening(false)},e=>{setVoiceError(e);setListening(false)},()=>setListening(false));if(!mic.current)setListening(false)}
 useEffect(()=>{const hide=()=>{if(document.visibilityState==='hidden')stopVoice()};document.addEventListener('visibilitychange',hide);return()=>{document.removeEventListener('visibilitychange',hide);mic.current?.();stopSpeaking()}},[])
 useEffect(()=>{if(!soundEnabled){stopSpeaking();setTalking(false)}},[soundEnabled])

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
 useEffect(()=>{if(historyOwner!==userId){controller.current?.abort();setHistory(savedHistory(userId));setHistoryOwner(userId);setProfile(readMiroProfile(userId));stopVoice()}},[historyOwner,userId])
 useEffect(()=>{if(historyOwner!==userId)return;try{localStorage.setItem('moymir30-ai-chat:'+userId,JSON.stringify(history.slice(-MAX_HISTORY)))}catch{};historyEnd.current?.parentElement?.scrollTo({top:historyEnd.current.parentElement.scrollHeight,behavior:'smooth'})},[history,historyOwner,userId])
 useEffect(()=>()=>{controller.current?.abort()},[])
 useEffect(()=>{const openQuestion=()=>{const question=sessionStorage.getItem('moymir-miro-next-question');if(question){sessionStorage.removeItem('moymir-miro-next-question');setDraft(question);setProfileTab('chat');visibleRef.current=true;setExpanded(true)}};openQuestion();window.addEventListener('moymir-open-miro',openQuestion);return()=>window.removeEventListener('moymir-open-miro',openQuestion)},[])
 useEffect(()=>{if(worldPoints>previousWorld.current){setFace('wow');setMessage('Ура! Наш мир становится красивее! ✨')}previousWorld.current=worldPoints},[worldPoints])
 useEffect(()=>{if(spiritualPoints>previousSpiritual.current){setFace('smile');setMessage('Отлично! Ещё один хороший шаг! 🌱')}previousSpiritual.current=spiritualPoints},[spiritualPoints])
 useEffect(()=>{if(announcementId>0&&announcement){setFace('wink');setMessage(announcement)}},[announcementId,announcement])
 function open(){visibleRef.current=true;setProfileTab('chat');playMiroChirp(sounds.current++,soundEnabled);setFace('wink');setExpanded(true);setMessage(null)}
 function close(){visibleRef.current=false;stopVoice();setExpanded(false);setError('');setFace('smile')}
 async function send(question:string){
  const text=question.trim()
  if(!text||busy||text.length>1600)return
  stopVoice();setProfileTab('chat')
  const next:Turn[]=[...history,{role:'user' as const,content:text}].slice(-MAX_HISTORY)
  setHistory(next);setDraft('');setBusy(true);setError('');setFace('wow')
  const savedTopics=MIRO_TOPICS.filter(t=>profile.topics.includes(t.id))
  const local=/что повторить сегодня|мои сохранённые темы/i.test(text)?(savedTopics.length?'В твоём списке повторения: '+savedTopics.map(t=>t.label).join(', ')+'. Открой «Учёба» и выбери тему.':'Открой «Учёба» и выбери одну тему, которую хочется повторить. Начни с короткого упражнения.'):miroOfflineAnswer(text,userId);
  if(local){setHistory([...next,{role:'assistant' as const,content:local}].slice(-MAX_HISTORY));setBusy(false);setFace('smile');if(profile.autoSpeak&&visibleRef.current)speak(local);return}
  const ac=new AbortController();controller.current=ac
  try{
   const response=await fetch(ENDPOINT,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({messages:next.filter(t=>t.role==='user'||t.role==='assistant').slice(-10)}),signal:ac.signal})
   const output=await response.json()
   if(!response.ok||!output?.answer)throw new Error(output?.error||'Сервис недоступен')
   setHistory(old=>[...old,{role:'assistant' as const,content:String(output.answer)}].slice(-MAX_HISTORY))
   setFace('smile');if(profile.autoSpeak&&visibleRef.current)speak(String(output.answer))
  }catch(err){if(ac.signal.aborted)return;setFace('wow');setError(err instanceof Error?err.message:'Не получается связаться с нейросетью')}
  finally{setBusy(false);controller.current=null}
 }
 const robot=<MiroAvatar face={face} style={style} talking={talking}/>
 const overlay=expanded?createPortal(<div className="miro-fullscreen" role="dialog" aria-modal="true" aria-label="Миро — нейросеть и помощь с уроками">
  <div className="miro-full-top"><strong>🤖 Миро 2.0 · {level.name}</strong><button type="button" onClick={close} aria-label="Уменьшить Миро">↘ Свернуть</button></div>
  <button type="button" className="miro-big-avatar" onDoubleClick={close} onTouchEnd={e=>{const now=Date.now();if(now-lastTouch.current<400){e.preventDefault();close()}lastTouch.current=now}} title="Нажми дважды, чтобы уменьшить">{robot}<span>Нажми дважды, чтобы уменьшить меня</span></button>
  <div className="miro-tabs" role="group" aria-label="Режимы Миро">{(['chat','study','robot'] as const).map((t,i)=><button key={t} aria-pressed={profileTab===t} onClick={()=>{stopVoice();setProfileTab(t)}}>{['💬 Разговор','📚 Учёба','🤖 Робот'][i]}</button>)}</div>
  <section className="miro-ai-chat">
  {profileTab==='study'?<div className="miro-profile-scroll"><h3>Моя память об учёбе</h3><p>Отметь темы, которые хочешь повторить. Миро запомнит их на этом телефоне.</p><div className="miro-topic-list">{MIRO_TOPICS.map(t=><label key={t.id}><input type="checkbox" checked={profile.topics.includes(t.id)} onChange={()=>toggleTopic(t.id)}/><span><strong>{t.label}</strong><small>{t.subject}</small></span><button onClick={()=>{setDraft(t.question);setProfileTab('chat')}}>Разобрать</button></label>)}</div>{profile.topics.length>0&&<button className="miro-profile-action" onClick={()=>{setDraft('Помоги повторить тему: '+MIRO_TOPICS.find(t=>t.id===profile.topics[0])?.label+'. Объясни простыми словами и дай одну задачу.');setProfileTab('chat')}}>Повторить сохранённую тему</button>}<h3>Результаты тренажёра на телефоне</h3>{study.length?study.map(s=><div key={s.subject+s.chapter} className="miro-study-result"><span>{s.subject} · {s.chapter}</span><strong>{s.score}/{s.total}</strong><button onClick={()=>{setDraft('Помоги повторить тему '+s.chapter+' ('+s.subject+'). Объясни правило и дай пример.');setProfileTab('chat')}}>Повторить</button></div>):<p>Пока нет сохранённых результатов большого тренажёра. После занятий здесь появятся темы и реальные оценки.</p>}<button className="miro-profile-action" onClick={()=>{if(confirm('Удалить список выбранных тем? Результаты школьных занятий не изменятся.'))changeProfile({...profile,topics:[]})}}>Очистить память тем</button></div>:profileTab==='robot'?<div className="miro-profile-scroll"><h3>Уровень: {level.name}</h3><p>Уровень зависит от уже заработанных очков. Новые корпуса и украшения открываются без траты монет; учёба и голос доступны с самого начала.</p><div className="miro-levels">{MIRO_LEVELS.map(l=><button key={l.style} disabled={worldPoints<l.at} aria-pressed={style===l.style} onClick={()=>changeProfile({...profile,style:l.style})}><MiroAvatar style={l.style}/><strong>{l.label}</strong><small>{worldPoints<l.at?'🔒 '+l.at+' очков':style===l.style?'Выбран':'Открыт'}</small></button>)}</div><h3>Голос Миро</h3><label className="miro-voice-setting"><input type="checkbox" checked={profile.autoSpeak} onChange={e=>changeProfile({...profile,autoSpeak:e.target.checked})}/> Озвучивать ответы автоматически</label><label className="miro-voice-setting">Язык речи <select value={profile.language} onChange={e=>changeProfile({...profile,language:e.target.value as MiroProfile['language']})}><option value="ru-RU">Русский</option><option value="es-ES">Español</option><option value="en-GB">English</option></select></label><button className="miro-profile-action" onClick={()=>speak(profile.language==='en-GB'?'Hello! I am Miro, your study helper.':profile.language==='es-ES'?'Hola, soy Miro. Vamos a aprender juntos.':'Привет! Я Миро. Давай учиться вместе!')}>🔊 Проверить голос</button>{talking&&<button className="miro-profile-action" onClick={stopVoice}>Остановить голос</button>}{voiceError&&<p role="status">{voiceError}</p>}</div>:<>
  <div className="miro-ai-history" aria-live="polite">
  {history.map((m,i)=><div key={i} className={'miro-ai-turn '+(m.role==='user'?'mine':'robot')}>{m.content}{m.role==='assistant'&&<button type="button" className="miro-read" onClick={()=>speak(m.content)} aria-label="Озвучить ответ Миро">🔊</button>}</div>)}
  {busy&&<div className="miro-ai-turn robot">Миро думает…</div>}
  {error&&<div className="miro-ai-error" role="alert">{error}<button onClick={()=>void send(history.filter(x=>x.role==='user').at(-1)?.content||'')} disabled={busy}>Повторить</button></div>}
  <div ref={historyEnd}/>
  </div>
  <div className="miro-ai-examples">{['Что взять в рюкзак?','Какие уроки сегодня?','Что повторить сегодня?','Как прошёл мой день?','Где ежедневный стих?','Помоги с дробями'].map(x=><button key={x} onClick={()=>void send(x)} disabled={busy}>{x}</button>)}</div>
  <div className="miro-voice-bar"><button type="button" aria-pressed={listening} onClick={startMic} disabled={busy}>{listening?'⏹ Остановить':'🎙 Сказать вопрос'}</button>{talking&&<button type="button" onClick={stopVoice}>⏹ Остановить голос</button>}<small>{canListen()?'Речь обрабатывается голосовой службой устройства, иногда через интернет. Проверь текст перед отправкой.':'Можно воспользоваться микрофоном клавиатуры.'}</small></div>{voiceError&&<p className="miro-ai-error" role="status">{voiceError}</p>}
  <form className="miro-ai-compose" onSubmit={e=>{e.preventDefault();void send(draft)}}><textarea aria-label="Вопрос Миро" value={draft} maxLength={1600} rows={2} onChange={e=>setDraft(e.target.value)} placeholder="Спроси что угодно об уроках…"/><button type="submit" disabled={!draft.trim()||busy}>➤</button></form>
  <div className="miro-ai-note"><span>Простые подсказки работают без интернета. Сложные ответы даёт онлайн-нейросеть. Миро может ошибаться: проверяй решения.</span><button onClick={()=>{if(confirm('Очистить историю вопросов Миро?'))setHistory([INITIAL])}}>Очистить чат</button></div></>}
  </section>
 </div>,document.body):null
 return <div className="miro-flight-zone" aria-label="Летающий робот Миро"><div className="miro-orbit">
  {message&&<div className="miro-speech" role="status">{message}<button type="button" onClick={()=>setMessage(null)}>×</button></div>}
  <button type="button" className={'miro-robot miro-'+face} onClick={open} aria-label="Открыть чат с Миро" title="Нажми, чтобы поговорить с нейросетью">{robot}</button>
  </div><button className="miro-fixed-open" type="button" onClick={open}>🤖 Поговорить с Миро</button>{overlay}</div>
}
