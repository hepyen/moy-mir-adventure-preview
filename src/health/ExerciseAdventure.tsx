import {useEffect,useRef,useState} from 'react';
import {MiroAvatar} from '../legacyWorld/MiroAvatar';
import './ExerciseAdventure.css';

type Mode='normal'|'easy';
type Move={id:string;title:string;icon:string;seconds:number;easy:number;tip:string;easyTip:string};
const MOVES:Move[]=[
 {id:'stretch',title:'Проснись и потянись',icon:'🌤️',seconds:40,easy:25,tip:'Вытяни руки вверх и потянись. Без боли и усилия.',easyTip:'Можно потянуться сидя. Подними руки только насколько удобно.'},
 {id:'shoulders',title:'Круги плечами',icon:'🙆',seconds:60,easy:40,tip:'Медленно покрути плечами вперёд и назад.',easyTip:'Мягко двигай плечами сидя, без резких движений.'},
 {id:'arms',title:'Разминка рук',icon:'👐',seconds:60,easy:40,tip:'Поднимай руки по очереди и опускай. Дыши ровно.',easyTip:'Поднимай руки невысоко, можно опереться на спинку стула.'},
 {id:'walk',title:'Шагаем на месте',icon:'🚶',seconds:90,easy:55,tip:'Иди в спокойном темпе, не прыгай. Смотри перед собой.',easyTip:'Если болит голеностоп, шагать не нужно: двигай руками сидя.'},
 {id:'chair',title:'Поднимаемся со стула',icon:'🪑',seconds:60,easy:30,tip:'Сядь на устойчивый стул и медленно встань. Не торопись.',easyTip:'При боли в ноге пропусти этот шаг и расслабь плечи сидя.'},
 {id:'sides',title:'Наклоны в стороны',icon:'🌿',seconds:60,easy:40,tip:'Плавно тянись влево и вправо, без глубоких наклонов.',easyTip:'Можно тянуться в стороны сидя, без скручивания.'},
 {id:'breathe',title:'Спокойно дышим',icon:'🌈',seconds:50,easy:30,tip:'Плечи расслаблены. Несколько спокойных вдохов без задержек.',easyTip:'Посиди спокойно, расслабь руки и шею, дыши как обычно.'}
];
const root=import.meta.env.BASE_URL+'health/';
const length=(m:Mode)=>MOVES.reduce((n,x)=>n+(m==='normal'?x.seconds:x.easy),0);
const fmt=(v:number)=>String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0');
function Pose({move,running,easy}:{move:Move;running:boolean;easy:boolean}){
 return <div className={'ex-diagram ex-move-'+move.id+(running?' ex-animated':'')+(easy?' ex-easy':'')} role="img" aria-label={'Схема движения: '+move.title}>
  <svg viewBox="0 0 178 192" width="170" height="180" aria-hidden="true">
   <ellipse cx="89" cy="178" rx="49" ry="9" fill="#397f7770"/>
   <g className="ex-person">
    <circle cx="89" cy="36" r="16" fill="#ffdfb7" stroke="#846858" strokeWidth="2"/>
    <path d="M81 33 Q88 39 96 33" fill="none" stroke="#7b4b3b" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="83" cy="31" r="1.8" fill="#4a5665"/><circle cx="95" cy="31" r="1.8" fill="#4a5665"/>
    <rect x="70" y="56" width="39" height="66" rx="19" fill="#37c5b3" stroke="#207e8d" strokeWidth="2"/>
    <g className="ex-arm-left"><line x1="72" y1="64" x2="50" y2="102" stroke="#fbd9ad" strokeWidth="11" strokeLinecap="round"/></g>
    <g className="ex-arm-right"><line x1="106" y1="64" x2="127" y2="102" stroke="#fbd9ad" strokeWidth="11" strokeLinecap="round"/></g>
    <g className="ex-leg-left"><line x1="79" y1="112" x2="74" y2="164" stroke="#345f8e" strokeWidth="13" strokeLinecap="round"/><line x1="74" y1="165" x2="61" y2="170" stroke="#e9fcf7" strokeWidth="11" strokeLinecap="round"/></g>
    <g className="ex-leg-right"><line x1="98" y1="112" x2="103" y2="164" stroke="#345f8e" strokeWidth="13" strokeLinecap="round"/><line x1="103" y1="165" x2="115" y2="170" stroke="#e9fcf7" strokeWidth="11" strokeLinecap="round"/></g>
   </g>
  </svg>
  {move.id==='chair'&&<span className="ex-chair" aria-hidden="true">🪑</span>}
 </div>;
}
export function ExerciseAdventure({onComplete}:{onComplete:()=>void}){
 const [mode,setMode]=useState<Mode>('normal');
 const [step,setStep]=useState(0);
 const [remaining,setRemaining]=useState(MOVES[0].seconds);
 const [running,setRunning]=useState(false);
 const [finished,setFinished]=useState(false);
 const [visited,setVisited]=useState(0);
 const [musicOn,setMusicOn]=useState(true);
 const [voiceOn,setVoiceOn]=useState(true);
 const [message,setMessage]=useState('');
 const clock=useRef(0);
 const lastSample=useRef(0);
 const exerciseActiveMs=useRef(0);
 const music=useRef<HTMLAudioElement|null>(null);
 const voice=useRef<HTMLAudioElement|null>(null);
 const callback=useRef(onComplete);
 useEffect(()=>{callback.current=onComplete},[onComplete]);
 const current=MOVES[step],total=length(mode);
 const elapsed=MOVES.slice(0,step).reduce((n,x)=>n+(mode==='normal'?x.seconds:x.easy),0);
 const remainingMove=mode==='normal'?current.seconds:current.easy;
 const percent=Math.round(Math.min(100,Math.max(0,(elapsed+remainingMove-remaining)/total*100)));
 function speech(name:string){
  if(!voiceOn)return;
  voice.current?.pause();
  const file=new Audio(root+'voice_'+name+'.mp3');file.volume=.95;voice.current=file;
  void file.play().catch(()=>setMessage('Для звуков включи воспроизведение на телефоне.'));
 }
 function beginMusic(){
  if(!music.current){music.current=new Audio(root+'morning.mp3');music.current.loop=true;music.current.volume=.19;}
  if(musicOn)void music.current.play().catch(()=>setMessage('Нажми «Начать», чтобы разрешить воспроизведение музыки.'));
 }
 function pause(){setRunning(false);music.current?.pause();voice.current?.pause()}
 function finish(){
  pause();setFinished(true);setRemaining(0);
  // Skipping all steps must not imply that exercise took place.
  if(exerciseActiveMs.current>=25_000)callback.current();
  speech('finish');
 }
 function next(){
  if(finished)return;
  if(step===MOVES.length-1){finish();return}
  const i=step+1;
  setStep(i);setRemaining(mode==='normal'?MOVES[i].seconds:MOVES[i].easy);
  setVisited(n=>n+1);setMessage('');
  if(running)speech(MOVES[i].id);
 }
 function start(){
  if(finished){reset(mode);return}
  setRunning(true);beginMusic();speech(step===0&&visited===0?'intro':current.id);
 }
 function reset(target:Mode){pause();exerciseActiveMs.current=0;setMode(target);setStep(0);setRemaining(target==='normal'?MOVES[0].seconds:MOVES[0].easy);setVisited(0);setFinished(false);setMessage('')}
 function jump(i:number){pause();setStep(i);setRemaining(mode==='normal'?MOVES[i].seconds:MOVES[i].easy);setFinished(false);setVisited(Math.max(visited,i));setMessage('')}
 useEffect(()=>{
  if(!running||finished)return;
  clock.current=Date.now()+remaining*1000;
  lastSample.current=Date.now();
  const t=window.setInterval(()=>{
   const now=Date.now();exerciseActiveMs.current+=Math.max(0,Math.min(700,now-lastSample.current));lastSample.current=now;
   setRemaining(Math.max(0,Math.ceil((clock.current-now)/1000)));
  },250);
  return()=>window.clearInterval(t);
 },[running,step,finished]);
 useEffect(()=>{if(running&&remaining===0&&!finished)next()},[running,remaining,finished]);
 useEffect(()=>{
  if(!running)return;
  const hidden=()=>{if(document.hidden){setRunning(false);music.current?.pause();voice.current?.pause()}};
  document.addEventListener('visibilitychange',hidden);return()=>document.removeEventListener('visibilitychange',hidden);
 },[running]);
 useEffect(()=>()=>{music.current?.pause();voice.current?.pause();music.current=null;voice.current=null},[]);
 useEffect(()=>{if(!musicOn)music.current?.pause();else if(running)beginMusic()},[musicOn]);
 useEffect(()=>{if(!voiceOn)voice.current?.pause()},[voiceOn]);
 return <section className="h-exercise-adventure" aria-label="Зарядка с Миро">
  <header className="ex-header"><span>🌞 ПРИКЛЮЧЕНИЕ УТРА</span><h2>Зарядка с Миро</h2><p>Семь спокойных движений. У тебя всё получится!</p></header>
  <div className="ex-modes" role="group" aria-label="Выбор сложности зарядки">
   <button aria-pressed={mode==='normal'} className={mode==='normal'?'active':''} onClick={()=>reset('normal')}>🌿 Обычно · {Math.round(length('normal')/60)} мин</button>
   <button aria-pressed={mode==='easy'} className={mode==='easy'?'active':''} onClick={()=>reset('easy')}>☁️ Легче · {Math.round(length('easy')/60)} мин</button>
  </div>
  <div className={'ex-scene '+(finished?'ex-finished':'')}>
   <div className="ex-sky" aria-hidden="true"><div className="ex-sun"/><div className="ex-hills"/><i>✦</i><i>✧</i><i>✦</i></div>
   <div className={"ex-miro ex-miro-"+current.id+(running?" ex-miro-active":"")} aria-label="Настоящий Миро из домика"><MiroAvatar face="smile"/><div className="ex-miro-speech">{finished?'Молодец! 🌟':running?'Двигаемся вместе!':'Начнём, Илья?'}</div></div>
   <Pose move={current} running={running} easy={mode==='easy'}/>
   <div className="ex-badge">{finished?'🎉 Утро удалось!':current.icon+' '+current.title}</div>
   {finished&&<div className="ex-confetti" aria-hidden="true">✨ 🌻 ⭐ 🎊 ✨</div>}
  </div>
  <div className="ex-timer-box">
   <div><small>{finished?'Миро поздравляет тебя':'Движение '+(step+1)+' из '+MOVES.length}</small><strong data-testid="exercise-timer" className="ex-time">{finished?'Готово!':fmt(remaining)}</strong></div>
   <div className="ex-time-ring" style={{'--ex-pct':percent+'%'} as React.CSSProperties}>{finished?'🌟':percent+'%'}</div>
  </div>
  <p className="ex-instruction" role="status">{finished?'Зарядка закончена. Можно спокойно позавтракать.':mode==='normal'?current.tip:current.easyTip}</p>
  <div className="ex-controls"><button className="ex-play" onClick={running?pause:start}>{finished?'🔁 Начать снова':running?'⏸ Пауза':'▶ Начать / продолжить'}</button><button className="ex-skip" disabled={finished} onClick={next}>Пропустить шаг →</button></div>
  <div className="ex-options"><label><input type="checkbox" checked={musicOn} onChange={e=>setMusicOn(e.target.checked)}/> 🎵 Мелодия</label><label><input type="checkbox" checked={voiceOn} onChange={e=>setVoiceOn(e.target.checked)}/> 🗣️ Голос Миро</label></div>
  <div className="ex-track" aria-label="Список семи движений">{MOVES.map((m,i)=><button key={m.id} className={i===step?'current':''} onClick={()=>jump(i)}><span>{m.icon}</span><strong>{m.title}</strong><small>{fmt(mode==='normal'?m.seconds:m.easy)}</small></button>)}</div>
  <div className="ex-safety"><strong>💚 Можно отдохнуть</strong><p>При боли, головокружении или неприятных ощущениях остановись. Никаких прыжков и соревнования на скорость. Если болит нога, выбери мягкий режим или пропусти движение. После травмы нагрузку согласуйте с врачом.</p><button onClick={()=>{pause();setMessage('Сегодня можно отдохнуть. Миро поддерживает тебя и без зарядки.');speech('rest')}}>Мне нужен отдых</button></div>
  {message&&<p className="ex-message" role="status">{message}</p>}
 </section>;
}
