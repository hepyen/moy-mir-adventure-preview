import {useEffect,useRef,useState,type CSSProperties} from 'react';
import {usePioneerAudio} from './PioneerAudio';
import pioneerEmblem from './pioneer_emblem.png';
import './PioneerArena.css';

export type PioneerQuestion={id:number;text:string;choices:string[];number:number};
export type PioneerHintData={question:number;visible?:number[];votes?:number[];simulated?:boolean;reference?:string};
export type PioneerHints=Partial<Record<'half'|'audience'|'scripture',PioneerHintData>>;
export type PioneerActive={id:string;level:number;correct:number;slot:number;cycle:number;hints:PioneerHints;deadline:string|null;question:PioneerQuestion};
export type PioneerState={total:number;unlocked:number;active:PioneerActive|null;awards:{level:number;slot:number;points:number}[];cycles:{level:number;cycle:number;plays:number;used:number}[];history:{id:string;level:number;score:number;points:number;newPoints:number;status:string;date:string}[]};
export type PioneerAnswer={correct:boolean;answer:string;reference:string;finished:boolean;status:string;saved:number;newPoints:number;expired?:boolean};
export type PioneerEngine={
 state:PioneerState|null;role:'child'|'parent';start:(level:number)=>Promise<void>;
 answer:(attempt:string,question:number,choice:number)=>Promise<PioneerAnswer>;
 hint:(attempt:string,type:'half'|'audience'|'scripture')=>Promise<PioneerHintData>;
 cashout:(attempt:string)=>Promise<{saved:number;newPoints:number}>;reload:()=>Promise<void>;
 advance:(attempt:string)=>Promise<void>;timeout:(attempt:string,question:number)=>Promise<PioneerAnswer|null>;
 onClose?:()=>void;error:string;loading?:boolean;tv?:boolean;playerName?:string;closeLabel?:string;
};
const TIERS=[
 {name:'Интересующийся',icon:'🌱',desc:'Первые открытия'},
 {name:'Некрещёный возвещатель',icon:'📖',desc:'Библейские истории'},
 {name:'Крещёный возвещатель',icon:'💧',desc:'Уверенные знания'},
 {name:'Подсобный пионер',icon:'🎒',desc:'Глубже в Писание'},
 {name:'Пионер',icon:'🏅',desc:'Пророчества и история'},
 {name:'Миссионер',icon:'🌍',desc:'Высшая ступень'}
];
const LABELS=['А','Б','В','Г'];
const MONEY=[1,2,3,4,5,6,7,8,9,10];
type Feedback={question:PioneerQuestion;answer:PioneerAnswer;choice:number};
function heading(n:number){const t=TIERS[n-1]||TIERS[0];return t.icon+' '+t.name}
function formatDate(v:string){try{return new Date(v).toLocaleDateString('ru-RU',{day:'2-digit',month:'short',year:'numeric'})}catch{return ''}}
export function PioneerArena({state,role,start,answer,hint,cashout,advance,timeout,reload,onClose,error,loading,tv=false,playerName,closeLabel}:PioneerEngine){
 const [busy,setBusy]=useState(false);
 const [failure,setFailure]=useState('');
 const [feedback,setFeedback]=useState<Feedback|null>(null);
 const [result,setResult]=useState<{status:string;score:number;award:number;newPoints:number;level:number}|null>(null);
 const [music,setMusic]=useState(()=>{try{return localStorage.getItem('pioneer-music')!=='off'}catch{return true}});
 const [pendingHints,setPendingHints]=useState<PioneerHints>({});
 const [dialog,setDialog]=useState<'exit'|'half'|'audience'|'scripture'|null>(null);
 const [seconds,setSeconds]=useState(30);
 const ticked=useRef(-1);
 const timing=useRef(false);
 const sound=usePioneerAudio(music,!!state?.active&&!feedback&&!result);
 const active=state?.active||null;
 const question=feedback?.question||active?.question;
 const hints:PioneerHints={...(active?.hints||{}),...pendingHints};
 const half=hints.half?.question===question?.id?(hints.half?.visible||null):null;
 const votes=hints.audience?.question===question?.id?(hints.audience?.votes||null):null;
 const reference=hints.scripture?.question===question?.id?(hints.scripture?.reference||null):null;
 const playing=!!active&&!!question&&!feedback&&!result;
 const timeoutRef=useRef(timeout);
 timeoutRef.current=timeout;
 const soundRef=useRef(sound);soundRef.current=sound;
 useEffect(()=>{
  if(!playing||!active?.deadline)return;
  const at=Date.parse(active.deadline);
  if(!Number.isFinite(at))return;
  ticked.current=-1;timing.current=false;
  const update=()=>{
   const remaining=Math.max(0,Math.ceil((at-Date.now())/1000));
   setSeconds(remaining);
   if(ticked.current>remaining&&remaining>0)soundRef.current(remaining<=5?'urgent':'tick');
   ticked.current=remaining;
   if(remaining===0&&!timing.current){
    timing.current=true;
    const attemptId=active.id,questionSnapshot=active.question;
    void timeoutRef.current(attemptId,questionSnapshot.id).then(reply=>{
     if(reply?.finished){
      soundRef.current('timeup');
      setDialog(null);
      setFeedback({question:questionSnapshot,answer:reply,choice:-1});
     }else if(!reply){return reload()}
    }).catch(e=>setFailure(e instanceof Error?e.message:'Не удалось завершить вопрос'))
    .finally(()=>{timing.current=false});
   }
  };
  update();const id=window.setInterval(update,120);
  return()=>window.clearInterval(id);
 },[active?.id,active?.question.id,active?.deadline,playing]);
 const run=async(action:()=>Promise<void>)=>{if(busy)return;setBusy(true);setFailure('');try{await action()}catch(e){setFailure(e instanceof Error?e.message:'Ошибка соединения')}finally{setBusy(false)}};
 const choose=(choice:number)=>{
  if(!active||!question||feedback||busy||dialog||role!=='child'||seconds<=0||half&&!half.includes(choice))return;
  const snapshot=question;
  sound('select');
  void run(async()=>{
   const reply=await answer(active.id,snapshot.id,choice);
   sound(reply.correct?(reply.finished?'win':'right'):'wrong');
   setFeedback({question:snapshot,answer:reply,choice});
  });
 };
 const next=()=>void run(async()=>{
  if(feedback?.answer.finished){
   setResult({status:feedback.answer.status,score:feedback.answer.correct?10:active?.correct||0,award:feedback.answer.saved,newPoints:feedback.answer.newPoints,level:active?.level||1});
  }
  if(feedback&&!feedback.answer.finished&&active)await advance(active.id);
  await reload();setFeedback(null);setPendingHints({});
 });
 const begin=(level:number)=>{sound('start');void run(async()=>{await start(level);setFeedback(null);setResult(null);setPendingHints({});})};
 const dismissResult=()=>{setResult(null);setFeedback(null);setPendingHints({})};
 const confirmAction=()=>void run(async()=>{
  const current=dialog;setDialog(null);
  if(!current)return;
  if(current==='exit'){
   if(active){
    if(!feedback?.answer.finished)await cashout(active.id);
    await reload();
   }
   sound('exit');setFeedback(null);setResult(null);setPendingHints({});
   if(onClose)onClose();
  }else{
   if(!active||feedback)return;
   const received=await hint(active.id,current);
   setPendingHints(old=>({...old,[current]:received}));sound('hint');
  }
 });
 const goBack=()=>{
  if(dialog){setDialog(null);return}
  if(result){dismissResult();return}
  if(active){setDialog('exit');return}
  if(onClose)onClose();
 };
 useEffect(()=>{
  if(!tv)return;
  const keydown=(e:KeyboardEvent)=>{
   if(e.key==='Escape'||e.key==='Backspace'){
    e.preventDefault();goBack();return;
   }
   if(dialog&&e.key==='Enter'&&!(document.activeElement instanceof HTMLButtonElement)){
    e.preventDefault();setDialog(null);return;
   }
   if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
   const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>(
     dialog?'.pn-dialog button:not(:disabled)':'.pn-portal .pn-shell button:not(:disabled)'
   ))
     .filter(el=>el.getClientRects().length>0);
   if(!buttons.length)return;
   const selected=document.activeElement instanceof HTMLButtonElement&&buttons.includes(document.activeElement)?document.activeElement:null;
   if(selected?.classList.contains('pn-option')&&!feedback){
    const all=Array.from(document.querySelectorAll<HTMLButtonElement>('.pn-portal .pn-option'));
    const index=all.indexOf(selected);
    const nextIndex=e.key==='ArrowRight'?(index%2===0?index+1:index):
       e.key==='ArrowLeft'?(index%2===1?index-1:index):
       e.key==='ArrowDown'?(index<2?index+2:index):
       e.key==='ArrowUp'?(index>=2?index-2:index):index;
    const nextButton=all[nextIndex];
    if(nextButton&&nextButton!==selected&&!nextButton.disabled){
     e.preventDefault();nextButton.focus({preventScroll:true});return;
    }
   }
   const current=selected||buttons.find(el=>el.classList.contains('pn-option'))||buttons.find(el=>el.classList.contains('pn-level'))||buttons[0];
   if(!current)return;
   const rect=current.getBoundingClientRect(),x=rect.left+rect.width/2,y=rect.top+rect.height/2;
   const direction=e.key==='ArrowRight'?'right':e.key==='ArrowLeft'?'left':e.key==='ArrowDown'?'down':'up';
   const options=buttons.filter(el=>el!==current).map(el=>{
    const r=el.getBoundingClientRect(),dx=r.left+r.width/2-x,dy=r.top+r.height/2-y;
    const forward=direction==='right'?dx:direction==='left'?-dx:direction==='down'?dy:-dy;
    const side=direction==='right'||direction==='left'?Math.abs(dy):Math.abs(dx);
    return{el,forward,side,score:forward+side*1.7};
   }).filter(z=>z.forward>8).sort((a,b)=>a.score-b.score);
   if(!options.length)return;
   e.preventDefault();options[0].el.focus({preventScroll:true});options[0].el.scrollIntoView({block:'nearest'});
  };
  window.addEventListener('keydown',keydown);return()=>window.removeEventListener('keydown',keydown);
 },[tv,active,feedback,busy,question,result,dialog]);
 useEffect(()=>{
  if(!tv||!state||dialog)return;
  const frame=requestAnimationFrame(()=>{
   const selector=result?'.pn-result .pn-primary':feedback?'.pn-feedback button':active?'.pn-option:not(:disabled)':' .pn-level.open:not(:disabled)';
   const target=document.querySelector<HTMLButtonElement>('.pn-portal '+selector.trim());
   if(target)target.focus({preventScroll:true});
  });return()=>cancelAnimationFrame(frame);
 },[tv,question?.id,!!state?.active,!!feedback,!!result,dialog]);
 useEffect(()=>{
  if(!dialog)return;
  const frame=requestAnimationFrame(()=>document.querySelector<HTMLButtonElement>('.pn-dialog-cancel')?.focus({preventScroll:true}));
  return()=>cancelAnimationFrame(frame);
 },[dialog]);
 useEffect(()=>{try{localStorage.setItem('pioneer-music',music?'on':'off')}catch{}},[music]);
 const top=<div className="pn-head">
  <div className="pn-mark"><img className="pn-brand-icon" src={pioneerEmblem} alt=""/><span>КТО ХОЧЕТ<br/>СТАТЬ ПИОНЕРОМ?</span><span className="pn-mark-star">✦</span></div>
  <div className="pn-actions">{playerName&&<span className="pn-current-player">👤 {playerName}</span>}<button type="button" className="pn-chip" onClick={()=>setMusic(v=>!v)} aria-label={music?'Выключить музыку':'Включить музыку'}>{music?'♫ Музыка':'♪ Звук выключен'}</button>{(onClose||active)&&<button type="button" className="pn-chip pn-exit" onClick={goBack}>⇥ {active?'Выйти':closeLabel||'Закрыть'}</button>}</div>
 </div>;
 if(!state)return <div className={'pn-portal '+(tv?'pn-tv':'')}><div className="pn-shell">{top}<div className="pn-loading">{loading?'✦ Загружаем викторину…':'Не удалось загрузить игру'}<p>{failure||error}</p><button type="button" onClick={()=>void run(reload)}>Повторить</button></div></div></div>;
 return <div className={'pn-portal '+(tv?'pn-tv':'')} role={tv?undefined:'dialog'} aria-modal={tv?undefined:true} aria-label="Кто хочет стать пионером">
  <div className="pn-stars" aria-hidden="true"/>
  <div className="pn-shell">{top}
  {(failure||error)&&<div className="pn-error" role="alert">{failure||error}</div>}
  {result?<div className="pn-result">
   <div className="pn-result-emoji">{result.status==='won'?'🏆':result.status==='cashed'?'💎':'📖'}</div>
   <div className="pn-eyebrow">{heading(result.level)}</div>
   <h1>{result.status==='won'?'СТУПЕНЬ ПОКОРЕНА!':result.status==='cashed'?'НАГРАДА СОХРАНЕНА':'ПОПРОБУЕМ ЕЩЁ РАЗ'}</h1>
   <p>{result.status==='won'?'Все десять вопросов решены верно. Следующая ступень открыта.':result.status==='cashed'?'Ты сохранил несгораемую сумму и сможешь продолжить позже.':'Ошибка — повод открыть Библию и узнать что-то новое.'}</p>
   <div className="pn-result-score"><strong>+{result.award}</strong><span>баллов за прохождение</span></div>
   <p>Новых баллов в копилку: <b>+{result.newPoints}</b>. Лучшая награда за эту десятку учитывается только один раз.</p>
   <button className="pn-primary" onClick={dismissResult}>Вернуться к достижениям →</button>
  </div>:active&&question?<div className="pn-playing">
   <div className="pn-play-main">
    <div className="pn-question-status"><div className="pn-level-eyebrow">{heading(active.level)} <span>· Вопрос {question.number} из 10</span></div>
     <div className={'pn-timer '+(seconds<=5?'danger ':seconds<=10?'warning ':'')+(feedback?'paused':'')} role="timer" aria-label={'Осталось '+seconds+' секунд'}>
      <div className="pn-timer-ring" style={{'--pn-remaining':String(seconds*100/30)+'%'} as CSSProperties}>
       <span className="pn-timer-value">{feedback?'✓':seconds}</span><small>сек</small>
      </div>
     </div></div>
    <div className="pn-progress" role="progressbar" aria-valuemin={0} aria-valuemax={10} aria-valuenow={question.number-1}><span style={{width:((question.number-1)*10)+'%'}}/></div>
    <div className="pn-orbit" aria-hidden="true"><div className="pn-orbit-core">✦</div></div>
    <div className="pn-question-wrap"><div className="pn-question-no">ВОПРОС {question.number} / 10</div><h1>{question.text}</h1></div>
    <div className="pn-answers">
      {question.choices.map((choice,i)=>{
       const hidden=!!half&&!half.includes(i);
       const mark=feedback?(choice===feedback.answer.answer?'correct':feedback.choice===i?'wrong':'muted'):'';
       return <button key={i} type="button" onClick={()=>choose(i)} disabled={busy||!!feedback||hidden} className={'pn-option '+mark} aria-label={LABELS[i]+'. '+choice}>
        <span className="pn-option-label">{LABELS[i]}:</span><span>{hidden?'':choice}</span>{mark==='correct'&&<span className="pn-option-icon">✓</span>}{mark==='wrong'&&<span className="pn-option-icon">✕</span>}
       </button>
      })}
    </div>
    {feedback?<div className={'pn-feedback '+(feedback.answer.correct?'good':'bad')}>
     <strong>{feedback.answer.expired?'⏰ Время вышло!':feedback.answer.correct?'✨ Правильно!':'📖 Ответ неверный'}</strong>
     {!feedback.answer.correct&&<p>Правильный ответ: <b>{feedback.answer.answer}</b></p>}
     <p className="pn-reference">Источник: {feedback.answer.reference}</p>
     <button className="pn-primary" onClick={next} disabled={busy}>{busy?'Сохраняем…':feedback.answer.finished?'Посмотреть результат 🏆':'Следующий вопрос →'}</button>
    </div>:<div className="pn-hints"><span>ПОДСКАЗКИ</span>
     <button disabled={busy||!!hints.half} onClick={()=>setDialog('half')} title="Убрать два неверных варианта">50:50</button>
     <button disabled={busy||!!hints.audience} onClick={()=>setDialog('audience')} title="Виртуальный зал">♟ Зал</button>
     <button disabled={busy||!!hints.scripture} onClick={()=>setDialog('scripture')} title="Библейская ссылка">📖 Библия</button>
    </div>}
    {!feedback&&votes&&<div className="pn-votes"><b>Виртуальный зал (симуляция)</b><div className="pn-vote-bars">{votes.map((v,i)=><div key={i}><span>{LABELS[i]}</span><div><i style={{height:v+'%'}}/></div><small>{v}%</small></div>)}</div></div>}
    {!feedback&&reference&&<div className="pn-reference-box">📖 Найди ответ: <b>{reference}</b></div>}
    {!feedback&&active.correct>=5&&<button type="button" className="pn-cash" disabled={busy} onClick={()=>setDialog('exit')}>💎 Забрать 5 баллов и выйти</button>}
   </div>
   <aside className="pn-ladder"><div className="pn-ladder-title">ЛЕСТНИЦА НАГРАД</div>{Array.from({length:10},(_,idx)=>10-idx).map(n=><div key={n} className={'pn-rung '+(n===5||n===10?'checkpoint ':'')+(n===question.number?'current ':'')+(n<question.number?'done':'')}><span>{String(n).padStart(2,'0')}</span><b>{MONEY[n-1]} ✦</b>{n===5||n===10?<small>◆</small>:null}</div>)}<div className="pn-ladder-bottom">Правильно: {active.correct} из 10<br/>Несгораемая сумма: {active.correct>=5?'5':'0'} баллов</div></aside>
  </div>:<div className="pn-lobby">
   <div className="pn-hero"><div className="pn-eyebrow">БИБЛЕЙСКАЯ ТЕЛЕВИКТОРИНА</div><h1>ГОТОВ ОТКРЫТЬ<br/><em>НОВУЮ СТУПЕНЬ?</em></h1><p>6 ступеней · 300 вопросов · 4 варианта · 3 подсказки.<br/>Пять разных десяток на каждом уровне.</p>
    <div className="pn-hero-stat"><div><b>{state.total}</b><span>баллов заработано</span></div><div><b>{state.unlocked}/6</b><span>ступеней открыто</span></div></div>
   </div>
   {role==='child'?<div className="pn-levels">{TIERS.map((tier,i)=>{
    const level=i+1,unlocked=level<=state.unlocked;
    const cycle=state.cycles.find(x=>x.level===level);
    const earned=state.awards.filter(x=>x.level===level).reduce((a,b)=>a+b.points,0);
    return <button type="button" key={level} disabled={!unlocked||busy} className={'pn-level '+(unlocked?'open':'locked')} onClick={()=>begin(level)}>
     <span className="pn-level-icon">{tier.icon}</span><span className="pn-level-copy"><small>УРОВЕНЬ {level}</small><strong>{tier.name}</strong><span>{unlocked?(cycle?'Пройдено десяток: '+cycle.plays:'50 вопросов ждут тебя'):'🔒 Открой предыдущую ступень'}</span></span>
     <span className="pn-level-points">{unlocked?earned+' / 50 ✦':'🔒'}</span>
    </button>
   })}</div>:<div className="pn-parent"><h2>🏆 Отчёт для родителя</h2><p>Доступны результаты ребёнка. Начинать игру можно из детского профиля.</p></div>}
   {state.history.length>0&&<section className="pn-history"><h2>Последние игры</h2>{state.history.slice(0,8).map(x=><div key={x.id}><span>{heading(x.level)} <small>{formatDate(x.date)}</small></span><b>{x.score}/10 · +{x.newPoints} ✦</b></div>)}</section>}
   <div className="pn-lobby-note">Игровые ступени обозначают достижения в викторине и не являются назначениями в собрании.</div>
  </div>}
  </div>
  {dialog&&<div className="pn-dialog-shade" role="presentation">
   <section className="pn-dialog" role="alertdialog" aria-modal="true" aria-labelledby="pn-dialog-title">
    <div className="pn-dialog-icon">{dialog==='exit'?'🚪':dialog==='half'?'50:50':dialog==='audience'?'👥':'📖'}</div>
    <h2 id="pn-dialog-title">{dialog==='exit'?'Вы точно хотите выйти из игры?':dialog==='half'?'Использовать подсказку «50 на 50»?':dialog==='audience'?'Обратиться к виртуальному залу?':'Открыть библейскую подсказку?'}</h2>
    <p>{dialog==='exit'?(active&&active.correct>=5?'Твои 5 несгораемых баллов сохранятся. Нынешняя попытка завершится.':'Попытка завершится без награды. Уже заработанные раньше баллы останутся.'): 'После подтверждения подсказка будет потрачена. Останешься в этом вопросе.'}</p>
    <div className="pn-dialog-actions">
     <button type="button" className="pn-dialog-cancel" onClick={()=>setDialog(null)} disabled={busy}>Отмена · Остаться</button>
     <button type="button" className={'pn-dialog-confirm '+(dialog==='exit'?'leave':'')} onClick={confirmAction} disabled={busy}>{busy?'Подождите…':dialog==='exit'?'Да, выйти':'Использовать'}</button>
    </div>
   </section>
  </div>}
 </div>;
}

