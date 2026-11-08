import {DailyTextReader} from '../../daily/DailyTextReader';
import {LocalNotifications} from '@capacitor/local-notifications';
import {Capacitor} from '@capacitor/core';
import {SchoolHub,useSchoolNotificationSync} from '../../school/SchoolHub';
import {useSchool} from '../../school/useSchool';
import {WorldSafe} from './WorldSafe';
import {MusicControl} from '../../features/MusicControl';
import {FamilyChat} from '../../chat/FamilyChat';
import {useChildPresence} from '../../features/useChildPresence';
import {SoundControl} from '../../features/SoundControl';
import {PushCenter} from '../../features/PushCenter';
import {UpdateCenter} from '../../features/UpdateCenter';
import {NotificationInbox} from '../../notifications/NotificationInbox';
import {isSoundEnabled,playSound} from '../../features/sounds';
import {useFamilyCloud} from '../../lib/useFamilyCloud';
import {CloudSignIn,CloudTasks,CloudShop,CloudSpiritual} from './CloudPanels';
import {World3D} from '../../legacyWorld/World3D';
import {WORLD_01_OBJECTS,WORLD_01_END} from '../../legacyWorld/world01';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import './MyWorld.css';
type Tab = 'world' | 'tasks' | 'shop' | 'family' | 'spiritual' | 'settings' | 'school';
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
const nav: [Tab, string, string][] = [['world', '🌍', 'Мир'], ['tasks', '✅', 'Дела'], ['school', '📚', 'Учёба'], ['shop', '🎁', 'Магазин'], ['spiritual', '🌾', 'Духовный рост'], ['family', '💬', 'Семья']];
const SAVE_KEY='moymir2-demo-2.4';
const OLD_SAVE_KEY='moymir2-demo-2.1';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function readSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null')}catch{return null}}
export const GeneratedComponent = () => {
 const cloud=useFamilyCloud();
 const school=useSchool(cloud.familyId,cloud.childId,!!cloud.role&&!!cloud.session&&!cloud.error);
 const reminders=useSchoolNotificationSync(school,cloud);
 useChildPresence(cloud.role==='child'&&!!cloud.session,cloud.session?.user.id||'');
 const [showConnection,setShowConnection]=useState(false);
 const askMiro=(question:string)=>{try{sessionStorage.setItem('moymir-miro-next-question',question.slice(0,1400))}catch{}setTab('world')};
 useEffect(()=>{
  if(!Capacitor.isNativePlatform()||!Capacitor.isPluginAvailable('LocalNotifications'))return;
  let active=true;
  const subscription=LocalNotifications.addListener('localNotificationActionPerformed',event=>{
   if(!active)return;
   const section=event.notification.extra?.section;
   if(section==='school'||section==='spiritual')setTab(section);
   else if(section==='updates')setTab('settings');
  }).catch(e=>console.warn('Reminders navigation unavailable',e));
  return()=>{active=false;void subscription.then(listener=>{if(listener)return listener.remove()})};
 },[]);

 useEffect(()=>{
  const open=(e:Event)=>{const data=(e as CustomEvent).detail||{};if(data.section==='school')setTab('school');else if(data.section==='spiritual')setTab('spiritual');else if(data.kind==='chat_message')setTab('family');else if(data.kind==='child_app_open'||data.kind==='daily_submitted'||data.kind==='task_submitted')setTab('settings');else setTab('settings')};
  window.addEventListener('moymir-notification-open',open);
  return()=>window.removeEventListener('moymir-notification-open',open);
 },[]);

  const saved=useMemo(()=>readSave(),[]);
  const [day,setDay]=useState(today());

  const [tab, setTab] = useState<Tab>('world');
  const [previewWorld,setPreviewWorld]=useState<1|2>(1);
  const [worldAdvanceError,setWorldAdvanceError]=useState('');
  const [advancingWorld,setAdvancingWorld]=useState(false);
  const [chores, setChores] = useState<Chore[]>(()=>saved?.day===today()&&Array.isArray(saved?.chores)?saved.chores:(saved?.templates??initial).map((x:Chore)=>({...x,done:false})));
  const [templates,setTemplates]=useState<Chore[]>(saved?.templates??initial.map(x=>({...x,repeat:true,done:false})));
  const [coins, setCoins] = useState<number>(saved?.coins??0);
  const [xp, setXp] = useState<number>(saved?.xp??0);
  const [pending, setPending] = useState<number[]>(saved?.pending??[]);
  const [pendingChores,setPendingChores]=useState<number[]>(saved?.day===today()?saved?.pendingChores??[]:[]);
  const [parent, setParent] = useState(false);
  const [parentPinHash,setParentPinHash]=useState(()=>{try{return localStorage.getItem('moymir2-parent-pin-v1')||''}catch{return ''}});
  const [pinOpen,setPinOpen]=useState(false);
  const [pinInput,setPinInput]=useState('');
  const [pinAgain,setPinAgain]=useState('');
  const [pinError,setPinError]=useState('');
  async function enterParent(){
    if(!/^\d{4,6}$/.test(pinInput)){setPinError('Введите от 4 до 6 цифр');return}
    try{
      const hashBuffer=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('moymir2-parent-pin-v1:'+pinInput));
      const hash=Array.from(new Uint8Array(hashBuffer)).map(x=>x.toString(16).padStart(2,'0')).join('');
      if(!parentPinHash){
        if(pinInput!==pinAgain){setPinError('Коды не совпадают');return}
        localStorage.setItem('moymir2-parent-pin-v1',hash);setParentPinHash(hash);
      }else if(hash!==parentPinHash){setPinError('Неверный родительский код');return}
      setPinOpen(false);setPinInput('');setPinAgain('');setPinError('');setParent(true);
    }catch{setPinError('Не удалось проверить код')}
  }
  function switchRole(){if(parent){setParent(false);return}setPinInput('');setPinAgain('');setPinError('');setPinOpen(true)}

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
  const [sound, setSound] = useState(isSoundEnabled);
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
  const connected=!!cloud.session&&!!cloud.role&&!!cloud.familyId;
  const shownParent=connected?cloud.role==='parent':parent;
  const actualCoins=connected?cloud.balance:0;
  const actualXp=connected?cloud.worldPoints:0;
  const firstWorldComplete=actualXp>=WORLD_01_END||(connected&&cloud.worldNumber===2);
  const previousCloudProgress=useRef<{points:number;balance:number}|null>(null);
  useEffect(()=>{
    if(!connected){previousCloudProgress.current=null;return}
    const old=previousCloudProgress.current;
    if(old){
      if(actualXp>old.points)playSound('build');
      else if(actualCoins>old.balance)playSound('coin');
    }
    previousCloudProgress.current={points:actualXp,balance:actualCoins};
  },[connected,actualXp,actualCoins]);
  const actualWorld=previewWorld===2&&cloud.worldNumber===2?2:1;
  useEffect(()=>{if(connected&&cloud.worldNumber===2)setPreviewWorld(2)},[connected,cloud.worldNumber]);
  const actualWorldPoints=actualWorld===2?Math.max(0,actualXp-WORLD_01_END):Math.min(WORLD_01_END,actualXp);
  const finished = chores.filter(x => x.done).length;
  const missionItems = chores.slice(0, 3);
  const missionDone = missionItems.every(x => x.done);
  const nextXp = 500 - xp % 500;
  const currentWorld=actualWorld;
  const pointsInWorld=actualWorldPoints;
  const nextWorldStage=WORLD_01_OBJECTS.find(o=>o.at>pointsInWorld);
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
    setCoins(n=>n+task.points);setXp(n=>n+task.points);
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
 <div className="mw-identity"><div className="mw-logo">✦</div><div><strong>МОЙ МИР <span className="mw-beta">2.9.3</span></strong><span>Остров приключений</span></div></div>
 <div className="mw-head-stats"><button className="mw-star-counter" onClick={() => setTab('world')}>⭐ {actualXp}</button><button className="mw-coin" onClick={() => setTab('shop')}>🪙 <b>{actualCoins}</b></button><button aria-label="Открыть настройки" onClick={()=>setTab('settings')}>⚙️</button></div>
 </div>
 <div className="mw-hero-profile"><div className="mw-profile-avatar"><img src={import.meta.env.BASE_URL+'brand/icon.png'} alt="Миро EV"/></div><div><strong>Миро EV</strong><small>👦 {connected?cloud.childName:'Илья'} · ⭐ {actualXp} звёзд</small><span>🌍 Мой Мир · уровень {Math.max(1,Math.floor(actualXp/100)+1)}</span></div></div>
 <div className="mw-tabs-top">
 <button className={!shownParent ? 'selected' : ''} onClick={() => {if(!cloud.session)setShowConnection(true);else setTab('tasks')}}>👦 Илья</button>
 <button className={shownParent ? 'selected' : ''} onClick={() => {if(!cloud.session)setShowConnection(true);else if(cloud.role==='child')setShowConnection(true);else setTab('tasks')}}>👨‍👩‍👦 Родители</button>
 <SoundControl onChange={setSound}/>
 </div>
 <div className="mw-cloud-syncbar">{connected?<><span>☁️ {cloud.childName} · Прежний прогресс подключён</span><button onClick={()=>void cloud.refresh()}>↻</button><button onClick={()=>setShowConnection(v=>!v)}>Аккаунт</button></>:<><span>{cloud.loading?'Загружаем семейный прогресс…':'☁️ Подключи прежние баллы и достижения'}</span><button onClick={()=>setShowConnection(true)}>Войти</button></>}</div> <div className={tab==='family'&&connected?'mw-scroll mw-family-screen':'mw-scroll'}>
 <div className="mw-system-stack" style={{display:tab==='settings'?'flex':'none'}}><UpdateCenter/>{connected&&cloud.session&&<><NotificationInbox userId={cloud.session.user.id} familyId={cloud.familyId}/><PushCenter userId={cloud.session.user.id}/></>}</div>
 {showConnection&&(connected?<section className="mw-panel mw-cloud-account"><h3>Семейный аккаунт</h3><p>{cloud.session?.user.email}</p><button onClick={()=>{void cloud.logout();setShowConnection(false)}}>Выйти</button><button onClick={()=>setShowConnection(false)}>Закрыть</button></section>:tab==='world'?<CloudSignIn cloud={cloud}/>:null)}
 {cloud.error&&cloud.session&&<div className="mw-note" role="alert">Ошибка загрузки: {cloud.error} <button onClick={()=>void cloud.refresh()}>Повторить</button></div>}
 {tab === 'world' && <>
 <section className="mw-greeting"><div><div className="mw-eyebrow">{shownParent ? 'КАБИНЕТ РОДИТЕЛЯ' : 'ТВОЁ ПРИКЛЮЧЕНИЕ'}</div><h1>{shownParent ? 'Мир Ильи' : 'Привет, Илья! 👋'}</h1><p>{shownParent ? 'Здесь видно, как занятия превращаются в достижения.' : 'Остров меняется благодаря твоим добрым делам.'}</p></div></section>
 <div className="mw-worldswitch"><button className={currentWorld===1?'active':''} onClick={()=>setPreviewWorld(1)}>🏡 Домик на поляне</button><button className={currentWorld===2?'active':''} disabled={cloud.worldNumber!==2} onClick={()=>setPreviewWorld(2)}>🌳 Домик на дереве {cloud.worldNumber!==2?'🔒':''}</button></div>
 <WorldSafe key={currentWorld} worldNumber={currentWorld} points={pointsInWorld} spiritualPoints={connected?cloud.spiritualPoints:0} soundEnabled={sound}><World3D points={pointsInWorld} worldNumber={currentWorld} soundEnabled={sound}/></WorldSafe>
 {!connected&&<button className="mw-primary" onClick={()=>setShowConnection(true)}>☁️ Подключить мои прежние достижения</button>}
 {connected&&<div className="mw-balance-summary"><span>⭐ Заработано: {cloud.worldPoints}</span><span>🪙 Баланс: {cloud.balance}</span><span>🎁 Наград: {cloud.rewards.length}</span></div>}
 <section className="mw-progress"><div className="mw-progress-head"><strong>⭐ Очки развития</strong><span>{pointsInWorld} / {WORLD_01_END}</span></div>
 <div className="mw-progress-track"><div style={{width:`${pointsInWorld/WORLD_01_END*100}%`}}/></div>
 <p>{nextWorldStage?'Следующее улучшение: '+nextWorldStage.title+' — '+nextWorldStage.at+' очков':'Все 30 этапов этого мира открыты!'}</p></section>
 {firstWorldComplete&&currentWorld===1&&cloud.worldNumber===1&&<div className="mw-panel"><p>🎉 Первый мир завершён! Илья может открыть домик на дереве. Старый мир останется доступен.</p>
 {cloud.role==='child'?<button className="mw-primary" disabled={advancingWorld} onClick={()=>{setAdvancingWorld(true);setWorldAdvanceError('');void cloud.rpc('advance_my_world',{p_family:cloud.familyId}).then(()=>setPreviewWorld(2)).catch(e=>setWorldAdvanceError(e instanceof Error?e.message:'Ошибка перехода')).finally(()=>setAdvancingWorld(false))}}>{advancingWorld?'Открываем мир…':'🌳 Открыть второй мир'}</button>:<small>Переход подтверждается из аккаунта ребёнка.</small>}
 {worldAdvanceError&&<p role="alert" className="mw-cloud-error">{worldAdvanceError}</p>}</div>}
 {cloud.worldNumber===2&&currentWorld===1&&<button className="mw-primary" onClick={()=>setPreviewWorld(2)}>🌳 Вернуться ко второму миру</button>}
 {connected&&<section className="mw-panel school-dashboard-link"><div><strong>🎒 Уроки сегодня</strong><p>{school.lessons.filter(x=>x.weekday===new Date().getDay()).sort((a,b)=>a.lesson_order-b.lesson_order).map(x=>x.subject).join(' · ')||'Добавьте расписание в разделе «Учёба»'}</p></div><button onClick={()=>setTab('school')}>Открыть</button></section>}
 <section className="mw-panel"><div className="mw-section-label">КАК РАЗВИВАТЬ МИР</div><p className="mw-task-explain">Каждое подтверждённое родителем задание приносит монеты и очки развития. Постройки возникают сами, в прежнем порядке. Трогай Миро на острове: он увеличится и поможет разобраться с уроками.</p><button className="mw-primary" onClick={()=>setTab('tasks')}>Посмотреть задания →</button></section>
 </>}
 {tab === 'tasks' && (connected?<CloudTasks cloud={cloud}/>:<CloudSignIn cloud={cloud}/>)}
 {tab === 'school' && (connected?<SchoolHub cloud={cloud} school={school} reminders={reminders} onAskMiro={askMiro}/>:<CloudSignIn cloud={cloud}/>)}
 {tab === 'shop' && (connected?<CloudShop cloud={cloud}/>:<CloudSignIn cloud={cloud}/>)}
 {tab === 'spiritual' && (connected?<><DailyTextReader cloud={cloud} onAskMiro={askMiro} onSchoolSettings={()=>setTab('school')}/><CloudSpiritual cloud={cloud}/></>:<CloudSignIn cloud={cloud}/>)}
 {tab === 'family' && <><section className="mw-greeting"><div className="mw-eyebrow">НАШ СЕМЕЙНЫЙ ЧАТ</div><h1>Семья ❤️</h1><p>Сообщения доставляются всем участникам семьи.</p></section>{connected&&cloud.session?<FamilyChat familyId={cloud.familyId} userId={cloud.session.user.id}/>:<CloudSignIn cloud={cloud}/>}</>}
 {tab === 'settings' && <><section className="mw-greeting"><div className="mw-eyebrow">МОЙ МИР · УПРАВЛЕНИЕ</div><h1>⚙️ Настройки</h1><p>Уведомления, звуки, обновления и твой духовный рост.</p></section><div className="mw-settings-tile"><strong>🔔 Уведомления</strong><p>Сообщения семьи, достижения и родительские решения. Разреши системные уведомления в Android.</p></div><div className="mw-settings-tile"><strong>🎵 Системные звуки и музыка</strong><p>Звуки кнопок, наград и строительства.</p><SoundControl onChange={setSound}/><MusicControl/></div><div className="mw-settings-tile"><strong>📚 Учёба и расписание</strong><p>Предметы, домашние задания и время напоминаний.</p><button onClick={()=>setTab('school')}>Открыть расписание</button></div><div className="mw-settings-tile"><strong>🌾 Мой духовный рост</strong><p>Личная шкала и библейские занятия.</p><button onClick={()=>setTab('spiritual')}>Открыть</button></div><div className="mw-settings-tile"><strong>🚀 Обновления</strong><p>Проверка новой версии и установка без переустановки APK.</p></div>{connected&&<div className="mw-settings-tile"><strong>👨‍👩‍👦 Вход Ильи</strong><p>Уведомление родителю, когда Илья открывает приложение. Не чаще одного раза в 15 минут.</p></div>}</>}

 </div>
 <nav className="mw-bottom" aria-label="Навигация">{nav.map(([id, ico, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><span>{ico}</span><small>{label}</small>{id === 'shop' && pending.length > 0 && <i>{pending.length}</i>}</button>)}</nav>
 {false&&pinOpen&&<div className="mw-pin-overlay" role="dialog" aria-label="Вход родителя" aria-modal="true"><form className="mw-pin-card" onSubmit={e=>{e.preventDefault();void enterParent()}}>
 <div className="mw-pin-icon">🔐</div><h2>{parentPinHash?'Вход для родителей':'Создать код родителя'}</h2>
 <p>{parentPinHash?'Введите созданный вами код, чтобы редактировать задания и подтверждать награды.':'Установите родительский код из 4–6 цифр. Ребёнок не сможет открыть настройки простым нажатием.'}</p>
 <label>Родительский код<input aria-label="Родительский код" type="password" inputMode="numeric" autoComplete="off" minLength={4} maxLength={6} pattern="[0-9]{4,6}" value={pinInput} onChange={e=>setPinInput(e.target.value.replace(/\D/g,''))} required/></label>
 {!parentPinHash&&<label>Повторите код<input aria-label="Повторите код" type="password" inputMode="numeric" autoComplete="off" minLength={4} maxLength={6} pattern="[0-9]{4,6}" value={pinAgain} onChange={e=>setPinAgain(e.target.value.replace(/\D/g,''))} required/></label>}
 {pinError&&<p className="mw-pin-error">{pinError}</p>}
 <div className="mw-pin-actions"><button type="button" onClick={()=>{setPinOpen(false);setPinError('')}}>Отмена</button><button type="submit">{parentPinHash?'Войти':'Создать код'}</button></div>
 <small>Это локальная защита тестовой версии, а не серверная семейная авторизация.</small>
 </form></div>}
 {message && <div className="mw-toast" role="status">{message}</div>}
 </div>
 </main>;
};