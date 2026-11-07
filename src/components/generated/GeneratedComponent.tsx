import WorldInteractive from './WorldInteractive';
import React, { useState, useMemo, useEffect } from 'react';
import './MyWorld.css';
type Tab = 'world' | 'tasks' | 'shop' | 'family';
type Proposal={id:number;title:string;points:number;emoji:string;status:'pending'|'accepted'|'rejected'};
type Chore = {
  id: number;
  title: string;
  emoji: string;
  points: number;
  done: boolean;
  material: string;
  repeat?: boolean;
};
const initial: Chore[] = [{
  id: 1,
  title: 'Заправить кровать',
  emoji: '🛏️',
  points: 5,
  done: false,
  material: 'Доски'
}, {
  id: 2,
  title: 'Сделать уроки',
  emoji: '📚',
  points: 20,
  done: false,
  material: 'Верёвка'
}, {
  id: 3,
  title: 'Убрать комнату',
  emoji: '🧹',
  points: 15,
  done: false,
  material: 'Инструменты'
}, {
  id: 4,
  title: 'Помочь маме',
  emoji: '🤝',
  points: 10,
  done: false,
  material: 'Яблоки'
}, {
  id: 5,
  title: 'Почистить зубы',
  emoji: '🪥',
  points: 5,
  done: true,
  material: 'Звёзды'
}];
const prices = [{
  id: 1,
  emoji: '🎮',
  title: '30 минут PlayStation',
  price: 100
}, {
  id: 2,
  emoji: '🍿',
  title: 'Семейное кино',
  price: 80
}, {
  id: 3,
  emoji: '🎁',
  title: 'Секретный сундук',
  price: 120
}, {
  id: 4,
  emoji: '🌟',
  title: 'Украшение для острова',
  price: 70
}];
const nav: [Tab, string, string][] = [['world', '🌍', 'Мир'], ['tasks', '✅', 'Дела'], ['shop', '🎁', 'Магазин'], ['family', '💬', 'Семья']];
const SAVE_KEY='moymir2-demo-2.2';
const OLD_SAVE_KEY='moymir2-demo-2.1';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function readSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||localStorage.getItem(OLD_SAVE_KEY)||'null')}catch{return null}}
export const GeneratedComponent = () => {
  const saved=useMemo(()=>readSave(),[]);
  const [day,setDay]=useState(today());

  const [tab, setTab] = useState<Tab>('world');
  const [chores, setChores] = useState<Chore[]>(()=>saved?.day===today()&&Array.isArray(saved?.chores)?saved.chores:(saved?.templates??initial).map((x:Chore)=>({...x,done:false})));
  const [templates,setTemplates]=useState<Chore[]>(saved?.templates??initial.map(x=>({...x,repeat:true,done:false})));
  const [coins, setCoins] = useState<number>(saved?.coins??0);
  const [xp, setXp] = useState<number>(saved?.xp??0);
  const [pending, setPending] = useState<number[]>(saved?.pending??[]);
  const [pendingChores,setPendingChores]=useState<number[]>(saved?.day===today()?saved?.pendingChores??[]:[]);
  const [parent, setParent] = useState(false);
  const [scene, setScene] = useState<'day' | 'night'>('day');
  const [mission, setMission] = useState(false);
  const [chat, setChat] = useState<{who:string;message:string;self:boolean}[]>(saved?.chat??[{
    who: 'Мама',
    message: 'Доброе утро! ❤️',
    self: false
  }, {
    who: 'Папа',
    message: 'Как продвигается строительство?',
    self: false
  }, {
    who: 'Илья',
    message: 'Скоро спасу белку! 🐿️',
    self: true
  }]);
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const [missionsUnlocked, setMissionsUnlocked] = useState(0);
  const [sound, setSound] = useState(true);
  const [building, setBuilding] = useState<string[]>(saved?.building??[]);
  const [newTitle,setNewTitle]=useState('');
  const [newPoints,setNewPoints]=useState('10');
  const [newEmoji,setNewEmoji]=useState('⭐');
  const [newRepeat,setNewRepeat]=useState(true);
  const [proposals,setProposals]=useState<Proposal[]>(saved?.proposals??[]);
  const [proposalTitle,setProposalTitle]=useState('');
  const [proposalPoints,setProposalPoints]=useState('10');
  const [editorOpen,setEditorOpen]=useState(false);
  const createTask=(title:string,points:number,emoji:string,repeat=true)=>{
   const t=title.trim();if(!t||!Number.isFinite(points)||points<1||points>500)return;
   const item:Chore={id:Date.now()+Math.floor(Math.random()*100),title:t,points,emoji,repeat,done:false,material:'Ресурс'};
   setTemplates(old=>[...old,item]);setChores(old=>[...old,item]);toast('Задание создано: '+t);
  };
  const offerTask=()=>{
   const t=proposalTitle.trim();const points=Number(proposalPoints);
   if(!t||!Number.isFinite(points)||points<1||points>500)return;
   setProposals(old=>[...old,{id:Date.now(),title:t,points,emoji:'💡',status:'pending'}]);
   setProposalTitle('');toast('Предложение отправлено родителю');
  };
  const reviewProposal=(id:number,accept:boolean)=>{
   const p=proposals.find(q=>q.id===id);
   if(!p||p.status!=='pending')return;
   if(accept)createTask(p.title,p.points,'💡',true);
   setProposals(old=>old.map(q=>q.id===id?{...q,status:accept?'accepted':'rejected'}:q));
  };

  useEffect(()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify({day,chores,templates,coins,xp,pending,pendingChores,building,chat,proposals}))}catch{}},[day,chores,templates,coins,xp,pending,pendingChores,building,chat,proposals]);
  useEffect(()=>{const timer=setInterval(()=>{const d=today();if(d!==day){setDay(d);setChores(templates.map(x=>({...x,done:x.repeat===false?chores.some(c=>c.id===x.id&&c.done):false})));setPendingChores([])}},30000);return()=>clearInterval(timer)},[day,templates,chores]);
  const finished = chores.filter(x => x.done).length;
  const missionItems = chores.slice(0, 3);
  const missionDone = missionItems.every(x => x.done);
  const nextXp = 500 - xp % 500;
  const toast = (v: string) => {
    setMessage(v);
    window.setTimeout(() => setMessage(''), 2800);
  };
  const mark=(id:number)=>{
    const task=chores.find(x=>x.id===id);
    if(!task||task.done||pendingChores.includes(id))return;
    setPendingChores(a=>[...a,id]);
    toast('Задание отправлено родителям на проверку');
  };
  const approveChore=(id:number)=>{
    const task=chores.find(x=>x.id===id);
    if(!task||task.done||!pendingChores.includes(id))return;
    setPendingChores(a=>a.filter(v=>v!==id));
    setChores(a=>a.map(x=>x.id===id?{...x,done:true}:x));
    setCoins(n=>n+task.points);setXp(n=>n+task.points*2);
    toast('Родитель подтвердил! +'+task.points+' монет');
  };
  const declineChore=(id:number)=>{setPendingChores(a=>a.filter(x=>x!==id));toast('Задание возвращено для проверки')};
  const buy = (id: number) => {
    const item = prices.find(x => x.id === id);
    if (!item) return;
    if (coins < item.price) {
      toast('Монет пока недостаточно');
      return;
    }
    setCoins(c => c - item.price);
    setPending(p => [...p, id]);
    toast('Запрос отправлен родителям 💌');
  };
  const approve = (id: number) => {
    setPending(p => p.filter(x => x !== id));
    toast('Награда подтверждена родителем!');
  };
  const send = () => {
    if (!draft.trim()) return;
    setChat(c => [...c, {
      who: parent ? 'Папа' : 'Илья',
      message: draft.trim(),
      self: true
    }]);
    setDraft('');
  };
  const build = (x: string) => {
    if (building.includes(x)) return;
    if (xp < 80*(building.length+1)) {
      toast('Нужно ещё опыта для новой постройки');
      return;
    }
    setBuilding(a => [...a, x]);
    toast('Постройка появилась на острове! 🏡');
  };
  return <main className="mw-root">
 <div className="mw-phone">
 <div className="mw-top">
 <div className="mw-identity"><div className="mw-logo">✦</div><div><strong>МОЙ МИР <span className="mw-beta">2.2</span></strong><span>Остров приключений</span></div></div>
 <button className="mw-coin" onClick={() => setTab('shop')}>🪙 <b>{coins}</b></button>
 </div>
 <div className="mw-tabs-top">
 <button className={!parent ? 'selected' : ''} onClick={() => setParent(false)}>👦 Илья</button>
 <button className={parent ? 'selected' : ''} onClick={() => setParent(true)}>👨‍👩‍👦 Родители</button>
 <button className="mw-bell" title="Звук" onClick={() => setSound(x => !x)}>{sound ? '🔊' : '🔇'}</button>
 </div>
 <div className="mw-scroll">
 {tab === 'world' && <>
 <section className="mw-greeting"><div><div className="mw-eyebrow">{parent ? 'КАБИНЕТ РОДИТЕЛЯ' : 'ТВОЁ ПРИКЛЮЧЕНИЕ'}</div><h1>{parent ? 'Мир Ильи' : 'Привет, Илья! 👋'}</h1><p>{parent ? 'Здесь видно, как занятия превращаются в достижения.' : 'Остров меняется благодаря твоим добрым делам.'}</p></div></section>
 <WorldInteractive built={building} bridgeOpen={missionDone} tasks={chores} coins={coins} onOpenTasks={()=>setTab('tasks')}/>
 <section className="mw-progress"><div className="mw-progress-head"><strong>⭐ Опыт строителя</strong><span>{xp % 500} / 500</span></div><div className="mw-progress-track"><div style={{
                width: `${xp % 500 / 500 * 100}%`
              }} /></div><p>Ещё {nextXp} опыта до нового уровня</p></section>
 <section className="mw-panel mw-mission">
 <div className="mw-section-label">МИССИЯ ДНЯ <span className="mw-spark">✦</span></div>
 <div className="mw-mission-top"><div className="mw-squirrel">🐿️</div><div><h2>{missionDone ? 'Мост спасён!' : 'Спаси белку!'}</h2><p>{missionDone ? 'Отличная работа! Белка вернулась домой.' : 'Белка застряла за ручьём. Собери три материала для моста.'}</p></div></div>
 <div className="mw-step-list">{missionItems.map(x => <button key={x.id} className={x.done ? 'mw-step done' : 'mw-step'} onClick={() => {
                setTab('tasks');
                toast('Найди задание «' + x.title + '»');
              }}><span>{x.done ? '✅' : '○'}</span>{x.material}<small>{x.done ? 'Найдено' : 'Нужно найти'}</small></button>)}</div>
 <button className="mw-primary" onClick={() => missionDone ? toast('Первая миссия завершена! Следующее приключение скоро.') : setTab('tasks')}>{missionDone ? '🎉 Миссия завершена' : '🎯 Собрать материалы'} <span>→</span></button>
 </section>
 <div className="mw-section-heading"><h2>Что построим?</h2><span>Выбирай сам</span></div>
 <div className="mw-build-grid">{[['🏡', 'Домик'], ['🌉', 'Мостик'], ['🌷', 'Цветник'], ['🏠', 'Домик собаки']].map(([emoji, title]) => <button className="mw-build" key={title} onClick={() => build(title)}><span>{emoji}</span><strong>{title}</strong><small>{building.includes(title) ? '✓ Построено' : '⭐ 80 опыта'}</small></button>)}</div>

 </>}
 {tab === 'tasks' && <>
 <section className="mw-greeting"><div className="mw-eyebrow">ТВОИ ДОБРЫЕ ДЕЛА</div><h1>{parent ? 'Проверка заданий' : 'Задания на сегодня'}</h1><p>{parent ? 'Проверяйте дела Ильи, новые задания появляются каждый день.' : 'Выполняй дела, собирай материалы и развивай остров.'}</p></section>
 {parent?<section className="mw-panel mw-task-admin">
 <button className="mw-primary" type="button" onClick={()=>setEditorOpen(x=>!x)}>{editorOpen?'✕ Закрыть форму':'＋ Добавить задание'} <span>✎</span></button>
 {editorOpen&&<form className="mw-new-task" onSubmit={e=>{e.preventDefault();createTask(newTitle,Number(newPoints),newEmoji,newRepeat);setNewTitle('');setEditorOpen(false)}}>
  <label>Название задания<input required maxLength={120} value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Например, полить растения"/></label>
  <label>Баллы<input required type="number" min="1" max="500" value={newPoints} onChange={e=>setNewPoints(e.target.value)}/></label>
  <label>Значок<input maxLength={4} value={newEmoji} onChange={e=>setNewEmoji(e.target.value)}/></label>
  <label className="mw-checkline"><input type="checkbox" checked={newRepeat} onChange={e=>setNewRepeat(e.target.checked)}/> Повторять каждый день</label>
  <button type="submit" className="mw-primary">Сохранить задание</button>
 </form>}
 {proposals.some(x=>x.status==='pending')&&<div className="mw-offers"><h3>💡 Предложения Ильи</h3>{proposals.filter(x=>x.status==='pending').map(x=><div className="mw-offer-row" key={x.id}><div><strong>{x.title}</strong><small>Предложено: {x.points} монет</small></div><button onClick={()=>reviewProposal(x.id,true)}>✓ Принять</button><button onClick={()=>reviewProposal(x.id,false)}>✕</button></div>)}</div>}
 </section>:<section className="mw-panel mw-task-admin">
 <h3>💡 Предложить задание родителю</h3>
 <p className="mw-task-explain">Ты можешь предложить дело, а родители решат, добавлять ли его.</p>
 <form className="mw-proposal-form" onSubmit={e=>{e.preventDefault();offerTask()}}>
  <input required maxLength={120} placeholder="Например, помочь в саду" value={proposalTitle} onChange={e=>setProposalTitle(e.target.value)}/>
  <label>Баллы <input type="number" min="1" max="500" value={proposalPoints} onChange={e=>setProposalPoints(e.target.value)}/></label>
  <button type="submit">Предложить</button>
 </form>
 {proposals.filter(p=>p.status==='pending').map(p=><p className="mw-pending-offer" key={p.id}>⏳ «{p.title}» ожидает решения родителя</p>)}
 </section>}
 <div className="mw-tasks-progress"><div><strong>{finished} из {chores.length}</strong><span>выполнено сегодня</span></div><div className="mw-task-track"><div style={{
                width: `${finished / chores.length * 100}%`
              }} /></div></div>
 <div className="mw-section-heading"><h2>Сегодня</h2><span>Обновление каждый день</span></div>
 {chores.map(x => <div className={'mw-chore ' + (x.done ? 'mw-chore-done' : '')} key={x.id}><div className="mw-task-emoji">{x.emoji}</div><div className="mw-task-body"><strong>{x.title}</strong><small>{x.done ? '✓ Готово' : (x.repeat===false?'Разовое задание':'Ежедневное дело')}</small></div><div className="mw-task-right"><b>+{x.points} 🪙</b>{parent&&pendingChores.includes(x.id)?<><button onClick={()=>approveChore(x.id)}>✓ Принять</button><button onClick={()=>declineChore(x.id)}>✕</button></>:<button disabled={x.done || parent || pendingChores.includes(x.id)} onClick={() => mark(x.id)}>{x.done ? '✓' : pendingChores.includes(x.id) ? 'Ожидает' : parent ? 'Контроль' : 'Готово'}</button>}</div></div>)}
 <div className="mw-note">ℹ️ Это демонстрационные данные отдельного прототипа. Для реальных начислений потребуется новый сервер или безопасное подключение к существующему.</div>
 </>}
 {tab === 'shop' && <>
 <section className="mw-greeting"><div className="mw-eyebrow">МАГАЗИН НАГРАД</div><h1>Сокровища острова 🎁</h1><p>Получай награды за заработанные монеты. Заказы подтверждают родители.</p></section>
 <div className="mw-wallet"><span>ТВОИ МОНЕТЫ</span><strong>🪙 {coins}</strong><p>Накопи на то, что тебе нравится</p></div>
 <div className="mw-section-heading"><h2>Доступные награды</h2></div>
 <div className="mw-reward-grid">{prices.map(x => <article key={x.id} className="mw-reward"><div className="mw-reward-icon">{x.emoji}</div><h3>{x.title}</h3><div className="mw-reward-foot"><strong>🪙 {x.price}</strong><button disabled={parent || pending.includes(x.id)} onClick={() => buy(x.id)}>{pending.includes(x.id) ? 'В ожидании' : 'Получить'}</button></div></article>)}</div>
 {parent && pending.length > 0 && <section className="mw-panel"><h3>Заявки на одобрение</h3>{pending.map((id, i) => <div className="mw-request" key={i}><span>{prices.find(p => p.id === id)?.title}</span><button onClick={() => approve(id)}>Одобрить ✓</button></div>)}</section>}
 </>}
 {tab === 'family' && <>
 <section className="mw-greeting"><div className="mw-eyebrow">ТОЛЬКО ДЛЯ НАС ТРОИХ</div><h1>Семья ❤️</h1><p>Наш личный семейный уголок.</p></section>
 <div className="mw-members"><span>👨 Папа</span><span>👩 Мама</span><span>👦 Илья</span></div>
 <div className="mw-chat">{chat.map((m, i) => <div key={i} className={'mw-chat-msg ' + (m.self ? 'self' : '')}><small>{m.who}</small><p>{m.message}</p></div>)}</div>
 <form className="mw-chat-input" onSubmit={e => {
            e.preventDefault();
            send();
          }}><input placeholder="Написать семье..." value={draft} onChange={e => setDraft(e.target.value)} /><button>➤</button></form>
 <div className="mw-note">Переписка в демонстрации локальная, к действующему чату пока не подключена.</div><p className="mw-note">3D-модели: Quaternius, CreativeTrio, Kenney (CC0), белка — Simon Graff (CC BY 3.0). <a href="https://poly.pizza/m/dQdmcEiCXU3" target="_blank" rel="noreferrer">Источник и лицензия белки</a>.</p>
 </>}
 </div>
 <nav className="mw-bottom" aria-label="Навигация">{nav.map(([id, ico, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><span>{ico}</span><small>{label}</small>{id === 'shop' && pending.length > 0 && <i>{pending.length}</i>}</button>)}</nav>
 {message && <div className="mw-toast" role="status">{message}</div>}
 </div>
 </main>;
};