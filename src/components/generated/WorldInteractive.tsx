import React,{useEffect,useState} from 'react';
import Island3D from './Island3D';
import './WorldInteractive.css';
type Id='dog'|'squirrel'|'robot';
type Task={id:number;title:string;done:boolean;points:number};
type Msg={by:'child'|'miro';text:string};
type Props={built:string[];bridgeOpen:boolean;tasks:Task[];coins:number;onOpenTasks:()=>void};
function answer(query:string,tasks:Task[],coins:number,built:string[],bridgeOpen:boolean):string{
 const q=query.toLowerCase().replace(/ё/g,'е');
 const remain=tasks.filter(t=>!t.done);
 if(/привет|здравствуй|как дела/.test(q))return 'Привет, Илья! Я Миро 🤖 Сегодня можем построить что-нибудь на поляне. Спроси, с чего начать!';
 if(/задан|дела|что делать|помоги|начать|план/.test(q))return remain.length?('Вот что можно сделать: '+remain.slice(0,3).map(t=>t.title).join(', ')+'. Отметь дело готовым, а после подтверждения родителем получишь монеты.'): 'Все дела на сегодня выполнены! Можно исследовать остров и посмотреть магазин наград.';
 if(/монет|балл|очки|заработ/.test(q))return 'Сейчас у тебя '+coins+' монет. Новые монеты начисляются после родительского подтверждения заданий. Монеты можно потратить в магазине.';
 if(/мост|белк|искорк/.test(q))return bridgeOpen?'Мост построен! Теперь Искорка может гулять через ручей. Нажми на белку и выбери прыжок.':'Чтобы помочь Искорке, выполни три первых задания. После их подтверждения мост откроется.';
 if(/собак|тобик|пес|поглад/.test(q))return 'Тобик любит играть! Нажми на него и выбери «Позвать Тобика» или «Поиграть».';
 if(/дом|стро|остров|цветник/.test(q))return 'Остров сначала пустой. За выполненные дела накапливается опыт: он открывает строительство. Уже построено: '+(built.length?built.join(', '):'пока ничего')+'.';
 if(/награ|магаз|playstation|пристав/.test(q))return 'В магазине есть игровое время, семейное кино и другие награды. Покупки подтверждают родители.';
 if(/кто ты|умеешь/.test(q))return 'Я Миро, игровой помощник. Подсказываю по заданиям, строительству, персонажам и наградам. Пока я работаю по готовым правилам, без подключения к ИИ.';
 return 'Я помогу! Спроси меня, какие задания остались, как построить домик, где взять монеты или как позвать Тобика.';
}
export default function WorldInteractive({built,bridgeOpen,tasks,coins,onOpenTasks}:Props){
 const [view,setView]=useState<'interactive'|'3d'>('interactive');
 const [selected,setSelected]=useState<Id|null>(null);
 const [dogMood,setDogMood]=useState('idle');
 const [squirrelMood,setSquirrelMood]=useState('idle');
 const [robotMood,setRobotMood]=useState('idle');
 const [chatOpen,setChatOpen]=useState(false);
 const [history,setHistory]=useState<Msg[]>(()=>{
 try{const saved=JSON.parse(localStorage.getItem('moymir2-miro-chat-v1')||'null');if(Array.isArray(saved))return saved.slice(-24)}catch{}
 return [{by:'miro',text:'Привет, Илья! 👋 Я Миро. Спроси, чем заняться сегодня, или нажми на жителя острова.'}];
 });
 useEffect(()=>{try{localStorage.setItem('moymir2-miro-chat-v1',JSON.stringify(history.slice(-24)))}catch{}},[history]);
 const [draft,setDraft]=useState('');
 const [hint,setHint]=useState('Нажми на Тобика, Искорку или Миро');
 const [night,setNight]=useState(false);
 const interact=(id:Id)=>{setSelected(id);if(id==='robot'){setChatOpen(true);setHint('Миро открыл чат!')}else setHint(id==='dog'?'Тобик ждёт твоей команды':'Искорка смотрит на тебя')};
 const act=(type:string)=>{
  if(selected==='dog'){setDogMood(type);setHint(type==='come'?'Тобик бежит к тебе!':'Тобик рад играть!');}
  else if(selected==='squirrel'){setSquirrelMood(type);setHint(type==='jump'?'Искорка прыгает по веткам!':'Искорка нашла орех!');}
  else {setRobotMood(type);if(type==='chat')setChatOpen(true);setHint('Миро машет рукой!')}
 };
 const send=(value:string)=>{
  const text=value.trim().slice(0,500);if(!text)return;
  setHistory(h=>[...h,{by:'child',text},{by:'miro',text:answer(text,tasks,coins,built,bridgeOpen)}]);setDraft('');
 };
 return <div className="wi-wrap">
 <div className="wi-heading"><strong>🌿 Жители острова</strong><div><button onClick={()=>setView(v=>v==='interactive'?'3d':'interactive')}>{view==='interactive'?'Проверить 3D':'Вернуться к миру'}</button></div></div>
 {view==='3d'?<Island3D built={built} bridgeOpen={bridgeOpen}/>:<section className={'wi-stage '+(night?'wi-night':'')}>
 <img className="wi-bg" src={import.meta.env.BASE_URL+'art/clearing.png'} alt="Поляна с дорожками и деревьями"/>
 {built.includes('Домик')&&<img className="wi-building wi-house" src={import.meta.env.BASE_URL+'art/house.png'} alt="Построенный домик"/>}
 {(built.includes('Мостик')||bridgeOpen)&&<span className="wi-building wi-bridge" role="img" aria-label="Построенный мост">🌉</span>}
 {built.includes('Цветник')&&<span className="wi-building wi-flowers" role="img" aria-label="Цветник">🌸🌼🌺</span>}
 {built.includes('Домик собаки')&&<span className="wi-building wi-doghouse" role="img" aria-label="Домик Тобика">🛖</span>}
 <button className={'wi-actor wi-dog '+(dogMood!=='idle'?'wi-dog-'+dogMood:'')} onAnimationEnd={()=>setDogMood('idle')} onTransitionEnd={()=>setDogMood('idle')} onClick={()=>interact('dog')} aria-label="Тобик: выбрать собаку">
 <img src={import.meta.env.BASE_URL+'art/dog.png'} alt="Тобик"/><span>Тобик</span></button>
 <button className={'wi-actor wi-squirrel '+(squirrelMood!=='idle'?'wi-squirrel-'+squirrelMood:'')} onAnimationEnd={()=>setSquirrelMood('idle')} onClick={()=>interact('squirrel')} aria-label="Искорка: выбрать белку">
 <img src={import.meta.env.BASE_URL+'art/squirrel.png'} alt="Искорка"/><span>Искорка</span></button>
 <button className={'wi-actor wi-robot '+(robotMood!=='idle'?'wi-robot-'+robotMood:'')} onAnimationEnd={()=>setRobotMood('idle')} onClick={()=>interact('robot')} aria-label="Миро: открыть помощника">
 <img src={import.meta.env.BASE_URL+'art/robot.png'} alt="Миро"/><span>Миро</span></button>
 <button className="wi-night-button" onClick={()=>setNight(x=>!x)}>{night?'☀️':'🌙'}</button>
 <div className="wi-action-panel"><p>{hint}</p><div>
 {selected==='dog'?<><button onClick={()=>act('come')}>🐕 Позвать Тобика</button><button onClick={()=>act('play')}>🦴 Играть</button></>:
 selected==='squirrel'?<><button onClick={()=>act('jump')}>🌳 Прыгнуть</button><button onClick={()=>act('nut')}>🌰 Дать орех</button></>:
 selected==='robot'?<><button onClick={()=>act('chat')}>💬 Спросить Миро</button><button onClick={()=>act('dance')}>🎵 Танец</button></>:
 <><button onClick={()=>interact('dog')}>🐕 Тобик</button><button onClick={()=>interact('squirrel')}>🐿️ Белка</button><button onClick={()=>interact('robot')}>🤖 Миро</button></>}
 </div></div></section>}
 <div className="wi-helper"><button onClick={()=>setChatOpen(x=>!x)}><img src={import.meta.env.BASE_URL+'art/robot.png'} alt=""/><span><strong>Спроси Миро</strong><small>Задания, награды, строительство</small></span><span>💬</span></button></div>
 {chatOpen&&<div className="wi-chat"><div className="wi-chat-head"><strong>🤖 Помощник Миро</strong><button onClick={()=>setChatOpen(false)}>✕</button></div>
 <div className="wi-chat-messages">{history.map((m,i)=><p className={m.by==='child'?'wi-chat-self':'wi-chat-miro'} key={i}>{m.text}</p>)}</div>
 <div className="wi-chat-quick">{['Что мне делать?','Как построить домик?','Где взять монеты?'].map(t=><button key={t} onClick={()=>send(t)}>{t}</button>)}</div>
 <form onSubmit={e=>{e.preventDefault();send(draft)}}><input aria-label="Написать Миро" placeholder="Напиши Миро..." value={draft} onChange={e=>setDraft(e.target.value)}/><button type="submit">➤</button></form>
 <button className="wi-tasks-link" onClick={()=>{setChatOpen(false);onOpenTasks()}}>Перейти к заданиям →</button><small>Подсказки работают по правилам приложения; интернет-ИИ пока не подключён.</small></div>}
 </div>;
}
