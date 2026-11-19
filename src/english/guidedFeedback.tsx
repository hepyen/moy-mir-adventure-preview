import type {EnglishQuestion,EnglishLesson} from './lessons'
import {shuffledEnglishChoices} from './lessons'
import {russianTeachingRule} from './teachingRulesRu'
import './guidedFeedback.css'
/** First answers are immutable once given. Corrections are taught, but do not inflate the grade. */
export type GuidedProgress={first:(number|null)[];last:(number|null)[];wrong:number[];mastered:boolean[]}
export const blankGuided=(count:number):GuidedProgress=>({first:Array(count).fill(null),last:Array(count).fill(null),wrong:Array(count).fill(0),mastered:Array(count).fill(false)})
const numberAnswer=(value:unknown):number|null=>typeof value==='number'&&[0,1,2].includes(value)?value:null
export function restoreGuided(raw:unknown,count:number):GuidedProgress{
 const initial=blankGuided(count)
 if(Array.isArray(raw)){
  // Legacy unfinished lesson before upgrade: keep its historical selected answers.
  raw.slice(0,count).forEach((value,i)=>{const n=numberAnswer(value);initial.first[i]=n;initial.last[i]=n;initial.mastered[i]=n!==null})
  return initial
 }
 if(!raw||typeof raw!=='object')return initial
 const data=raw as Partial<GuidedProgress>
 for(let i=0;i<count;i++){
  initial.first[i]=numberAnswer(data.first?.[i]);initial.last[i]=numberAnswer(data.last?.[i])
  initial.wrong[i]=Math.max(0,Math.min(2,Number.isInteger(data.wrong?.[i])?Number(data.wrong?.[i]):0))
  initial.mastered[i]=Boolean(data.mastered?.[i]&&initial.first[i]!==null)
 }
 return initial
}
export function recordGuidedChoice(state:GuidedProgress,index:number,choice:number,question:EnglishQuestion,diagnostic:boolean):GuidedProgress{
 if(index<0||index>=state.first.length||state.mastered[index]||![0,1,2].includes(choice))return state
 const copy:GuidedProgress={first:[...state.first],last:[...state.last],wrong:[...state.wrong],mastered:[...state.mastered]}
 if(copy.first[index]===null)copy.first[index]=choice
 copy.last[index]=choice
 if(diagnostic||choice===question.correct)copy.mastered[index]=true
 else{
  copy.wrong[index]=Math.min(2,copy.wrong[index]+1)
  if(copy.wrong[index]>=2)copy.mastered[index]=true
 }
 return copy
}
export const masteredCount=(state:GuidedProgress)=>state.mastered.filter(Boolean).length
export const readyToSubmit=(state:GuidedProgress,count:number)=>count>0&&state.mastered.length===count&&state.mastered.every(Boolean)&&state.first.every(x=>x!==null)
export function GuidedQuiz({lesson,sessionId,progress,index,onChoose,onBack,onNext,onFinish,busy,secondsLeft,diagnostic,finishLabel,teacherRequest}:{
 lesson:EnglishLesson;sessionId:string;progress:GuidedProgress;index:number;onChoose:(choice:number)=>void;onBack:()=>void;onNext:()=>void;onFinish:()=>void;busy:boolean;secondsLeft:number;diagnostic:boolean;finishLabel:string;teacherRequest?:(prompt:string)=>void
}){
 const q=lesson.questions[index],order=shuffledEnglishChoices(q,sessionId,index)
 const tried=progress.first[index]!==null,finished=progress.mastered[index],mistakes=progress.wrong[index]||0
 const right=q.correct===progress.last[index],initialWrong=tried&&progress.first[index]!==q.correct
 const chosen=progress.last[index]
 const current=masteredCount(progress)
 return <section className="english-quiz" aria-label="Упражнения репетитора">
  <div className="english-quiz-meta"><strong>Вопрос {index+1} из {lesson.questions.length}</strong><span>Разобрано: {current}/{lesson.questions.length}</span></div>
  <div className="english-progress"><span style={{width:(current/lesson.questions.length*100)+'%'}}/></div>
  <h3>{q.prompt}</h3>
  <div className="english-options">{order.map((canonical,j)=><button type="button" key={canonical} disabled={finished||busy} className={chosen===canonical?'active':''} aria-pressed={chosen===canonical} onClick={()=>onChoose(canonical)}><span>{String.fromCharCode(65+j)}</span>{q.options[canonical]}</button>)}</div>
  {diagnostic?<p className="english-hint">Это проверка уровня. После неё Миро подробно объяснит ответы. Здесь нет штрафов и баллов.</p>:tried?<div className={'guided-feedback '+(right?'guided-correct':'guided-revise')} role="status">
   <strong>{right?(initialWrong?'✓ Теперь правильно! Ошибка сохранена для повторения.':'✓ Отлично, верно!'):(finished?'Разберём ошибку вместе':'Ещё одна попытка. Посмотри объяснение Миро.')}</strong>
   {initialWrong&&<p>Твой первый ответ: <b>{q.options[progress.first[index]!]}</b>. {progress.first[index]===q.correct?'':`Он не подходит к этому предложению или правилу.`}</p>}
   <p><b>Правило:</b> {russianTeachingRule(lesson)}</p>
   <p><b>Объяснение:</b> {q.explain}</p>
   {(initialWrong||(!right&&finished))&&<p>Правильная форма или ответ: <b>{q.options[q.correct]}</b>.</p>}
   {!finished&&<p className="guided-retry">Прочитай правило и выбери правильный вариант ещё раз. Если снова ошибёшься, Миро покажет решение и можно будет перейти дальше.</p>}
   {finished&&initialWrong&&<p className="guided-record">В отчёте родителю останется твой первый ответ. Исправление помогает учиться, а количество баллов за урок не уменьшается.</p>}
   {teacherRequest&&<button type="button" className="guided-help" onClick={()=>teacherRequest(`Я ошибся в теме «${lesson.title}»: ${q.prompt} Я выбрал «${q.options[progress.first[index]??0]}», но правильно «${q.options[q.correct]}». Объясни конкретно почему, какое правило, и задай мне другой похожий вопрос для проверки.`)}>🤖 Попросить Миро объяснить подробнее</button>}
  </div>:<p className="english-hint">Подумай самостоятельно. Миро объяснит правило после каждого ответа, а при ошибке даст возможность исправиться.</p>}
  <div className="english-quiz-nav"><button type="button" disabled={index===0} onClick={onBack}>← Назад</button>{index<lesson.questions.length-1?<button type="button" disabled={!finished} onClick={onNext}>Следующий →</button>:<button type="button" disabled={!readyToSubmit(progress,lesson.questions.length)||busy||secondsLeft>0} onClick={onFinish}>{busy?'Проверяем…':secondsLeft>0?`Завершить через ${String(Math.floor(secondsLeft/60)).padStart(2,'0')}:${String(secondsLeft%60).padStart(2,'0')}`:finishLabel}</button>}</div>
 </section>
}
export function LeaveLessonWarning({lesson,secondsLeft,progress,onStay,onLeave}:{lesson:EnglishLesson;secondsLeft:number;progress:GuidedProgress;onStay:()=>void;onLeave:()=>void}){
 const diagnostic=lesson.id==='diagnostic'||lesson.id.endsWith(':diagnostic')
 return <div className="guided-leave-backdrop"><section role="alertdialog" aria-modal="true" aria-label="Предупреждение о незавершённом уроке" className="guided-leave-dialog">
  <strong>⚠️ Илья, урок ещё не завершён</strong>
  <p>Ты разобрал {masteredCount(progress)} из {lesson.questions.length} заданий.{secondsLeft>0&&!diagnostic?` До 15 минут осталось ${Math.ceil(secondsLeft/60)} мин.`:''}</p>
  <p>{diagnostic?'Если выйдешь, диагностика останется незавершённой.':'Если выйдешь сейчас, 30 баллов пока не начислятся. Чтобы получить их, нужно закончить задания и 15-минутное занятие.'}</p>
  <p>Твои ответы останутся на этом телефоне. Вернись к уроку сегодня и нажми «Продолжить», чтобы закончить его.</p>
  <div className="guided-leave-actions"><button type="button" onClick={onStay}>Продолжить занятие</button><button type="button" onClick={onLeave}>Выйти и сохранить ответы</button></div>
 </section></div>
}
