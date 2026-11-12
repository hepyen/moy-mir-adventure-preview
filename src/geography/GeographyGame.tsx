import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import type {useFamilyCloud} from '../lib/useFamilyCloud';
import {supabase} from '../lib/supabase';
import {geographyCategories,geographyQuestionCount,geographyVisualCount,type GeographyCategory} from './questions';
import {GeographyIllustration} from './GeographyIllustration';
import {visibleChoices} from './shuffle';
import './GeographyGame.css';
type Cloud=ReturnType<typeof useFamilyCloud>;
type Answer={id:string;choice:number|null;correct:boolean};
type Award={quiz_id:string;best_count:number;points_awarded:number};
type Attempt={id:string;family_id:string;child_id:string;user_id:string;quiz_id:string;quiz_title:string;time_limit_minutes:number;status:'in_progress'|'completed';quiz_revision:number;option_orders:number[][];reward_eligible:boolean;answers:Answer[];answered_count:number;correct_count:number;incorrect_count:number;started_at:string;finished_at:string|null};
const TIMES=[15,20,30,45] as const;
function points(n:number){if(n<20)return 0;return ({20:5,21:10,22:20,23:30,24:40,25:50} as Record<number,number>)[n]||0}
function playSound(which:'right'|'wrong'|'finish'){try{
 const C=window.AudioContext;if(!C)return;const ctx=new C();
 const notes=which==='right'?[[523,0],[784,.11],[1047,.24]]:which==='finish'?[[523,0],[659,.11],[784,.22],[1047,.34]]:[[260,0],[190,.17]];
 notes.forEach(([freq,delay])=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=which==='wrong'?'sawtooth':'sine';osc.frequency.setValueAtTime(freq,ctx.currentTime+delay);
 gain.gain.setValueAtTime(.0001,ctx.currentTime+delay);gain.gain.exponentialRampToValueAtTime(which==='wrong'?.075:.12,ctx.currentTime+delay+.025);
 gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+delay+.19);osc.connect(gain);gain.connect(ctx.destination);osc.start(ctx.currentTime+delay);osc.stop(ctx.currentTime+delay+.2)});
 window.setTimeout(()=>{void ctx.close().catch(()=>{})},1000);
 }catch{/* Sound is optional when system audio is restricted. */}}
