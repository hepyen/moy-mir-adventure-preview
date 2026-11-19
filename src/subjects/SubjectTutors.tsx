import {useCallback,useEffect,useMemo,useRef,useState} from 'react'
import {supabase} from '../lib/supabase'
import type {useFamilyCloud} from '../lib/useFamilyCloud'
import {shuffledEnglishChoices} from '../english/lessons'
import type {EnglishLesson} from '../english/lessons'
import {SUBJECTS,getSubjectLesson} from './subjects'
import type {SubjectSpec} from './subjects'
import './SubjectTutors.css'
import '../english/EnglishTutor.css'

type Cloud=ReturnType<typeof useFamilyCloud>
type Session={id:string;started_at:string;lesson_key:string}
type Attempt={id:string;lesson_key:string;started_at:string;finished_at:string|null;score:number|null;total_questions:number;status:'in_progress'|'completed';points_awarded:number;answers:number[]|null}
type Result={score:number;total:number;points_awarded:number;correct_answers:number[];answers:number[]}
type Message={role:'user'|'assistant';content:string}
const timeFmt=(n:number)=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')
const pct=(n:number,t:number)=>t?Math.round(n/t*100):0
function speak(text:string,locale:string){if(!window.speechSynthesis)return false;try{window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang=locale;u.rate=.84;window.speechSynthesis.speak(u);return true}catch{return false}}
function startVoice(locale:string,onText:(s:string)=>void,onEnd:()=>void,onError:(s:string)=>void){
 type Rec={lang:string;interimResults:boolean;maxAlternatives:number;onresult:((e:{results:ArrayLike<ArrayLike<{transcript:string}>>})=>void)|null;onend:(()=>void)|null;onerror:((e:{error:string})=>void)|null;start:()=>void;stop:()=>void}
 type Constructor=new()=>Rec
 const w=window as typeof window&{SpeechRecognition?:Constructor;webkitSpeechRecognition?:Constructor},Ctor=w.SpeechRecognition||w.webkitSpeechRecognition
 if(!Ctor){onError('На этом телефоне распознавание речи недоступно. Можно печатать ответы.');return null}
 try{const r=new Ctor();r.lang=locale;r.interimResults=false;r.maxAlternatives=1;r.onresult=e=>onText(e.results[0]?.[0]?.transcript||'');r.onend=onEnd;r.onerror=e=>onError(e.error==='not-allowed'?'Разреши микрофон в настройках телефона.':'Не удалось распознать голос. Попробуй написать ответ.');r.start();return ()=>r.stop()}
 catch{onError('Не получилось включить микрофон. Напиши ответ.');return null}
}
function subjectWeakness(subject:SubjectSpec,history:Attempt[]){
 const wrong=new Map<string,number>()
 for(const row of history.filter(r=>r.status==='completed').slice(0,45)){
  const l=getSubjectLesson(row.lesson_key)
  if(!l||!Array.isArray(row.answers))continue
  row.answers.forEach((answer,i)=>{if(l.questions[i]&&answer!==l.questions[i].correct){const key=l.questions[i].topic;wrong.set(key,(wrong.get(key)||0)+1)}})
 }
 const weak=[...wrong.entries()].sort((a,b)=>b[1]-a[1]).map(([id])=>id)
 const completedKeys=new Set(history.filter(x=>x.status==='completed').map(x=>x.lesson_key))
 const next=subject.lessons.find(x=>weak.some(id=>id===x.id)&&!completedKeys.has(x.id))||subject.lessons.find(x=>!completedKeys.has(x.id))||subject.lessons.find(x=>weak.includes(x.id))||subject.lessons[0]
 return {weak:weak.slice(0,3).map(id=>subject.lessons.find(x=>x.id===id)?.title).filter(Boolean),next}
}
export function SubjectTutorsEntry({cloud}:{cloud:Cloud}){
 const[selected,setSelected]=useState<SubjectSpec|null>(null)
 return <><details className="subjects-entry"><summary className="subjects-title"><div className="subjects-title-icon">🎓</div><div><small>ПРОГРАММА 1º ESO · АНДАЛУСИЯ</small><h3>Школьные репетиторы Миро</h3><p>Занятия по испанской программе: объяснения на русском, задания по-испански, французский и другие предметы.</p></div><span className="subjects-toggle" aria-hidden="true">9 предметов ▾</span></summary>
  <div className="subjects-grid">{SUBJECTS.map(subject=><button type="button" key={subject.id} onClick={()=>setSelected(subject)} aria-label={'Репетитор '+subject.name}><span className="subjects-emoji">{subject.emoji}</span><strong>{subject.name}</strong><small>{subject.lessons.length} темы · +30 баллов за 15 минут</small></button>)}</div>
  <p className="subjects-note">Темы соответствуют базовым разделам 1º ESO Андалусии. Последовательность школьного учебника может отличаться. Географический экзаменационный тренажёр остаётся отдельным.</p>
 </details>{selected&&<SubjectTutor key={selected.id} subject={selected} cloud={cloud} onClose={()=>setSelected(null)}/>}</>
}
function SubjectTutor({subject,cloud,onClose}:{subject:SubjectSpec;cloud:Cloud;onClose:()=>void}){
 const child=cloud.role==='child'
 const keys=useMemo(()=>[subject.diagnostic.id,...subject.lessons.map(l=>l.id)],[subject])
 const[history,setHistory]=useState<Attempt[]>([]),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false)
 const[error,setError]=useState(''),[notice,setNotice]=useState('')
 const[lesson,setLesson]=useState<EnglishLesson|null>(null),[session,setSession]=useState<Session|null>(null),[index,setIndex]=useState(0)
 const[answers,setAnswers]=useState<(number|null)[]>([]),[result,setResult]=useState<Result|null>(null),[now,setNow]=useState(Date.now())
 const[aiOpen,setAiOpen]=useState(false),[aiBusy,setAiBusy]=useState(false),[draft,setDraft]=useState(''),[messages,setMessages]=useState<Message[]>([]),[voiceBusy,setVoiceBusy]=useState(false)
 const voiceStop=useRef<(()=>void)|null>(null)
 const completed=history.filter(x=>x.status==='completed'),totalAwards=completed.reduce((n,x)=>n+x.points_awarded,0)
 const diagnostic=completed.find(x=>x.lesson_key===subject.diagnostic.id)
 const analysis=useMemo(()=>subjectWeakness(subject,history),[subject,history])
 const secondsLeft=session&&lesson?.id!==subject.diagnostic.id?Math.max(0,Math.ceil((Date.parse(session.started_at)+900000-now)/1000)):0
 const updateHistory=useCallback(async()=>{
  if(!cloud.childId||!cloud.familyId)return
  const {data,error:e}=await supabase.from('moymir_english_sessions').select('id,lesson_key,started_at,finished_at,score,total_questions,status,points_awarded,answers').eq('family_id',cloud.familyId).eq('child_id',cloud.childId).in('lesson_key',keys).order('started_at',{ascending:false}).limit(120)
  if(e)throw e
  setHistory((data||[]) as Attempt[])
 },[cloud.familyId,cloud.childId,keys])
 useEffect(()=>{let active=true;void updateHistory().catch(e=>{if(active)setError(e instanceof Error?e.message:'Не удалось загрузить историю')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[updateHistory])
 useEffect(()=>{if(!session||result)return;const tick=()=>setNow(Date.now());tick();const timer=window.setInterval(tick,1000);return()=>clearInterval(timer)},[session?.id,result])
 useEffect(()=>()=>{voiceStop.current?.();window.speechSynthesis?.cancel()},[])
 async function begin(l:EnglishLesson){
  if(!child||busy)return
  setBusy(true);setError('');setNotice('');setAiOpen(false);setMessages([])
  try{
   const {data,error:e}=await supabase.rpc('moymir_english_begin',{p_lesson:l.id});if(e)throw e
   if(!data?.id||!data?.started_at)throw Error('Сервер не открыл занятие')
   const next=data as Session
   setSession(next);setLesson(l);setNow(Date.now());setIndex(0);setResult(null)
   let draftAnswers:unknown=[];try{draftAnswers=JSON.parse(localStorage.getItem('moymir-subject-draft:'+next.id)||'[]')}catch{}
   const arr=Array.isArray(draftAnswers)?draftAnswers:[]
   setAnswers(Array.from({length:l.questions.length},(_,i)=>typeof arr[i]==='number'&&[0,1,2].includes(arr[i])?arr[i]:null))
  }catch(e){setError(e instanceof Error?e.message:'Не удалось начать урок')}finally{setBusy(false)}
 }
 function choose(option:number){if(!lesson||!session||result)return;const changed=Array.from({length:lesson.questions.length},(_,i)=>answers[i]??null);changed[index]=option;setAnswers(changed);try{localStorage.setItem('moymir-subject-draft:'+session.id,JSON.stringify(changed))}catch{}}
 async function finish(){
  if(!lesson||!session||busy||secondsLeft>0||answers.some(x=>x===null)||answers.length!==lesson.questions.length)return
  setBusy(true);setError('')
  try{
   const {data,error:e}=await supabase.rpc('moymir_english_finish',{p_session:session.id,p_answers:answers});if(e)throw e
   if(data?.status==='waiting'){setError('Сервер просит продолжить занятие ещё '+timeFmt(data.remaining_seconds??1));return}
   if(data?.status!=='completed'||!Array.isArray(data.correct_answers))throw Error('Нет подтверждения завершения урока')
   setResult({score:data.score,total:data.total,points_awarded:data.points_awarded,correct_answers:data.correct_answers,answers:answers as number[]})
   setNotice(data.points_awarded===30?'🎉 Урок завершён. Сервер начислил +30 баллов!':lesson.id.endsWith(':diagnostic')?'Диагностика завершена: теперь понятны темы для повторения.':'Урок завершён. Повторный бонус за ту же тему сегодня не начисляется.')
   try{localStorage.removeItem('moymir-subject-draft:'+session.id)}catch{}
   await Promise.all([updateHistory(),cloud.refresh()])
  }catch(e){setError('Не удалось сохранить результат. Проверь интернет. '+(e instanceof Error?e.message:''))}finally{setBusy(false)}
 }
 function goBack(){setLesson(null);setSession(null);setIndex(0);setAnswers([]);setResult(null);setAiOpen(false);setMessages([]);setError('');setNotice('')}
 async function askAI(sample?:string){
  const text=(sample??draft).trim().slice(0,800);if(!text||aiBusy)return
  setAiBusy(true);setError('');setDraft('')
  const next=[...messages,{role:'user' as const,content:text}].slice(-8);setMessages(next)
  try{
   const context=`Ты Миро, учебный помощник для ребёнка 1º ESO в Андалусии. Предмет: ${subject.name}. Тема: ${lesson?.title||''}. Объяснение: ${lesson?.rule||''}. На русском объясняй понятия, употребляй оригинальные испанские названия${subject.id==='frances'?' и французские фразы':''}. Задавай один учебный вопрос за раз, давай подсказки вместо готового домашнего задания, исправляй ошибки с объяснением. Не проси личных сведений. Не притворяйся человеком.`
   const {data,error:e}=await supabase.functions.invoke('moymir2-miro-ai',{body:{messages:[{role:'user',content:context},...next]}})
   if(e)throw e
   const reply=(data as {answer?:string;error?:string}|null)?.answer
   if(!reply)throw Error((data as {error?:string}|null)?.error||'ИИ пока недоступен')
   setMessages(items=>[...items,{role:'assistant' as const,content:reply.slice(0,3500)}].slice(-12))
  }catch(e){setError((e instanceof Error?e.message:'Внешний ИИ не отвечает')+'. Уроки и оценивание продолжат работать без ИИ.')}finally{setAiBusy(false)}
 }
 function dictate(){if(voiceBusy){voiceStop.current?.();setVoiceBusy(false);return}const stop=startVoice(subject.language,text=>{setDraft(text.slice(0,800));setVoiceBusy(false)},()=>setVoiceBusy(false),text=>{setError(text);setVoiceBusy(false)});if(stop){voiceStop.current=stop;setVoiceBusy(true)}}
 const q=lesson?.questions[index],order=q&&session?shuffledEnglishChoices(q,session.id,index):[0,1,2]
 const complete=lesson&&answers.length===lesson.questions.length&&answers.every(x=>x!==null)
 const aiPanel=(<section className="english-ai"><div className="english-ai-heading"><div><h3>🤖 Спроси Миро</h3><p>Попроси объяснить правило или решить похожий пример по шагам.</p></div><button type="button" onClick={()=>setAiOpen(v=>!v)}>{aiOpen?'Скрыть':'Открыть'}</button></div>{aiOpen&&<><div className="english-ai-prompts"><button type="button" onClick={()=>void askAI('Объясни тему «'+(lesson?.title||subject.name)+'» простыми словами и задай мне один вопрос.')}>Объясни ещё раз</button><button type="button" onClick={()=>void askAI('Дай похожую задачу по теме «'+(lesson?.title||subject.name)+'» без подсказки ответа.')}>Потренируемся</button></div><div className="english-chat-log" role="log">{messages.length?messages.map((m,i)=><div key={i} className={'english-chat-msg '+m.role}>{m.content}{m.role==='assistant'&&<button type="button" onClick={()=>speak(m.content,'ru-RU')}>🔊 Прочитать</button>}</div>):<p>Задай вопрос на русском или по-испански. Миро поможет разобраться.</p>}</div><form className="english-chat-input" onSubmit={e=>{e.preventDefault();void askAI()}}><input aria-label="Вопрос репетитору" value={draft} maxLength={800} onChange={e=>setDraft(e.target.value)} placeholder="Напиши вопрос или ответ…"/><button type="button" aria-label="Голосовой ввод" onClick={dictate}>{voiceBusy?'⏹':'🎙️'}</button><button type="submit" disabled={!draft.trim()||aiBusy}>{aiBusy?'…':'Отправить'}</button></form><small>Сообщения передаются внешнему бесплатному ИИ, поэтому не вводи персональные данные. Если сервис недоступен, основные упражнения продолжат работать.</small></>}</section>)
 return <div className="english-portal" role="dialog" aria-modal="true" aria-label={'Репетитор '+subject.name}><div className="english-shell subjects-shell">
  <header className="english-top"><div><small>{subject.emoji} 1º ESO · REPASO</small><h2>{subject.name}</h2></div><button type="button" aria-label="Закрыть предмет" onClick={onClose}>✕</button></header>
  {error&&<p className="english-alert" role="alert">{error}</p>}{notice&&<p className="english-good" role="status">{notice}</p>}
  {!lesson&&<>
   <div className="english-hero subjects-hero"><h3>{child?'Учимся с Миро!':'Успехи Ильи'}</h3><p>{subject.description} Тексты и задания соответствуют базовым темам 1º ESO, объяснения доступны на русском.</p><div className="english-hero-stats"><span>📘 {subject.lessons.length} темы</span><span>✓ {completed.length} занятий</span><span>🏅 {totalAwards} баллов</span></div></div>
   {loading&&<p>Загружаем результаты…</p>}
   {child&&<><div className="english-notice"><strong>15 минут занятий = 30 баллов</strong><span>Реши все шесть вопросов учебного урока. Баллы не зависят от оценки. За повторение той же темы в один день повторных баллов нет.</span></div>
    {!diagnostic?<button type="button" className="english-diagnostic" disabled={busy} onClick={()=>void begin(subject.diagnostic)}>🎯 Пройти диагностику <span>{subject.diagnostic.questions.length} вопросов · без баллов</span></button>:<div className="english-recommend"><strong>Диагностика: {diagnostic.score}/{diagnostic.total_questions} ({pct(diagnostic.score||0,diagnostic.total_questions)}%)</strong><span>Следующее занятие: <b>{analysis.next.title}</b>.</span><button type="button" onClick={()=>void begin(subject.diagnostic)} disabled={busy}>Повторить диагностику</button></div>}</>}
   {!child&&<div className="english-recommend"><strong>Отчёт для родителя</strong><span>Здесь сохраняются результаты занятий, трудные темы и реальные начисления. Содержание переписки с ИИ не сохраняется.</span>{analysis.weak.length>0&&<p>Рекомендуем повторить: {analysis.weak.join(', ')}</p>}</div>}
   <h3 className="english-heading">{child?'📖 Выбери тему':'📊 Темы и результаты'}</h3>
   <div className="english-lessons">{subject.lessons.map((l,i)=>{const last=completed.find(x=>x.lesson_key===l.id);return <article className="english-lesson" key={l.id}><div className="english-lesson-number">{i+1}</div><div><strong>{l.title}</strong><small>{l.level}</small><p>{l.intro}</p>{last&&<em>Последний результат: {last.score}/{last.total_questions} · {last.points_awarded?'+30 баллов':'повторение'}</em>}</div>{child&&<button type="button" disabled={busy} onClick={()=>void begin(l)}>{last?'Повторить':'Начать'}</button>}</article>})}</div>
   {completed.length>0&&<section className="english-history"><h3>📈 История занятий</h3>{completed.slice(0,20).map(s=><div key={s.id}><span>{getSubjectLesson(s.lesson_key)?.title||s.lesson_key}</span><small>{new Date(s.started_at).toLocaleDateString('ru-RU',{timeZone:'Europe/Madrid'})}</small><b>{s.score}/{s.total_questions}</b><strong>{s.points_awarded?'+30 🏅':'—'}</strong></div>)}</section>}
   {child&&aiPanel}
  </>}
  {lesson&&session&&<>
   <div className="english-session-top"><button type="button" onClick={goBack}>← Темы</button><div><strong>{lesson.title}</strong><small>{subject.short}</small></div><span className={'english-clock '+(secondsLeft===0?'ready':'')}>{lesson.id.endsWith(':diagnostic')?'Диагностика':'⏱ '+timeFmt(secondsLeft)}</span></div>
   {!result&&<><section className="english-rule"><strong>📖 Разбираем тему</strong><p>{lesson.rule}</p>{lesson.examples.map((example,i)=><div key={i}><span>{example}</span><button type="button" onClick={()=>speak(example.split(' — ')[0],subject.language)} aria-label={'Прослушать пример '+(i+1)}>🔊</button></div>)}</section>
    <section className="english-quiz"><div className="english-quiz-meta"><strong>Вопрос {index+1} из {lesson.questions.length}</strong><span>Ответов: {answers.filter(a=>a!==null).length}/{lesson.questions.length}</span></div><div className="english-progress"><span style={{width:Math.round(answers.filter(a=>a!==null).length/lesson.questions.length*100)+'%'}}/></div><h3>{q?.prompt}</h3><div className="english-options">{order.map((canonical,j)=><button type="button" key={canonical} aria-pressed={answers[index]===canonical} className={answers[index]===canonical?'active':''} onClick={()=>choose(canonical)}><span>{String.fromCharCode(65+j)}</span>{q?.options[canonical]}</button>)}</div><p className="english-hint">Сначала попробуй сам. После окончания Миро объяснит ошибки.</p><div className="english-quiz-nav"><button type="button" disabled={index===0} onClick={()=>setIndex(v=>v-1)}>← Назад</button>{index<lesson.questions.length-1?<button type="button" disabled={answers[index]===null} onClick={()=>setIndex(v=>v+1)}>Следующий →</button>:<button type="button" disabled={!complete||busy||secondsLeft>0} onClick={()=>void finish()}>{busy?'Проверяем…':secondsLeft>0?'Завершить через '+timeFmt(secondsLeft):lesson.id.endsWith(':diagnostic')?'Узнать результат':'Завершить урок (+30)'}</button>}</div></section>
    {secondsLeft>0&&<p className="english-study-tip">Чтобы получить баллы, изучай объяснения и потренируйся с Миро. Сервер отсчитывает время урока даже после переключения вкладок, но начисляет награду только после ответов.</p>}
   </>}
   {result&&<section className="english-results"><div className="english-results-hero"><span>🎓</span><h3>{result.score}/{result.total} правильных ответов</h3><p>{result.points_awarded===30?'+30 баллов за занятие!':lesson.id.endsWith(':diagnostic')?'Диагностика завершена, подготовим занятия.':'Урок сохранён. Можно повторить трудные вопросы.'}</p></div><h4>Разбор заданий</h4>{lesson.questions.map((question,i)=>{const good=result.answers[i]===result.correct_answers[i];return <div key={i} className={'english-review '+(good?'correct':'incorrect')}><strong>{good?'✓':'↗'} {question.prompt}</strong><p>Твой ответ: {question.options[result.answers[i]]}</p>{!good&&<p>Правильно: <b>{question.options[result.correct_answers[i]]}</b></p>}<small>{question.explain}</small></div>})}<button type="button" className="english-start-again" onClick={goBack}>К списку тем →</button></section>}
   {aiPanel}
  </>}
  <footer className="english-footer">{subject.curriculum} · Баллы за занятия подтверждаются сервером.</footer>
 </div></div>
}
