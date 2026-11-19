import {useCallback,useEffect,useMemo,useState} from 'react'
import {supabase} from '../lib/supabase'
import {checkPracticeAnswer,getPracticeBank,practiceCount,shufflePractice,allPractice} from './practiceBank'
import type {MainSubject,PracticeItem,PracticeChapter} from './practiceBank'
import './PracticeTrainer.css'
export type PracticeAttempt={id:string;family_id:string;child_id:string;subject:MainSubject;chapter:string;level:'mixed'|'1'|'2'|'3';score:number;total:number;completed_at:string;attempted_ids:string[];wrong_ids:string[];duration_seconds:number}
type Activity={attemptId:string;chapter:string;level:'mixed'|'1'|'2'|'3';startedAt:number;ids:string[];index:number;firstCorrectIds:string[];wrongIds:string[];completedIds:string[]}
const chaptersBySubject=(subject:MainSubject)=>getPracticeBank(subject)
const keyFor=(childId:string,subject:MainSubject)=>`moymir-practice-v1:${encodeURIComponent(childId)}:${subject}`
const draftKeyFor=(childId:string,subject:MainSubject)=>`moymir-practice-draft-v1:${encodeURIComponent(childId)}:${subject}`
const pendingKeyFor=(childId:string,subject:MainSubject)=>`moymir-practice-pending-v1:${encodeURIComponent(childId)}:${subject}`
function getStored(key:string):PracticeAttempt[]{try{const data=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(data)?data.slice(0,120):[]}catch{return []}}
function getDraft(key:string):Activity|null{try{const x=JSON.parse(localStorage.getItem(key)||'null');return x&&Array.isArray(x.ids)&&x.ids.length>0&&x.ids.length<=12&&x.ids.every((id:unknown)=>typeof id==='string')?x:null}catch{return null}}
function saveStorage(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
function newId(){
 const webCrypto=typeof crypto!=='undefined'?crypto:undefined
 if(webCrypto&&typeof webCrypto.randomUUID==='function')return webCrypto.randomUUID()
 if(webCrypto&&typeof webCrypto.getRandomValues==='function'){
  const bytes=webCrypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128
  return [...bytes].map((n,i)=>n.toString(16).padStart(2,'0')+([3,5,7,9].includes(i)?'-':'')).join('')
 }
 throw Error('На этом устройстве недоступно безопасное создание идентификатора занятия')
}
function uniqueAttempts(local:PracticeAttempt[],remote:PracticeAttempt[]){const map=new Map<string,PracticeAttempt>();for(const a of [...remote,...local])map.set(a.id,a);return [...map.values()].sort((a,b)=>b.completed_at.localeCompare(a.completed_at)).slice(0,120)}

export function PracticeTrainer({subject,childId,familyId,readonly}:{subject:MainSubject;childId:string;familyId:string;readonly:boolean}){
 const chapters=useMemo(()=>chaptersBySubject(subject),[subject]);const bank=useMemo(()=>allPractice(subject),[subject]);const byId=useMemo(()=>new Map(bank.map(q=>[q.id,q])),[bank])
 const historyKey=keyFor(childId,subject),draftKey=draftKeyFor(childId,subject),pendingKey=pendingKeyFor(childId,subject)
 const [history,setHistory]=useState<PracticeAttempt[]>(()=>getStored(historyKey)),[active,setActive]=useState<Activity|null>(()=>readonly?null:getDraft(draftKey))
 const [difficulty,setDifficulty]=useState<'mixed'|'1'|'2'|'3'>('mixed')
 const [input,setInput]=useState(''),[attempts,setAttempts]=useState(0),[checked,setChecked]=useState(false),[correct,setCorrect]=useState(false)
 const [feedback,setFeedback]=useState(''),[finished,setFinished]=useState<PracticeAttempt|null>(null),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
 const question=active?byId.get(active.ids[active.index]):undefined
 const completedCount=history.reduce((s,a)=>s+a.total,0)
 const knownIds=new Set(history.flatMap(a=>a.attempted_ids))
 const wrongs=new Map<string,number>();for(const attempt of history)for(const id of attempt.wrong_ids)wrongs.set(id,(wrongs.get(id)||0)+1)
 const weak=[...wrongs].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([id])=>byId.get(id)).filter((x):x is PracticeItem=>!!x)
 const topicStats=chapters.map(ch=>{const seen=ch.items.filter(q=>knownIds.has(q.id)).length;const incorrect=ch.items.reduce((sum,q)=>sum+(wrongs.get(q.id)||0),0);return {chapter:ch,seen,incorrect}})
 const accuracy=history.reduce((s,a)=>s+a.score,0),total=history.reduce((s,a)=>s+a.total,0)
 const syncPending=useCallback(async()=>{
  if(!familyId||!childId||readonly)return
  const queue=getStored(pendingKey)
  if(!queue.length)return
  const remaining:PracticeAttempt[]=[]
  for(const row of queue){
   const result=await supabase.from('moymir_subject_practice_attempts').insert(row)
   if(result.error&&result.error.code!=='23505')remaining.push(row)
  }
  saveStorage(pendingKey,remaining)
  if(remaining.length)setMessage('Есть результаты, ожидающие отправки в семейную базу.')
 },[familyId,childId,pendingKey,readonly])
 const loadHistory=useCallback(async()=>{
  if(!familyId||!childId)return
  if(!readonly)await syncPending()
  const res=await supabase.from('moymir_subject_practice_attempts').select('id,family_id,child_id,subject,chapter,level,score,total,completed_at,attempted_ids,wrong_ids,duration_seconds')
   .eq('family_id',familyId).eq('child_id',childId).eq('subject',subject).order('completed_at',{ascending:false}).limit(120)
  if(res.error)throw res.error
  setHistory(prev=>{const merged=uniqueAttempts(prev,res.data as PracticeAttempt[]||[]);saveStorage(historyKey,merged);return merged})
 },[familyId,childId,subject,historyKey,readonly,syncPending])
 useEffect(()=>{let mounted=true;void loadHistory().catch(()=>{if(mounted)setMessage('Нет сети. Доступны результаты, сохранённые на этом телефоне.')});return()=>{mounted=false}},[loadHistory])
 useEffect(()=>{if(readonly)return;saveStorage(draftKey,active);},[active,draftKey,readonly])
 useEffect(()=>{if(!familyId||!childId||readonly)return;const onOnline=()=>{void loadHistory()};window.addEventListener('online',onOnline);return()=>window.removeEventListener('online',onOnline)},[familyId,childId,readonly,loadHistory])
 async function publish(a:PracticeAttempt){
  const queue=[a,...getStored(pendingKey).filter(x=>x.id!==a.id)]
  saveStorage(pendingKey,queue)
  if(!familyId||!childId){setMessage('Результат сохранён на телефоне. Для семейной синхронизации нужен вход.');return}
  setBusy(true)
  await syncPending()
  setMessage(getStored(pendingKey).length?'Результат сохранён. Отправим родителю, когда появится интернет.':'Результат записан в семейную базу и доступен родителю.')
  setBusy(false)
 }
 const start=(chapter:PracticeChapter,mode:'new'|'mistakes'='new')=>{
  if(readonly)return
  const eligible=chapter.items.filter(item=>difficulty==='mixed'||String(item.level)===difficulty)
  const questions=mode==='mistakes'?eligible.filter(x=>wrongs.has(x.id)):eligible
  if(!questions.length){setMessage('Для этого уровня пока нет заданий. Выбери «Все уровни».');return}
  const unseen=questions.filter(item=>!knownIds.has(item.id));const previously=questions.filter(item=>knownIds.has(item.id))
  const id=newId(),candidates=[...shufflePractice(unseen,id),...shufflePractice(previously,id+'-repeat')]
  const chosen=candidates.slice(0,Math.min(12,questions.length)).map(x=>x.id)
  if(!chosen.length)return
  setActive({attemptId:id,chapter:chapter.id,level:difficulty,startedAt:Date.now(),ids:chosen,index:0,firstCorrectIds:[],wrongIds:[],completedIds:[]})
  setInput('');setAttempts(0);setChecked(false);setCorrect(false);setFeedback('');setFinished(null);setMessage('')
 }
 const validate=()=>{
  if(!active||!question||checked||!input.trim())return
  const pass=checkPracticeAnswer(question,input),tries=attempts+1
  setAttempts(tries)
  if(pass){setCorrect(true);setChecked(true);setFeedback('✓ Верно! '+question.explanation)}
  else if(tries>=2){setCorrect(false);setChecked(true);setFeedback(`Ответ: ${question.answer.replaceAll('|',' или ')}. ${question.explanation}`)}
  else setFeedback('Пока неверно. Проверь правило и попробуй ещё раз; после второй попытки появится объяснение.')
 }
 const skip=()=>{if(!active||!question||checked)return;setCorrect(false);setChecked(true);setFeedback(`Ответ: ${question.answer.replaceAll('|',' или ')}. ${question.explanation}`)}
 const next=()=>{
  if(!active||!question||!checked)return
  const firstCorrect=correct&&attempts===1
  const updated:Activity={...active,firstCorrectIds:firstCorrect?[...active.firstCorrectIds,question.id]:active.firstCorrectIds,
   wrongIds:firstCorrect?active.wrongIds:[...active.wrongIds,question.id],completedIds:[...active.completedIds,question.id]}
  setInput('');setAttempts(0);setChecked(false);setCorrect(false);setFeedback('')
  if(updated.index+1<updated.ids.length){setActive({...updated,index:updated.index+1});return}
  const row:PracticeAttempt={id:updated.attemptId,family_id:familyId,child_id:childId,subject,chapter:updated.chapter,level:updated.level,score:updated.firstCorrectIds.length,total:updated.ids.length,completed_at:new Date().toISOString(),attempted_ids:updated.ids,wrong_ids:updated.wrongIds,duration_seconds:Math.max(0,Math.min(7200,Math.floor((Date.now()-updated.startedAt)/1000)))}
  const merged=uniqueAttempts([row],history)
  setHistory(merged);saveStorage(historyKey,merged);setFinished(row);setActive(null);saveStorage(draftKey,null)
  void publish(row)
 }
 const reset=()=>{setActive(null);setFinished(null);setInput('');setFeedback('');setChecked(false);setAttempts(0);saveStorage(draftKey,null)}
 return <section className="practice-section" aria-label="Большой тренажёр без подсказок">
  <div className="practice-heading"><div><strong>✍️ Большой тренажёр</strong><p>Напиши ответ самостоятельно. Без кнопок A/B/C, с объяснением после проверки.</p></div><span>{practiceCount(subject)} упражнений</span></div>
  <div className="practice-stats"><span>Изучено: <b>{knownIds.size}/{practiceCount(subject)}</b></span><span>Решено: <b>{completedCount}</b></span><span>Точность: <b>{total?Math.round(100*accuracy/total):0}%</b></span></div>
  {message&&<p className="practice-message" role="status">{message}</p>}
  {finished&&<div className="practice-finish" role="status"><h4>Занятие завершено: {finished.score}/{finished.total} с первого раза</h4><p>{finished.wrong_ids.length?`Ошибок и затруднений: ${finished.wrong_ids.length}. Их можно повторить в следующих занятиях.`:'Все задачи решены правильно с первой попытки.'} Это дополнительная тренировка без начисления баллов. За баллами переходи к основным 15-минутным урокам.</p><button type="button" onClick={reset}>К темам</button></div>}
  {active&&question&&!finished&&!readonly&&<div className="practice-task"><div className="practice-task-header"><strong>Задание {active.index+1} из {active.ids.length}</strong><span>{question.level===1?'Начальный':question.level===2?'Средний':'Сложный'} уровень</span></div><div className="practice-task-progress"><span style={{width:`${100*active.index/active.ids.length}%`}}/></div><h4>{question.prompt}</h4><label htmlFor={'practice-answer-'+subject}>Твой ответ</label><form onSubmit={e=>{e.preventDefault();if(!checked)validate();else next()}}><input id={'practice-answer-'+subject} autoComplete="off" autoCorrect="off" spellCheck={false} value={input} onChange={e=>{setInput(e.target.value.slice(0,120));if(!checked)setFeedback('')}} disabled={checked} placeholder="Напиши ответ…"/><button type="submit" disabled={busy||(!checked&&!input.trim())}>{checked?(active.index+1===active.ids.length?'Завершить':'Следующее →'):'Проверить'}</button></form>{!checked&&<button type="button" className="practice-skip" onClick={skip}>Не знаю — показать объяснение</button>}{feedback&&<p className={checked&&correct?'practice-correct':checked?'practice-wrong':'practice-hint'} role="status">{feedback}</p>}<small>Если вводишь число, единицы измерения указывать необязательно. В числах можно использовать точку или запятую.</small><button type="button" className="practice-exit" onClick={reset}>Отложить упражнение</button></div>}
  {!active&&!finished&&<><div className="practice-level"><label htmlFor={'practice-level-'+subject}>Сложность:</label><select id={'practice-level-'+subject} disabled={readonly} value={difficulty} onChange={e=>setDifficulty(e.target.value as typeof difficulty)}><option value="mixed">Все уровни</option><option value="1">Начальный</option><option value="2">Средний</option><option value="3">Сложный</option></select></div><div className="practice-chapters">{topicStats.map(({chapter,seen,incorrect})=><div className="practice-chapter" key={chapter.id}><div><strong>{chapter.title}</strong><small>{chapter.description}</small><p>Пройдено {seen}/32 · ошибок {incorrect}</p></div>{!readonly&&<button type="button" onClick={()=>start(chapter)} aria-label={'Практика '+chapter.title}>Начать →</button>}</div>)}</div>
   {weak.length>0&&<div className="practice-weak"><strong>📌 Что стоит повторить</strong><p>{weak.slice(0,4).map(item=>item.topic).filter((id,i,a)=>a.indexOf(id)===i).map(id=>chapters.find(ch=>ch.id===id)?.title||id).join(', ')}</p>{!readonly&&<button type="button" onClick={()=>{const ch=chapters.find(ch=>ch.id===weak[0].topic);if(ch)start(ch,'mistakes')}}>Повторить задания с ошибками</button>}</div>}
   {readonly&&<p className="practice-parent-note">В родительском аккаунте отображаются результаты Ильи по темам. Запускать занятия и отвечать за ребёнка здесь нельзя.</p>}
  </>}
  <p className="practice-disclaimer">Практика дополняет школьные уроки 1º ESO и помогает исправлять ошибки. Баллы начисляются только за основные занятия, проверяемые сервером. Результаты тренажёра нельзя обменять на баллы.</p>
 </section>
}