function clock(remaining:number){const s=Math.max(0,remaining);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
function dateLabel(d:string){return new Date(d).toLocaleString('es-ES',{timeZone:'Europe/Madrid',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}
export function GeographySection({cloud}:{cloud:Cloud}){
 const[open,setOpen]=useState(false);
 return <><section className="geo-entry">
  <div className="geo-entry-icon">🌍</div><div className="geo-entry-info"><small>NUEVO · GEOGRAFÍA 1.º ESO</small><h3>La misión del clima</h3><p>4 desafíos · {geographyQuestionCount} preguntas · {geographyVisualCount} ilustraciones</p></div>
  <button type="button" onClick={()=>setOpen(true)}>{cloud.role==='parent'?'📊 Informes':'🎮 Jugar'} <span aria-hidden>→</span></button>
 </section>
 {open&&<GeographyGame cloud={cloud} onClose={()=>setOpen(false)}/>}</>;
}
function GeographyGame({cloud,onClose}:{cloud:Cloud;onClose:()=>void}){
 const isChild=cloud.role==='child';
 const[category,setCategory]=useState<GeographyCategory|null>(null);
 const[attempt,setAttempt]=useState<Attempt|null>(null);
 const[attempts,setAttempts]=useState<Attempt[]>([]);
 const[awards,setAwards]=useState<Award[]>([]);
 const[bonusPoints,setBonusPoints]=useState(0);
 const[report,setReport]=useState<Attempt|null>(null);
 const[minutes,setMinutes]=useState<number>(30);
 const[selected,setSelected]=useState<number|null>(null);
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 const[message,setMessage]=useState('');
 const[loading,setLoading]=useState(true);
 const[liveNow,setLiveNow]=useState(Date.now());
 const finishing=useRef(false);
 const activeId=attempt?.id;
 const remaining=attempt?Math.max(0,Math.ceil((Date.parse(attempt.started_at)+attempt.time_limit_minutes*60000-liveNow)/1000)):minutes*60;
 const fetchAttempts=useCallback(async()=>{
  if(!supabase||!cloud.familyId||!cloud.childId)return;
  const [history,awardRows,bonusRows]=await Promise.all([
   supabase.from('moymir_geography_attempts').select('*').eq('family_id',cloud.familyId).eq('child_id',cloud.childId).order('started_at',{ascending:false}).limit(80),
   supabase.from('moymir_geography_awards').select('quiz_id,best_count,points_awarded').eq('family_id',cloud.familyId).eq('child_id',cloud.childId),
   supabase.from('moymir_geography_bonus').select('points_awarded').eq('family_id',cloud.familyId).eq('child_id',cloud.childId),
  ]);
  if(history.error)throw history.error;
  if(awardRows.error)throw awardRows.error;
  if(bonusRows.error)throw bonusRows.error;
  setAttempts((history.data??[]) as Attempt[]);
  setAwards((awardRows.data??[]) as Award[]);
  setBonusPoints((bonusRows.data??[]).reduce((total,row)=>total+Number(row.points_awarded||0),0));
 },[cloud.familyId,cloud.childId]);
 useEffect(()=>{let alive=true;setLoading(true);void fetchAttempts().catch(e=>{if(alive)setError(e instanceof Error?e.message:'Error al cargar informes')}).finally(()=>{if(alive)setLoading(false)});return()=>{alive=false}},[fetchAttempts]);
 useEffect(()=>{if(!supabase||!cloud.familyId)return;const channel=supabase.channel('geo-attempts-'+cloud.session?.user.id).on('postgres_changes',{event:'*',schema:'public',table:'moymir_geography_attempts',filter:'family_id=eq.'+cloud.familyId},()=>{void fetchAttempts()}).subscribe();return()=>{void supabase?.removeChannel(channel)}},[cloud.familyId,cloud.session?.user.id,fetchAttempts]);
 useEffect(()=>{if(!attempt||attempt.status!=='in_progress')return;const tick=()=>setLiveNow(Date.now());tick();const timer=window.setInterval(tick,500);return()=>clearInterval(timer)},[activeId,attempt?.status]);
 const question=category?.questions[attempt?.answered_count||0];
 const start=async(cat:GeographyCategory)=>{
  if(!isChild||busy||!supabase||!cloud.session||!cloud.familyId||!cloud.childId)return;
  setBusy(true);setError('');setMessage('');
  try{
   const {data,e}=await (async()=>{const result=await supabase!.from('moymir_geography_attempts').insert({
      family_id:cloud.familyId,child_id:cloud.childId,user_id:cloud.session!.user.id,quiz_id:cat.id,quiz_title:cat.title,
      time_limit_minutes:minutes,quiz_revision:2,status:'in_progress',answers:[],answered_count:0,correct_count:0,incorrect_count:0
     }).select('*').single();return {data:result.data,e:result.error}})();
   if(e)throw e;setCategory(cat);setAttempt(data as Attempt);setSelected(null);setFeedbackQuestion('');setFeedbackChoice(null);setLiveNow(Date.now());finishing.current=false;
  }catch(e){setError(e instanceof Error?e.message:'No se ha podido iniciar el test')}finally{setBusy(false)}
 };
 const resume=(a:Attempt)=>{
  const cat=geographyCategories.find(x=>x.id===a.quiz_id);if(!cat)return;
  setCategory(cat);setAttempt(a);setSelected(null);setFeedbackQuestion('');setFeedbackChoice(null);setReport(null);finishing.current=false;setLiveNow(Date.now());
 };
 const save=async(next:Attempt)=>{
  if(!supabase)throw Error('Sin conexión');
  const {data,error:e}=await supabase.from('moymir_geography_attempts').update({
   status:next.status,answers:next.answers,answered_count:next.answered_count,correct_count:next.correct_count,
   incorrect_count:next.incorrect_count,finished_at:next.finished_at
  }).eq('id',next.id).eq('user_id',cloud.session?.user.id||'').select('*').single();
  if(e)throw e;const saved=data as Attempt;setAttempt(saved);
  if(saved.status==='completed'){setMessage('¡Prueba terminada!');playSound('finish');await fetchAttempts();void cloud.refresh();}
  return saved;
 };
 const finish=useCallback(async(a:Attempt,timeout=false)=>{
  if(finishing.current||busy)return;finishing.current=true;setBusy(true);setError('');
  const blanks=Math.max(0,25-a.answered_count);
  const filled=[...a.answers,...Array.from({length:blanks},(_,i)=>({id:a.quiz_id+'-'+String(a.answered_count+i+1).padStart(2,'0'),choice:null,correct:false}))];
  const next={...a,answers:filled,answered_count:25,incorrect_count:a.incorrect_count+blanks,status:'completed' as const,finished_at:new Date().toISOString()};
  try{await save(next);setMessage(timeout?'Tiempo agotado. Las preguntas pendientes cuentan como errores.':'¡Desafío completado!')}
  catch(e){setError('No se pudo guardar el resultado. Comprueba Internet y pulsa Reintentar. '+(e instanceof Error?e.message:''))}
  finally{setBusy(false)}
 },[busy,cloud.session?.user.id,fetchAttempts]);
 useEffect(()=>{if(attempt?.status==='in_progress'&&remaining<=0&&!busy&&!finishing.current){void finish(attempt,true)}},[attempt,remaining,busy,finish]);
 const choose=async(index:number)=>{
  if(!attempt||!question||selected!==null||busy||remaining<=0)return;
  setSelected(index);setBusy(true);setError('');
  const correct=index===visibleChoices(question,attempt).correct;playSound(correct?'right':'wrong');
  setFeedbackQuestion(question.id);setFeedbackChoice(index);
  const next={...attempt,answers:[...attempt.answers,{id:question.id,choice:index,correct}],
   answered_count:attempt.answered_count+1,correct_count:attempt.correct_count+(correct?1:0),
   incorrect_count:attempt.incorrect_count+(correct?0:1)};
  try{await save(next)}
  catch(e){setSelected(null);setFeedbackQuestion('');setFeedbackChoice(null);setError('No se guardó la respuesta. Comprueba Internet y vuelve a pulsar. '+(e instanceof Error?e.message:''))}
  finally{setBusy(false)}
 };
 const[feedbackQuestion,setFeedbackQuestion]=useState('');
 const[feedbackChoice,setFeedbackChoice]=useState<number|null>(null);
 const feedback=category?.questions.find(q=>q.id===feedbackQuestion);
 const advance=()=>{if(attempt?.answered_count===25&&attempt.status==='in_progress'){void finish(attempt);return;}setSelected(null);setFeedbackChoice(null);setFeedbackQuestion('')};
 const leaveTest=()=>{setCategory(null);setAttempt(null);setSelected(null);setFeedbackChoice(null);setFeedbackQuestion('');finishing.current=false;setReport(null);setMessage('');setError('');void fetchAttempts()};
 const latestByCategory=useMemo(()=>geographyCategories.map(c=>{const award=awards.find(a=>a.quiz_id===c.id);return {id:c.id,best:award?.best_count??null}}),[awards]);
 const perfect=latestByCategory.every(x=>x.best===25)&&bonusPoints>=300;
 const scoreTotal=awards.reduce((s,a)=>s+a.points_awarded,0)+bonusPoints;
 const displayed=feedback||question;
 const displayedChoice=feedback?feedbackChoice:selected;
 const displayedOptions=displayed?visibleChoices(displayed,attempt):null;
 const displayedCorrect=displayedChoice!==null&&displayedChoice===displayedOptions?.correct;
 const displayNumber=feedback?Math.min(25,attempt?.answered_count||1):Math.min(25,(attempt?.answered_count||0)+1);
 return <div className="geo-portal" role="dialog" aria-modal="true" aria-label="La misión del clima">
  <div className="geo-shell">
   <header className="geo-top"><div className="geo-logo">🌍 <span>LA MISIÓN DEL CLIMA</span></div><button className="geo-close" type="button" onClick={onClose} aria-label="Cerrar juego">✕</button></header>
   {error&&<div className="geo-alert" role="alert">{error}</div>}
   {!category&&!report&&<div className="geo-lobby">
    <div className="geo-hero"><div className="geo-stars">✦ ✦ ✦</div><h1>{isChild?'¡Explora el planeta!':'Informe de geografía'}</h1><p>{isChild?'Cuatro misiones. 25 preguntas por misión. ¿Podrás convertirte en experto del clima?':'Resultados reales de los cuatro desafíos. Cada respuesta queda registrada.'}</p>
     <div className="geo-hero-stats"><span>📘 {geographyQuestionCount} preguntas</span><span>🖼️ {geographyVisualCount} ilustraciones</span><span>🏆 500 puntos máximos</span></div></div>
    {isChild&&<><div className="geo-timing"><strong>⏱️ Tiempo para cada prueba</strong><p>Elige antes de empezar. El reloj seguirá corriendo aunque salgas del juego.</p><div className="geo-time-options">{TIMES.map(m=><button type="button" key={m} className={minutes===m?'active':''} onClick={()=>setMinutes(m)}>{m} min</button>)}</div></div><div className="geo-progress-total"><span>🏅 Puntos de geografía: <b>{scoreTotal}/500</b></span><span>{latestByCategory.filter(x=>x.best!==null).length}/4 misiones completadas</span></div></>}
    <div className="geo-cards">{geographyCategories.map((c,i)=>{const b=latestByCategory.find(x=>x.id===c.id)?.best;const inProgress=attempts.find(a=>a.quiz_id===c.id&&a.status==='in_progress'&&a.quiz_revision===2);return <article key={c.id} className={'geo-category geo-'+c.color}>
     <div className="geo-category-number">MISIÓN {i+1}</div><div className="geo-category-emoji">{c.emoji}</div><h2>{c.title}</h2><p>{c.subtitle}</p><div className="geo-category-meta">25 preguntas · {c.questions.filter(q=>q.visual).length} ilustraciones</div>
     {b!==null&&b!==undefined&&<div className="geo-best">⭐ Mejor resultado: {b}/25</div>}
     {isChild?<button disabled={busy} onClick={()=>inProgress?resume(inProgress):void start(c)}>{inProgress?'▶ Continuar':'Empezar misión'} →</button>:<div className="geo-parent-card">📊 {attempts.filter(a=>a.quiz_id===c.id).length} intentos registrados</div>}
    </article>})}</div>
    {perfect&&<div className="geo-perfect">🎉 ¡Enhorabuena! 100 respuestas correctas en las cuatro misiones. Premio total: 500 puntos.</div>}
    {loading&&<p className="geo-muted">Cargando resultados…</p>}
    {(!isChild||attempts.length>0)&&<section className="geo-history"><div className="geo-history-title"><h2>{isChild?'Mis intentos':'📋 Informe para padres'}</h2><button onClick={()=>void fetchAttempts()}>↻ Actualizar</button></div>
     {attempts.length===0?<p className="geo-muted">Todavía no hay pruebas reales registradas.</p>:attempts.map(a=><button key={a.id} className="geo-history-item" onClick={()=>setReport(a)}><div><strong>{geographyCategories.find(c=>c.id===a.quiz_id)?.title||a.quiz_title}</strong><small>{dateLabel(a.started_at)} · {a.time_limit_minutes||30} min · {a.status==='completed'?'Finalizado':'En curso'} · {a.reward_eligible?'Con puntos':'Sin premio (anulado)'}</small></div><span>{a.correct_count} ✓ / {a.incorrect_count} ✕ <small>({a.answered_count}/25)</small></span><b>›</b></button>)}
    </section>}
    <button className="geo-bottom-back" onClick={onClose}>← Volver a «Учёба»</button>
   </div>}
   {report&&<div className="geo-report"><button className="geo-back" onClick={()=>setReport(null)}>← Volver al informe</button><h1>📋 {report.quiz_title}</h1><p>{dateLabel(report.started_at)} · {report.status==='completed'?'Finalizado':'Prueba en curso'}</p>
    <div className="geo-report-stats"><div><b>{report.answered_count}/25</b><small>Respondidas</small></div><div><b>{report.correct_count}</b><small>Correctas</small></div><div><b>{report.incorrect_count}</b><small>Errores / pendientes</small></div><div><b>{report.reward_eligible?points(report.correct_count):0}</b><small>Puntos de esta prueba</small></div></div>
    <h2>Respuestas elegidas y explicaciones</h2>
    {report.answers.map((ans,i)=>{const q=geographyCategories.find(c=>c.id===report.quiz_id)?.questions.find(x=>x.id===ans.id);if(!q)return null;const displayedReport=visibleChoices(q,report);return <div className={'geo-report-row '+(ans.correct?'correct':'wrong')} key={i}><strong>{i+1}. {q.text}</strong>
     <p>{ans.choice===null?'— Sin respuesta':`Elegido: ${['A','B','C'][ans.choice]}. ${displayedReport.options[ans.choice]}`}</p>
     {!ans.correct&&<p className="geo-correct-answer">✓ Respuesta correcta: {['A','B','C'][displayedReport.correct]}. {displayedReport.options[displayedReport.correct]}</p>}
     <small>{q.explanation}</small></div>})}
   </div>}
   {category&&attempt&&<div className="geo-play">
    <button className="geo-back" onClick={leaveTest}>← Volver a las misiones</button>
    {error&&remaining<=0&&attempt.status==='in_progress'&&<button className="geo-retry-save" disabled={busy} onClick={()=>{finishing.current=false;void finish(attempt,true)}}>↻ Reintentar guardar el resultado</button>}
    <div className="geo-play-head"><div><small>MISIÓN · {category.title}</small><h2>Pregunta {displayNumber} de 25</h2></div><div className={'geo-clock '+(remaining<120?'urgent':'')}><span>⏱</span> {clock(remaining)}</div></div>
    <div className="geo-progress-rail"><div style={{width:`${Math.round((attempt.answered_count/25)*100)}%`}}/></div>
    <div className="geo-mini-stats"><span>✅ {attempt.correct_count} aciertos</span><span>❌ {attempt.incorrect_count} errores</span><span>🎯 Hasta 50 puntos</span></div>
    {attempt.status==='completed'?<div className="geo-finish"><div className="geo-finish-emoji">{attempt.correct_count===25?'🏆':'🎓'}</div><h2>{attempt.correct_count===25?'¡Misión perfecta!':'¡Misión terminada!'}</h2><p>{message||'Tu resultado se ha guardado para la familia.'}</p>
     <div className="geo-finish-score">{attempt.correct_count}<small> / 25</small></div><p>✅ {attempt.correct_count} correctas · ❌ {attempt.incorrect_count} incorrectas</p><strong>🏅 Hasta {points(attempt.correct_count)} puntos por esta misión</strong><button onClick={leaveTest}>Volver a las cuatro misiones</button>
    </div>:displayed?<div className="geo-question-card">
     <div className="geo-question-tag">{displayed.visual?'🖼️ OBSERVA Y RESPONDE':'🧠 PIENSA Y RESPONDE'}</div>
     {displayed.visual&&<GeographyIllustration kind={displayed.visual}/>}
     <h1>{displayed.text}</h1>
     <div className="geo-options">{displayedOptions?.options.map((opt,i)=><button type="button" key={i} disabled={busy||displayedChoice!==null||remaining<=0} onClick={()=>void choose(i)}
      className={displayedChoice!==null?(i===displayedOptions.correct?'correct':i===displayedChoice?'wrong':'dim') :''}>
      <span className="geo-option-letter">{['A','B','C'][i]}</span><span>{opt}</span>{displayedChoice!==null&&i===displayedOptions.correct&&<b>✓</b>}{displayedChoice===i&&i!==displayedOptions.correct&&<b>✕</b>}</button>)}</div>
     {displayedChoice!==null&&<div className={'geo-explanation '+(displayedCorrect?'correct':'wrong')} role="status"><b>{displayedCorrect?'🎉 ¡Correcto!':'📖 Vamos a aprenderlo'}</b>{!displayedCorrect&&<p><strong>Respuesta correcta:</strong> {['A','B','C'][displayedOptions?.correct||0]}. {displayedOptions?.options[displayedOptions.correct]}</p>}<p>{displayed.explanation}</p>
      <button disabled={busy} onClick={advance}>{busy?'Guardando…':attempt.answered_count===25?'Finalizar desafío 🏆':'Siguiente pregunta →'}</button></div>}
     {!displayedChoice&&<small className="geo-help">Elige una respuesta. Después podrás leer una explicación.</small>}
    </div>:<div className="geo-finish"><p>Las 25 respuestas se han guardado.</p><button disabled={busy} onClick={()=>void finish(attempt)}>Finalizar desafío 🏆</button></div>}
   </div>}
  </div>
 </div>;
}
