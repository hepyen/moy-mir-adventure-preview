import {useCallback,useEffect,useMemo,useRef,useState} from 'react'
import type {useFamilyCloud} from '../lib/useFamilyCloud'
import {supabase} from '../lib/supabase'
import {ALL_ENGLISH_LESSONS,DIAGNOSTIC,LESSONS,LEGACY_LESSONS,findEnglishLesson} from './lessons'
import {GuidedQuiz,LeaveLessonWarning,blankGuided,restoreGuided,recordGuidedChoice,readyToSubmit,masteredCount} from './guidedFeedback'
import type {GuidedProgress} from './guidedFeedback'
import type {EnglishLesson} from './lessons'
import './EnglishTutor.css'

type Cloud=ReturnType<typeof useFamilyCloud>
type EnglishSession={id:string;family_id:string;child_id:string;lesson_key:string;activity_day:string;started_at:string;finished_at:string|null;score:number|null;total_questions:number;status:'in_progress'|'completed';points_awarded:number;answers:number[]|null}
type CurrentSession={id:string;started_at:string;lesson_key:string}
type Outcome={score:number;total:number;points_awarded:number;correct_answers:number[];answers:number[]}
type TalkMessage={role:'user'|'assistant';content:string}
function pronounce(text:string){
 if(typeof window==='undefined'||!('speechSynthesis' in window))return false
 try{window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-GB';utterance.rate=.84;window.speechSynthesis.speak(utterance);return true}catch{return false}
}
function makeRecognition(onText:(text:string)=>void,onError:(error:string)=>void,onEnd:()=>void):(()=>void)|null{
 type Recognition={lang:string;interimResults:boolean;maxAlternatives:number;onresult:((e:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void}
 type RecognitionCtor=new()=>Recognition
 const w=window as typeof window&{SpeechRecognition?:RecognitionCtor;webkitSpeechRecognition?:RecognitionCtor}
 const C=w.SpeechRecognition??w.webkitSpeechRecognition
 if(!C)return null
 try{
  const r=new C();r.lang='en-GB';r.interimResults=false;r.maxAlternatives=1
  r.onresult=e=>onText(e.results[0]?.[0]?.transcript??'')
  r.onerror=e=>onError(e.error==='not-allowed'?'Разреши доступ к микрофону в настройках телефона.':'Микрофон не распознал речь. Можно напечатать ответ.')
  r.onend=onEnd
  r.start();return ()=>r.stop()
 }catch{onError('На этом устройстве распознавание речи недоступно. Используй клавиатуру.');return null}
}
function mmss(seconds:number){return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')}
function percentage(score:number,total:number){return total?Math.round(score/total*100):0}
function suggestedLessons(rows:EnglishSession[]){
 const completed=rows.filter(r=>r.status==='completed'&&r.lesson_key!=='diagnostic')
 const mistakes=new Map<string,number>()
 for(const row of rows.filter(r=>r.status==='completed').slice(0,25)){
  const lesson=findEnglishLesson(row.lesson_key)
  if(!lesson||!Array.isArray(row.answers))continue
  row.answers.forEach((answer,i)=>{
   const q=lesson.questions[i];if(q&&answer!==q.correct)mistakes.set(q.topic,(mistakes.get(q.topic)??0)+1)
  })
 }
 const weak=Array.from(mistakes.entries()).sort((a,b)=>b[1]-a[1]).map(([topic])=>topic)
 const next=LESSONS.filter(l=>!completed.some(r=>r.lesson_key===l.id)).sort((a,b)=>Number(weak.includes(b.id))-Number(weak.includes(a.id)))[0]
 return {weak:weak.slice(0,4),next:next??LESSONS.find(l=>weak.includes(l.id))??LESSONS[0]}
}
function entryLabel(lesson:EnglishLesson){return `${lesson.title} · ${lesson.level}`}
export function EnglishTutorEntry({cloud}:{cloud:Cloud}){
 const[open,setOpen]=useState(false)
 return <>
  <section className="english-entry"><div className="english-entry-icon">🇬🇧</div><div><small>НОВЫЙ РАЗДЕЛ · АНГЛИЙСКИЙ 1.º ESO</small><h3>Английский с Миро</h3><p>ИИ-репетитор, диагностика, уроки, разговоры и повторение ошибок. За 15 минут занятий: +30 баллов.</p></div><button type="button" onClick={()=>setOpen(true)}>{cloud.role==='parent'?'📊 Отчёт':'📖 Учиться'} <span aria-hidden>→</span></button></section>
  {open&&<EnglishTutor cloud={cloud} onClose={()=>setOpen(false)}/>}
 </>
}
function EnglishTutor({cloud,onClose}:{cloud:Cloud;onClose:()=>void}){
 const isChild=cloud.role==='child'
 const[history,setHistory]=useState<EnglishSession[]>([])
 const[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
 const[lesson,setLesson]=useState<EnglishLesson|null>(null)
 const[session,setSession]=useState<CurrentSession|null>(null)
 const[guided,setGuided]=useState<GuidedProgress>(()=>blankGuided(0))
 const[leaveAction,setLeaveAction]=useState<'close'|'list'|null>(null)
 const answers=guided.first
 const[index,setIndex]=useState(0)
 const[clockNow,setClockNow]=useState(Date.now())
 const[activeSeconds,setActiveSeconds]=useState(0)
 const[heartbeatAt,setHeartbeatAt]=useState(Date.now())
 const[outcome,setOutcome]=useState<Outcome|null>(null)
 const[chat,setChat]=useState<TalkMessage[]>([]),[draft,setDraft]=useState(''),[aiBusy,setAiBusy]=useState(false),[listening,setListening]=useState(false)
 const[chatOpen,setChatOpen]=useState(false)
 const stopListening=useRef<(()=>void)|null>(null)
 const activeId=session?.id
 const extendedLesson=Boolean(session?.lesson_key.startsWith('eng2:'))
 const foregroundSeconds=extendedLesson&&typeof document!=='undefined'&&document.visibilityState==='visible'&&!leaveAction?Math.min(10,Math.max(0,Math.floor((clockNow-heartbeatAt)/1000))):0
 const secondsLeft=session&&lesson?.id!=='diagnostic'?extendedLesson?Math.max(0,900-activeSeconds-foregroundSeconds):Math.max(0,Math.ceil((Date.parse(session.started_at)+900000-clockNow)/1000)):0
 const analysis=useMemo(()=>suggestedLessons(history),[history])
 const totalAwards=history.reduce((n,r)=>n+Number(r.points_awarded||0),0)
 const completed=history.filter(x=>x.status==='completed')
 const pendingLegacy=history.filter(x=>x.status==='in_progress'&&LEGACY_LESSONS.some(l=>l.id===x.lesson_key)&&x.activity_day===new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()))
 const lastPlacement=completed.find(x=>x.lesson_key==='diagnostic')
 const refreshHistory=useCallback(async()=>{
  if(!cloud.familyId||!cloud.childId)return
  const result=await supabase.from('moymir_english_sessions').select('id,family_id,child_id,lesson_key,activity_day,started_at,finished_at,score,total_questions,status,points_awarded,answers').eq('family_id',cloud.familyId).eq('child_id',cloud.childId).in('lesson_key',ALL_ENGLISH_LESSONS.map(l=>l.id)).order('started_at',{ascending:false}).limit(80)
  if(result.error)throw result.error
  setHistory((result.data??[]) as EnglishSession[])
 },[cloud.familyId,cloud.childId])
 useEffect(()=>{let alive=true;setLoading(true);void refreshHistory().catch(e=>{if(alive)setError(e instanceof Error?e.message:'Не удалось получить результаты')}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[refreshHistory])
 useEffect(()=>{if(!activeId||outcome)return;const tick=()=>setClockNow(Date.now());tick();const timer=window.setInterval(tick,1000);return()=>window.clearInterval(timer)},[activeId,outcome])
 useEffect(()=>{
  if(!activeId||!extendedLesson||outcome||leaveAction)return
  let alive=true;let pending=false
  const ping=async()=>{
   if(!alive||pending||document.visibilityState!=='visible')return
   pending=true
   try{
    const result=await supabase.rpc('moymir_study_heartbeat',{p_session:activeId})
    if(!alive)return
    if(result.error)throw result.error
    const seconds=Number((result.data as {active_seconds?:number})?.active_seconds)
    if(Number.isFinite(seconds)&&seconds>=0){setActiveSeconds(Math.floor(seconds));setHeartbeatAt(Date.now())}
   }catch(e){if(alive)setError('Не удаётся подтвердить учебное время на сервере. Проверь подключение к интернету. '+(e instanceof Error?e.message:''))}
   finally{pending=false}
  }
  void ping()
  const timer=window.setInterval(()=>void ping(),10000)
  const visible=()=>{if(document.visibilityState==='visible'){setClockNow(Date.now());void ping()}}
  document.addEventListener('visibilitychange',visible)
  return()=>{alive=false;window.clearInterval(timer);document.removeEventListener('visibilitychange',visible)}
 },[activeId,extendedLesson,outcome,leaveAction])
 useEffect(()=>()=>{stopListening.current?.();if('speechSynthesis' in window)window.speechSynthesis.cancel()},[])
 const begin=async(next:EnglishLesson)=>{
  if(!isChild||busy)return
  setBusy(true);setError('');setMessage('');setChatOpen(false)
  try{
   const result=await supabase.rpc('moymir_english_begin',{p_lesson:next.id})
   if(result.error)throw result.error
   const data=result.data as CurrentSession
   if(!data?.id||!data.started_at)throw Error('Сервер не создал занятие')
   setLesson(next);setSession(data);setIndex(0);setOutcome(null);setClockNow(Date.now());setActiveSeconds(0);setHeartbeatAt(Date.now())
   let saved:unknown=null
   try{saved=JSON.parse(localStorage.getItem('moymir-english-draft:'+data.id)||'null')}catch{}
   setGuided(restoreGuided(saved,next.questions.length))
  }catch(e){setError(e instanceof Error?e.message:'Не удалось начать урок')}finally{setBusy(false)}
 }
 const answer=(choice:number)=>{
  if(!session||!lesson||outcome)return
  setGuided(prev=>{
   const next=recordGuidedChoice(prev,index,choice,lesson.questions[index],lesson.id==='diagnostic')
   try{localStorage.setItem('moymir-english-draft:'+session.id,JSON.stringify(next))}catch{}
   return next
  })
 }
 const finish=async()=>{
  if(!session||!lesson||busy||!readyToSubmit(guided,lesson.questions.length)||secondsLeft>0)return
  setBusy(true);setError('');setMessage('')
  try{
   const result=await supabase.rpc('moymir_english_finish',{p_session:session.id,p_answers:answers})
   if(result.error)throw result.error
   const data=result.data as {status:'waiting'|'completed';remaining_seconds?:number;score:number;total:number;points_awarded?:number;correct_answers?:number[]}
   if(data.status==='waiting'){if(extendedLesson){setActiveSeconds(Math.max(0,900-(data.remaining_seconds??900)));setHeartbeatAt(Date.now())}setError(`Занятие ещё не завершено: осталось ${mmss(data.remaining_seconds??1)} активных учебных минут и секунд.`);return}
   setOutcome({score:data.score,total:data.total,points_awarded:data.points_awarded??0,correct_answers:data.correct_answers??[],answers:answers as number[]})
   try{localStorage.removeItem('moymir-english-draft:'+session.id)}catch{}
   setMessage(data.points_awarded===30?'🎉 Занятие завершено! +30 баллов добавлено в семейный баланс.':lesson.id==='diagnostic'?'Диагностика завершена. Миро подготовил план занятий.':'Урок завершён. За повторение уже пройденного сегодня урока баллы повторно не начисляются.')
   await Promise.all([refreshHistory(),cloud.refresh()])
  }catch(e){setError(e instanceof Error?e.message:'Ошибка сохранения результатов. Повтори попытку при наличии интернета.')}finally{setBusy(false)}
 }
 const backToList=()=>{setLesson(null);setSession(null);setOutcome(null);setIndex(0);setGuided(blankGuided(0));setChatOpen(false);setMessage('');setError('');void refreshHistory()}
 const requestExit=(action:'close'|'list')=>{if(session&&!outcome){setLeaveAction(action);return}if(action==='close')onClose();else backToList()}
 const confirmLeave=()=>{const action=leaveAction;setLeaveAction(null);if(action==='close')onClose();else backToList()}
 useEffect(()=>{if(!session||outcome)return;const protect=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue=''};window.addEventListener('beforeunload',protect);return()=>window.removeEventListener('beforeunload',protect)},[session?.id,outcome])
 const askAI=async(text?:string)=>{
  const question=(text??draft).trim().slice(0,800)
  if(!question||aiBusy)return
  setAiBusy(true);setError('');setDraft('')
  const next=[...chat,{role:'user',content:question} as TalkMessage].slice(-8);setChat(next)
  try{
   const lessonContext=lesson?`Текущая тема: ${lesson.title}. Правило: ${lesson.rule}`:'Подбирай упражнения уровня A1 для первого года испанской ESO.'
   const hint='Режим репетитора по английскому для школьника 1º ESO. '+lessonContext+' Общайся на русском, давай короткие примеры на английском, задавай один вопрос за раз и мягко исправляй ошибки. Не собирай личные сведения. Не называй себя человеком.'
   const result=await supabase.functions.invoke('moymir2-miro-ai',{body:{messages:[{role:'user',content:hint},...next]}})
   if(result.error){
    let serverError=''
    try{const payload=await (result.error as {context?:{json?:()=>Promise<{error?:string}>}}).context?.json?.();serverError=payload?.error||''}catch{}
    throw Error(serverError||result.error.message)
   }
   const body=result.data as {answer?:string;error?:string}|null
   if(!body?.answer)throw Error(body?.error||'Бесплатный ИИ-сервис временно не ответил')
   setChat(items=>[...items,{role:'assistant' as const,content:body.answer!.slice(0,3500)}].slice(-12))
  }catch(e){setError((e instanceof Error?e.message:'ИИ временно недоступен')+'. Упражнения и проверка урока остаются доступными.')}
  finally{setAiBusy(false)}
 }
 const startMic=()=>{
  if(listening){stopListening.current?.();setListening(false);return}
  const stop=makeRecognition(text=>{setDraft(text.slice(0,800));setListening(false)},text=>{setError(text);setListening(false)},()=>setListening(false))
  if(stop){stopListening.current=stop;setListening(true)}
 }
 const allAnswered=lesson?readyToSubmit(guided,lesson.questions.length):false
 return <div className="english-portal" role="dialog" aria-modal="true" aria-label="Английский с Миро"><div className="english-shell">
  <header className="english-top"><div><small>🇬🇧 1º ESO · AI TUTOR</small><h2>Английский с Миро</h2></div><button type="button" onClick={()=>requestExit('close')} aria-label="Закрыть репетитора">✕</button></header>
  {error&&<p className="english-alert" role="alert">{error}</p>}
  {message&&<p className="english-good" role="status">{message}</p>}
  {!lesson&&<>
   <div className="english-hero"><h3>{isChild?'Hello, Илья! 👋':'Прогресс английского Ильи'}</h3><p>{isChild?'Разберём английский спокойно: по 15 минут в день, с объяснением каждой ошибки.':'Результаты реальных занятий, диагностика и темы для повторения.'}</p><div className="english-hero-stats"><span>📘 {LESSONS.length} тем</span><span>🎯 {completed.length} занятий</span><span>🏅 {totalAwards} баллов</span></div></div>
   {loading&&<p>Загружаем историю…</p>}
   {isChild&&<>
    <div className="english-notice"><strong>⏱️ 15 минут английского = +30 баллов</strong><span>Баллы начисляются сервером после 15 минут активной учёбы на открытом экране и разбора всех 30 вопросов. Если свернуть приложение, учебное время приостанавливается. Ошибки не лишают награды. За повтор того же урока в течение дня повторных баллов нет.</span></div>
    {!lastPlacement&&<button type="button" className="english-diagnostic" disabled={busy} onClick={()=>void begin(DIAGNOSTIC)}>🎯 Начать диагностику · 18 вопросов <span>Без таймера и баллов</span></button>}
    {lastPlacement&&<div className="english-recommend"><strong>Диагностика: {lastPlacement.score}/{lastPlacement.total_questions}</strong><span>{percentage(lastPlacement.score??0,lastPlacement.total_questions)>=78?'Уверенное начало A1–A2':percentage(lastPlacement.score??0,lastPlacement.total_questions)>=50?'Уровень A1, есть темы для повторения':'Начнём с основных конструкций уровня A1'}. Рекомендуем: <b>{analysis.next.title}</b>.</span><button type="button" disabled={busy} onClick={()=>void begin(DIAGNOSTIC)}>Пройти диагностику ещё раз</button></div>}
   </>}
   {!isChild&&<div className="english-recommend"><strong>Родительский отчёт</strong><span>Обучение строится на ответах Ильи: отмечены ошибки, дата, длительность и баллы. Содержание разговоров с ИИ не сохраняется в отчёте.</span>{analysis.weak.length>0&&<p>Повторить: {analysis.weak.map(id=>LESSONS.find(l=>l.id===id)?.title||id).join(', ')}</p>}</div>}
   {isChild&&pendingLegacy.length>0&&<div className="english-recommend"><strong>Есть урок прежней версии, который ты начал сегодня</strong>{pendingLegacy.map(row=>{const previous=LEGACY_LESSONS.find(l=>l.id===row.lesson_key);return previous&&<button type="button" key={row.id} onClick={()=>void begin(previous)}>Продолжить прежний урок: {previous.title} (6 вопросов)</button>})}</div>}
   <h3 className="english-heading">📚 {isChild?'Выбери урок':'Темы обучения'}</h3>
   <div className="english-lessons">{LESSONS.map((item,i)=>{
    const rows=completed.filter(s=>s.lesson_key===item.id||s.lesson_key===item.id.replace('eng2:','')),last=rows[0],pending=history.some(s=>s.lesson_key===item.id&&s.status==='in_progress')
    return <article className="english-lesson" key={item.id}><div className="english-lesson-number">{String(i+1).padStart(2,'0')}</div><div><strong>{item.title}</strong><small>{item.level}</small><p>{item.intro}</p>{last&&<em>Последний результат: {last.score}/{last.total_questions} · {last.points_awarded?'+30 баллов':'повторение'}</em>}</div>{isChild&&<button type="button" disabled={busy} onClick={()=>void begin(item)}>{pending?'Продолжить':last?'Повторить':'Начать'}</button>}</article>
   })}</div>
   {completed.length>0&&<section className="english-history"><h3>📈 История занятий</h3>{completed.slice(0,15).map(s=><div key={s.id}><span>{findEnglishLesson(s.lesson_key)?.title||s.lesson_key}</span><small>{new Date(s.started_at).toLocaleDateString('ru-RU',{timeZone:'Europe/Madrid'})}</small><b>{s.score}/{s.total_questions}</b><strong>{s.points_awarded?'+30 🏅':'—'}</strong></div>)}</section>}
  </>}
  {lesson&&session&&<>
   <div className="english-session-top"><button type="button" onClick={()=>requestExit('list')}>← К темам</button><div><strong>{lesson.title}</strong><small>{lesson.level}</small></div><span className={secondsLeft===0?'english-clock ready':'english-clock'}>{lesson.id==='diagnostic'?'Диагностика':`⏱ ${mmss(secondsLeft)}`}</span></div>
   {!outcome&&<>
    <section className="english-rule"><strong>📖 Правило</strong><p>{lesson.rule}</p>{lesson.examples.map((x,i)=><div key={i}><span>{x}</span><button type="button" onClick={()=>pronounce(x.split(' — ')[0])} aria-label={`Прослушать пример ${i+1}`}>🔊</button></div>)}</section>
    <GuidedQuiz lesson={lesson} sessionId={session.id} progress={guided} index={index} onChoose={answer} onBack={()=>setIndex(i=>i-1)} onNext={()=>setIndex(i=>i+1)} onFinish={()=>void finish()} secondsLeft={secondsLeft} busy={busy} diagnostic={lesson.id==='diagnostic'} finishLabel={lesson.id==='diagnostic'?'Узнать свой уровень':'Завершить урок и получить 30 баллов'} teacherRequest={prompt=>{setChatOpen(true);void askAI(prompt)}}/>
    {lesson.id!=='diagnostic'&&secondsLeft>0&&<p className="english-study-tip">Оставшееся время посвяти примерам, произношению и разговору с Миро. Только время на открытом уроке засчитывается в 15 минут. При сворачивании приложения счётчик приостанавливается; сервер проверяет время перед начислением баллов.</p>}
   </>}
   {outcome&&<section className="english-results"><div className="english-results-hero"><span>🎓</span><h3>{outcome.score}/{outcome.total} правильных ответов</h3><p>{outcome.points_awarded===30?'+30 баллов за 15-минутное занятие!':lesson.id==='diagnostic'?'Это стартовая проверка. Выбери урок для тренировки.':'Повторение помогает закрепить правила.'}</p></div><h4>Разбор ответов</h4>{lesson.questions.map((q,i)=>{const good=outcome.answers[i]===outcome.correct_answers[i];return <div key={i} className={'english-review '+(good?'correct':'incorrect')}><strong>{good?'✓':'↗'} {q.prompt}</strong><p>Твой ответ: {q.options[outcome.answers[i]]}</p>{!good&&<p>Правильно: <b>{q.options[outcome.correct_answers[i]]}</b></p>}<small>{q.explain}</small></div>})}<button type="button" className="english-start-again" onClick={backToList}>К следующему уроку →</button></section>}
   <section className="english-ai"><div className="english-ai-heading"><div><h3>🤖 Спроси Миро</h3><p>Практика разговора на английском с объяснениями на русском</p></div><button type="button" onClick={()=>setChatOpen(v=>!v)}>{chatOpen?'Свернуть':'Открыть'}</button></div>{chatOpen&&<><div className="english-ai-prompts"><button type="button" onClick={()=>void askAI('Потренируй со мной '+lesson.title+'. Задавай по одному вопросу на английском.')}>Поговорим на английском</button><button type="button" onClick={()=>void askAI('Объясни мне правило '+lesson.title+' простыми словами и приведи два новых примера.')}>Объясни ещё раз</button></div><div className="english-chat-log" role="log">{chat.length?chat.map((m,i)=><div key={i} className={'english-chat-msg '+m.role}>{m.content}{m.role==='assistant'&&<button type="button" onClick={()=>pronounce(m.content)}>🔊 Прочитать</button>}</div>):<p>Напиши фразу или нажми микрофон. Миро поможет с грамматикой, словарём и произношением.</p>}</div><form className="english-chat-input" onSubmit={e=>{e.preventDefault();void askAI()}}><input aria-label="Вопрос репетитору" maxLength={800} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Напиши предложение или ответ…"/><button type="button" onClick={startMic} aria-label="Диктовать английскую фразу" title="Микрофон">{listening?'⏹':'🎙️'}</button><button type="submit" disabled={!draft.trim()||aiBusy}>{aiBusy?'…':'Отправить'}</button></form><small>Сообщения отправляются внешнему бесплатному ИИ-сервису. Не сообщай адрес, телефон или другие личные данные. Переписка не сохраняется в родительском отчёте.</small></>}</section>
  </>}
  {leaveAction&&lesson&&<LeaveLessonWarning lesson={lesson} secondsLeft={secondsLeft} progress={guided} onStay={()=>setLeaveAction(null)} onLeave={confirmLeave}/>}
  <footer className="english-footer">Восемь полноценных тем по 30 упражнений, отдельная диагностика и разбор ошибок. Баллы начисляются на сервере и сохраняются в семейном журнале.</footer>
 </div></div>
}
