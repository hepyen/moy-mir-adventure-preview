import {MiroWardrobeProvider} from '../../legacyWorld/miroWardrobe';
import {RoomCloudContext} from '../../legacyWorld/RoomCloudContext';
import {UpcomingFamilyEvent} from '../../features/UpcomingFamilyEvent';
import {CalendarNotice} from '../../features/CalendarNotice';
import {SectionNav} from './SectionNav';
import type {SectionItem} from './SectionNav';
import {FamilySafety} from '../../features/FamilySafety';
import {FamilyManagement} from '../../features/FamilyManagement';
import {useIslandStory} from '../../legacyWorld/useIslandStory';
import {IslandStory} from '../../legacyWorld/IslandStory';
import {PlayTimeBank} from '../../playtime/PlayTimeBank';
import {MiroAlarmPanel,syncMiroAlarmLessons} from '../../alarm/MiroAlarm';
import {useAppTheme,AppThemeSwitch} from '../../theme/useAppTheme';
import {updateMiroDayContext} from '../../day/miroContext';
import {MyDay} from '../../day/MyDay';
import {AdventureHub,useAdventureGame} from '../../legacyWorld/AdventureHub';
import {IslandMoments} from '../../legacyWorld/IslandMoments';
import {lazy,Suspense} from 'react';
const HealthHub=lazy(()=>import('../../health/HealthHub').then(m=>({default:m.HealthHub})));
import {attachMusicLifecycle,setMusicScene} from '../../features/music';
const OceanWorld=lazy(()=>import('../../legacyWorld/OceanWorld').then(m=>({default:m.OceanWorld})));
const SpaceWorld=lazy(()=>import('../../legacyWorld/SpaceWorld').then(m=>({default:m.SpaceWorld})));
const World3D=lazy(()=>import('../../legacyWorld/World3D').then(m=>({default:m.World3D}))); 
import {DailyTextReader} from '../../daily/DailyTextReader';
import {LocalNotifications} from '@capacitor/local-notifications';
import {Capacitor} from '@capacitor/core';
import {useSchoolNotificationSync} from '../../school/useSchoolNotificationSync';
const SchoolHub=lazy(()=>import('../../school/SchoolHub').then(m=>({default:m.SchoolHub})));
import {useSchool} from '../../school/useSchool';
import {WorldSafe} from './WorldSafe';
import {MusicControl} from '../../features/MusicControl';
const FamilyChat=lazy(()=>import('../../chat/FamilyChat').then(m=>({default:m.FamilyChat})));
import {useChildPresence} from '../../features/useChildPresence';
import {SoundControl} from '../../features/SoundControl';
import {PushCenter} from '../../features/PushCenter';
import {UpdateCenter} from '../../features/UpdateCenter';
import {ParentChildAccess} from '../../features/ParentChildAccess';
import {NotificationInbox} from '../../notifications/NotificationInbox';
import {ParentApprovals} from '../../features/ParentApprovals';
import {ParentWake,ChildWake,RemoteWakeSetup,wakeNative} from '../../alarm/RemoteWake';
import {notificationDestination} from '../../notifications/destinations';
import type {Destination,NotificationPayload,Tab} from '../../notifications/destinations';
import {isSoundEnabled,playSound} from '../../features/sounds';
import {useFamilyCloud} from '../../lib/useFamilyCloud';
import {CloudSignIn,CloudTasks,CloudShop,CloudSpiritual} from './CloudPanels';

import {WORLD_01_OBJECTS,WORLD_01_END} from '../../legacyWorld/world01';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import './MyWorld.css';
import {WorldCelebration} from './WorldCelebration';
import {TREEHOUSE_STAGES} from '../../legacyWorld/treehouseStages';
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
const sectionDefaults:Record<Tab,string>={world:'island',tasks:'today',school:'schedule',shop:'catalog',spiritual:'today',family:'overview',settings:'general',health:'today'};
const sectionItems:Record<Exclude<Tab,'health'>,SectionItem[]>={
 world:[{id:'island',label:'Мой остров',icon:'🌍'},{id:'day',label:'Мой день',icon:'☀️'},{id:'health',label:'Здоровье',icon:'💚'},{id:'adventure',label:'Приключения',icon:'🧭'},{id:'progress',label:'Прогресс',icon:'🏆'}],
 tasks:[{id:'today',label:'Сегодня',icon:'✅'},{id:'proposals',label:'Предложения',icon:'💡'},{id:'manage',label:'Управление',icon:'✏️'},{id:'history',label:'История',icon:'📋'}],
 school:[{id:'schedule',label:'Расписание',icon:'🗓️'},{id:'homework',label:'Домашние',icon:'📝'},{id:'tutors',label:'Тренажёры',icon:'📚'},{id:'academy',label:'Академия',icon:'🧭'},{id:'backpack',label:'Рюкзак',icon:'🎒'}],
 shop:[{id:'catalog',label:'Награды',icon:'🎁'},{id:'time',label:'Игровое время',icon:'🎮'},{id:'orders',label:'Заказы',icon:'🧾'}],
 spiritual:[{id:'today',label:'Сегодня',icon:'🌾'},{id:'text',label:'Ежедневный стих',icon:'📖'},{id:'qualities',label:'Качества',icon:'🌱'},{id:'bible',label:'Приключения',icon:'🗺️'},{id:'quiz',label:'Викторина',icon:'🏅'},{id:'requests',label:'Предложения',icon:'💡'}],
 family:[{id:'overview',label:'Обзор',icon:'🏠'},{id:'chat',label:'Чат',icon:'💬'},{id:'calendar',label:'Календарь',icon:'🗓️'},{id:'safety',label:'Безопасность',icon:'🛡️'}],
 settings:[{id:'general',label:'Внешний вид',icon:'🎨'},{id:'alarm',label:'Будильник',icon:'⏰'},{id:'notifications',label:'Уведомления',icon:'🔔'},{id:'school',label:'Учебные напоминания',icon:'📚'},{id:'account',label:'Аккаунт',icon:'🔐'},{id:'updates',label:'Обновления',icon:'🚀'}]
};
function destinationSection(next:Destination){if(next.tab==='family')return next.fallback==='family-calendar'?'calendar':'chat';const target=next.anchor||next.fallback||'';if(next.tab==='tasks')return target.includes('proposal')?'proposals':target.includes('behavior')?'history':'today';if(next.tab==='shop')return target.includes('playtime')?'time':target.includes('reward')?'orders':'catalog';if(next.tab==='spiritual')return target.includes('review-spiritual')?'requests':'today';if(next.tab==='settings')return target==='app-updates'?'updates':'notifications';return sectionDefaults[next.tab]}

const SAVE_KEY='moymir2-demo-2.4';
const OLD_SAVE_KEY='moymir2-demo-2.1';
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function readSave(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null')}catch{return null}}
export const GeneratedComponent = () => {
 const cloud=useFamilyCloud();
 const theme=useAppTheme(cloud.childId||'local-ilya');
 const school=useSchool(cloud.familyId,cloud.childId,!!cloud.role&&!!cloud.session&&!!cloud.familyId,cloud.session?.user.id||'');
 const reminders=useSchoolNotificationSync(school,cloud);
 useEffect(()=>{
  if(!cloud.session||!cloud.role||school.loading||!school.cachedAt)return;
  void syncMiroAlarmLessons(school.lessons).catch(e=>console.warn('Miro lesson sync',e));
 },[cloud.session?.user.id,cloud.role,school.loading,school.cachedAt,school.lessons]);
 const story=useIslandStory(cloud.familyId,cloud.childId,!!cloud.role&&!!cloud.session);
 useChildPresence(cloud.role==='child'&&!!cloud.session,cloud.session?.user.id||'');
 const [showConnection,setShowConnection]=useState(false);
 const askMiro=(question:string)=>{try{sessionStorage.setItem('moymir-miro-next-question',question.slice(0,1400))}catch{}setSectionFor('world','island');setTab('world');window.dispatchEvent(new Event('moymir-open-miro'))};
 useEffect(()=>{
  if(!Capacitor.isNativePlatform()||!Capacitor.isPluginAvailable('LocalNotifications'))return;
  let active=true;
  const subscription=LocalNotifications.addListener('localNotificationActionPerformed',event=>{
   if(!active)return;
   const data=event.notification.extra;
   const next=notificationDestination({kind:typeof data?.kind==='string'?data.kind:undefined,
    section:typeof data?.section==='string'?data.section:undefined,
    source_id:typeof data?.source_id==='string'?data.source_id:undefined});
   if(next)openDestination(next);
  }).catch(e=>console.warn('Reminders navigation unavailable',e));
  return()=>{active=false;void subscription.then(listener=>{if(listener)return listener.remove()})};
 },[]);

  const saved=useMemo(()=>readSave(),[]);
  const [day,setDay]=useState(today());

  const [tab, setTab] = useState<Tab>('world');
  const [sections,setSections]=useState<Record<Tab,string>>({...sectionDefaults});
  const section=sections[tab];
  function setSectionFor(target:Tab,value:string){setSections(prev=>({...prev,[target]:value}))}
  function goSettings(value:string){setSectionFor('settings',value);setTab('settings')}

  const scrollScreen=useRef<HTMLDivElement>(null);
  const [destination,setDestination]=useState<Destination|null>(null);
  const [missingTarget,setMissingTarget]=useState(false);
  function openDestination(next:Destination){
   setMissingTarget(false);
   setDestination({...next});
   setSectionFor(next.tab,destinationSection(next));
   setTab(next.tab);
  }
  useEffect(()=>{if(scrollScreen.current)scrollScreen.current.scrollTop=0},[tab,section]);
  useEffect(()=>{
   const open=(event:Event)=>{
    const payload=(event as CustomEvent<NotificationPayload>).detail;
    const next=payload&&notificationDestination(payload);
    if(!next)return;
    openDestination(next);
    void cloud.refresh();
   };
   window.addEventListener('moymir-notification-open',open);
   return()=>window.removeEventListener('moymir-notification-open',open);
  },[cloud.refresh]);
  useEffect(()=>{
   if(!destination)return;
   if(destination.tab!==tab){setDestination(null);setMissingTarget(false);return}
   const root=scrollScreen.current;
   if(!root||!destination.anchor)return;
   const {anchor,fallback}=destination;
   let highlighted:HTMLElement|null=null;
   function focus(id:string){
    const target=document.getElementById(id);
    if(!target||!root?.contains(target))return false;
    for(let parent=target.parentElement;parent&&parent!==root;parent=parent.parentElement){
     if(parent instanceof HTMLDetailsElement)parent.open=true;
    }
    highlighted?.classList.remove('mw-notification-target');
    target.classList.add('mw-notification-target');
    if(target.tabIndex<0&&!target.hasAttribute('tabindex'))target.tabIndex=-1;
    target.focus({preventScroll:true});
    target.scrollIntoView({block:'center'});
    highlighted=target;
    return true;
   }
   const observer=new MutationObserver(()=>{
    if(focus(anchor)){setMissingTarget(false);observer.disconnect()}
   });
   const delay=window.setTimeout(()=>{
    if(highlighted||focus(anchor))return;
    if(fallback){
     if(anchor!==fallback)setMissingTarget(true);
     focus(fallback);
    }
   },3200);
   const stopWatching=window.setTimeout(()=>observer.disconnect(),12000);
   const frame=requestAnimationFrame(()=>{
    if(!focus(anchor))observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['id']});
   });
   return()=>{
    cancelAnimationFrame(frame);
    clearTimeout(delay);
    clearTimeout(stopWatching);
    observer.disconnect();
    highlighted?.classList.remove('mw-notification-target');
   };
  },[destination,tab]);
  useEffect(()=>{
   if(!cloud.session){setDestination(null);setMissingTarget(false);setSections({...sectionDefaults})}
  },[cloud.session?.user.id]);

  const [previewWorld,setPreviewWorld]=useState<1|2|3|4>(1);
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
  useEffect(()=>{
   if(!cloud.session||!cloud.role){updateMiroDayContext(null);return}
   const date=today();const wd=new Date(date+'T12:00:00Z').getUTCDay();
   const actualLessons=school.lessons.filter(x=>x.weekday===wd).sort((a,b)=>a.lesson_order-b.lesson_order);
   let nextDate='',nextWd=0;
   for(let offset=1;offset<=7;offset++){
    const target=new Date(date+'T12:00:00Z');target.setUTCDate(target.getUTCDate()+offset);
    const d=target.getUTCDay();if(school.lessons.some(x=>x.weekday===d)){nextDate=target.toISOString().slice(0,10);nextWd=d;break}
   }
   const tomorrow=school.lessons.filter(x=>x.weekday===nextWd).sort((a,b)=>a.lesson_order-b.lesson_order);
   const available=cloud.rewards.filter(r=>r.active!==false&&Number(r.cost||0)>cloud.balance).sort((a,b)=>Number(a.cost||0)-Number(b.cost||0))[0];
   updateMiroDayContext({userId:cloud.session.user.id,date,lessons:actualLessons.map(x=>x.subject),nextDay:nextDate,nextLessons:tomorrow.map(x=>x.subject),
    backpack:school.backpackItems.filter(x=>tomorrow.some(l=>l.subject===x.subject)).map(x=>x.item),
    homework:school.homework.filter(x=>!x.completed_at).slice(0,5).map(x=>({subject:x.subject,description:x.description,due_date:x.due_date})),
    pendingChores:cloud.daily.filter(x=>x.status!=='approved').length+cloud.tasks.filter(x=>x.status!=='approved').length,
    coins:cloud.balance,spiritualPoints:cloud.spiritualPoints,nextReward:available?{title:available.title,missing:Number(available.cost||0)-cloud.balance}:null});
   return()=>updateMiroDayContext(null)
  },[cloud.session?.user.id,cloud.role,cloud.daily,cloud.tasks,cloud.rewards,cloud.balance,cloud.spiritualPoints,school.lessons,school.homework,school.backpackItems]);
  const connected=!!cloud.session&&!!cloud.role&&!!cloud.familyId;
  useEffect(()=>{if(connected&&cloud.role==='parent'&&Capacitor.isNativePlatform())void wakeNative.clearRemoteWake().catch(()=>{})},[connected,cloud.role]);
  useEffect(()=>attachMusicLifecycle(),[]);
  useEffect(()=>{setMusicScene((tab==='spiritual'||tab==='school')?'reading':tab==='world'&&cloud.worldNumber===2?'treehouse':'meadow')},[tab,cloud.worldNumber]);
  const shownParent=connected?cloud.role==='parent':parent;
  const actualCoins=connected?cloud.balance:0;
  const actualXp=connected?cloud.worldPoints:0;
  const unlockedWorld=(connected?Math.max(1,Math.min(4,cloud.worldNumber)):1) as 1|2|3|4;
  const canAdvance=connected&&cloud.role==='child'&&unlockedWorld<4&&actualXp>=unlockedWorld*WORLD_01_END;
  const [celebration,setCelebration]=useState<1|2|3|null>(null);
  const dismissedStage=useRef('');
  useEffect(()=>{if(!canAdvance){setCelebration(null);return}const key=cloud.session?.user.id+':'+unlockedWorld;if(dismissedStage.current!==key){setCelebration(unlockedWorld as 1|2|3);playSound('success')}},[canAdvance,unlockedWorld,cloud.session?.user.id]);
  const closeCelebration=()=>{dismissedStage.current=cloud.session?.user.id+':'+unlockedWorld;setCelebration(null)};
  const advanceWorld=async()=>{if(!canAdvance||advancingWorld)return;setAdvancingWorld(true);setWorldAdvanceError('');try{const stage=unlockedWorld===1?await cloud.rpc('advance_my_world',{p_family:cloud.familyId}):await cloud.rpc('advance_my_world_stage',{p_family:cloud.familyId,p_expected:unlockedWorld});if(stage!==2&&stage!==3&&stage!==4)throw Error('Сервер не подтвердил переход');setPreviewWorld(stage);setCelebration(null);setTab('world');playSound('success')}catch(e){setWorldAdvanceError(e instanceof Error?e.message:'Ошибка перехода')}finally{setAdvancingWorld(false)}};
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
  const actualWorld=previewWorld<=unlockedWorld?previewWorld:unlockedWorld;
  useEffect(()=>{if(connected)setPreviewWorld(unlockedWorld);else setPreviewWorld(1)},[connected,unlockedWorld,cloud.session?.user.id]);
  const actualWorldPoints=Math.max(0,Math.min(WORLD_01_END,actualXp-(actualWorld-1)*WORLD_01_END));
  const finished = chores.filter(x => x.done).length;
  const missionItems = chores.slice(0, 3);
  const missionDone = missionItems.every(x => x.done);
  const nextXp = 500 - xp % 500;
  const currentWorld=actualWorld;
  const pointsInWorld=actualWorldPoints;
  const adventure=useAdventureGame(connected?cloud.familyId:"",connected?cloud.childId:"",cloud.role,currentWorld,pointsInWorld);
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
  return <main className={"mw-root mw-theme-"+theme.resolved} data-app-theme={theme.resolved} data-app-theme-choice={theme.selection}>
 <div className={"mw-phone"+(tab==="world"?"":" mw-compact-header")}>
 <div className="mw-top">
 <div className="mw-identity"><div className="mw-logo">✦</div><div><strong>МОЙ МИР <span className="mw-beta">5.6.1</span></strong><span>Остров приключений</span></div></div>
 <div className="mw-head-stats"><button className="mw-star-counter" onClick={() => {setSectionFor('world','progress');setTab('world')}}>⭐ {actualXp}</button><button className="mw-coin" onClick={() => {setSectionFor('shop','catalog');setTab('shop')}}>🪙 <b>{actualCoins}</b></button><button aria-label="Открыть настройки" onClick={()=>goSettings('general')}>⚙️</button></div>
 </div>
 <div className="mw-hero-profile"><div className="mw-profile-avatar"><img src={import.meta.env.BASE_URL+'brand/icon.png'} alt="Миро EV"/></div><div><strong>Миро EV</strong><small>👦 {connected?cloud.childName:'Илья'} · ⭐ {actualXp} звёзд</small><span>🌍 Мой Мир · уровень {Math.max(1,Math.floor(actualXp/100)+1)}</span></div></div>
 <div className="mw-tabs-top">
 <button className={!shownParent ? 'selected' : ''} onClick={() => {if(!cloud.session)setShowConnection(true);else setTab('tasks')}}>👦 Илья</button>
 <button className={shownParent ? 'selected' : ''} onClick={() => {if(!cloud.session)setShowConnection(true);else if(cloud.role==='child')setShowConnection(true);else setTab('world')}}>👨‍👩‍👦 Родители</button>
 <SoundControl onChange={setSound}/>
 </div>
 <div className="mw-cloud-syncbar">{connected?<><span>☁️ {cloud.childName} · Прежний прогресс подключён</span><button onClick={()=>void cloud.refresh()}>↻</button><button onClick={()=>setShowConnection(v=>!v)}>Аккаунт</button></>:<><span>{cloud.loading?'Загружаем семейный прогресс…':'☁️ Подключи прежние баллы и достижения'}</span><button onClick={()=>setShowConnection(true)}>Войти</button></>}</div>
 {tab!=='health'&&<SectionNav label="Разделы" items={sectionItems[tab].filter(x=>!(tab==='tasks'&&x.id==='manage'&&cloud.role!=='parent'))} value={tab==='tasks'&&section==='manage'&&cloud.role!=='parent'?'today':section} onChange={value=>{setDestination(null);setMissingTarget(false);if(tab==='world'&&value==='health'){setTab('health');return}setSectionFor(tab,value)}}/>}
 <div ref={scrollScreen} className={tab==='family'&&connected&&section==='chat'?'mw-scroll mw-family-screen':tab==='family'?'mw-scroll mw-family-content':'mw-scroll'}>
 
 {showConnection&&(cloud.session?<section className="mw-panel mw-cloud-account"><h3>Семейный аккаунт</h3><p>{cloud.session?.user.email}</p><button onClick={()=>{void cloud.logout().then(()=>{setShowConnection(true);setTab('world')}).catch(e=>console.warn('Account switch:',e))}}>Выйти</button><button onClick={()=>setShowConnection(false)}>Закрыть</button></section>:<CloudSignIn cloud={cloud}/>)}
 {cloud.error&&cloud.session&&<div className="mw-note" role="alert">Ошибка загрузки: {cloud.error} <button onClick={()=>void cloud.refresh()}>Повторить</button></div>}
 {missingTarget&&<p className="mw-note" role="status">Эта запись уже обработана или больше не доступна.</p>}

 <div className="mw-system-stack" style={{display:tab==='settings'&&(section==='updates'||section==='notifications')?'flex':'none'}}><div id="app-updates" hidden={section!=='updates'}><UpdateCenter/></div>{connected&&cloud.session&&<div hidden={section!=='notifications'}><NotificationInbox key={cloud.session.user.id} userId={cloud.session.user.id} familyId={cloud.familyId} onOpen={next=>{openDestination(next);void cloud.refresh()}}/><PushCenter userId={cloud.session.user.id}/></div>}</div>
 {tab === 'world' && <>
 <section className="mw-greeting"><div><div className="mw-eyebrow">{shownParent ? 'КАБИНЕТ РОДИТЕЛЯ' : 'ТВОЁ ПРИКЛЮЧЕНИЕ'}</div><h1>{shownParent ? 'Мир Ильи' : 'Привет, Илья! 👋'}</h1><p>{shownParent ? 'Здесь видно, как занятия превращаются в достижения.' : 'Остров меняется благодаря твоим добрым делам.'}</p></div></section>
 {(section==='island'||section==='day')&&connected&&<UpcomingFamilyEvent family={cloud.familyId} onOpen={()=>{setSectionFor('family','calendar');setTab('family')}}/>}
 {section==='island'&&connected&&cloud.role==='parent'&&<button className="mw-section-summary mw-action-shortcut" onClick={()=>setSectionFor('world','day')}>📋 Мой день и решения родителя →</button>}
 {section==='day'&&<>
 {connected&&cloud.role==='parent'&&<ParentApprovals cloud={cloud} onOpen={openDestination}/>}
 {connected&&<MyDay cloud={cloud} school={school} onGo={next=>{setSectionFor(next,sectionDefaults[next]);setTab(next)}} onAskMiro={askMiro}/>}
 <button className="mw-health-shortcut" type="button" onClick={()=>setTab('health')}><span className="mw-health-heart">💚</span><span><strong>Моё здоровье</strong><small>Сон · зарядка · полезные привычки</small></span><b>Открыть →</b></button>
 {connected&&<section className="mw-panel school-dashboard-link"><div><strong>🎒 Уроки сегодня</strong><p>{school.lessons.filter(x=>x.weekday===new Date().getDay()).sort((a,b)=>a.lesson_order-b.lesson_order).map(x=>x.subject).join(' · ')||'Добавьте расписание в разделе «Учёба»'}</p></div><button onClick={()=>{setSectionFor('school','schedule');setTab('school')}}>Открыть</button></section>}
 </>}
 {(section==='island'||section==='adventure')&&<>
 <div className="mw-worldswitch" aria-label="Открытые миры">{([1,2,3,4] as const).filter(n=>n<=unlockedWorld).map(n=><button key={n} className={currentWorld===n?'active':''} aria-pressed={currentWorld===n} onClick={()=>setPreviewWorld(n)}>{['🏡 Домик на поляне','🌳 Домик на дереве','🪐 Космос','🌊 Подводная станция'][n-1]} ✓</button>)}</div>
 <RoomCloudContext.Provider value={connected?{family:cloud.familyId,child:cloud.childId,parent:cloud.role==="parent",balance:cloud.balance,refresh:()=>void cloud.refresh()}:null}><MiroWardrobeProvider key={cloud.session?.user.id||"guest"}><WorldSafe key={currentWorld+':'+(cloud.session?.user.id||'guest')} worldNumber={currentWorld} points={pointsInWorld} spiritualPoints={connected?cloud.spiritualPoints:0} soundEnabled={sound} userId={cloud.session?.user.id||'guest'}><Suspense fallback={<div className="mw-panel">✨ Загружаем 3D-мир…</div>}>{currentWorld===4?<OceanWorld points={pointsInWorld} earnedPoints={actualXp} spiritualPoints={connected?cloud.spiritualPoints:0} userId={cloud.session?.user.id||"guest"} owner={cloud.childId||cloud.session?.user.id||"guest"} soundEnabled={sound} adventure={connected?adventure.view:undefined}/>:currentWorld===3?<SpaceWorld adventure={connected?adventure.view:undefined} points={pointsInWorld} owner={cloud.childId||cloud.session?.user.id||"guest"} userId={cloud.session?.user.id||"guest"} earnedPoints={actualXp} spiritualPoints={connected?cloud.spiritualPoints:0} soundEnabled={sound}/>:<World3D adventure={connected?adventure.view:undefined} theme={theme.resolved} points={pointsInWorld} earnedPoints={actualXp} worldNumber={currentWorld} spiritualPoints={connected?cloud.spiritualPoints:0} userId={cloud.session?.user.id||'guest'} decorOwnerId={cloud.childId||cloud.session?.user.id||'guest'} decorFamilyId={cloud.familyId||''} decorChildId={cloud.childId||''} soundEnabled={sound} adventureCount={story.total}/>}</Suspense></WorldSafe></MiroWardrobeProvider></RoomCloudContext.Provider>
 </>}
 {section==='adventure'&&connected&&<AdventureHub game={adventure}/>}
 {section==='adventure'&&connected&&<IslandStory cloud={cloud} story={story}/>}
 {section==='adventure'&&connected&&currentWorld<=2&&<IslandMoments cloud={cloud} worldNumber={currentWorld}/>}
 {!connected&&<button className="mw-primary" onClick={()=>setShowConnection(true)}>☁️ Подключить мои прежние достижения</button>}
 {(section==='island'||section==='progress'||section==='adventure')&&connected&&<div className="mw-balance-summary"><span>⭐ Заработано: {cloud.worldPoints}</span><span>🪙 Баланс: {cloud.balance}</span><span>🎁 Наград: {cloud.rewards.length}</span></div>}
 {section==='progress'&&<section className="mw-progress"><div className="mw-progress-head"><strong>⭐ Очки развития</strong><span>{pointsInWorld} / {WORLD_01_END}</span></div>
 <div className="mw-progress-track"><div style={{width:`${pointsInWorld/WORLD_01_END*100}%`}}/></div>
 <p>{nextWorldStage?'Следующее улучшение: '+(currentWorld===2?TREEHOUSE_STAGES[WORLD_01_OBJECTS.indexOf(nextWorldStage)]:currentWorld>=3?'Новый объект экспедиции':nextWorldStage.title)+' — '+nextWorldStage.at+' очков':'Все 30 этапов этого мира открыты!'}</p></section>}
 {(section==='island'||section==='progress')&&unlockedWorld<4&&<section className="mw-mystery-worlds" aria-label="Будущие этапы"><h3>Твои будущие приключения</h3><div className="mw-mystery-grid">{([2,3,4] as const).filter(n=>n>unlockedWorld).map(n=><article key={n} className={'mw-mystery-card mystery-'+n}><div className="mw-mystery-art" aria-hidden="true"><i/><i/><i/><i/><span>✧</span><b>?</b></div><div className="mw-mystery-caption"><strong>🔒 Этап {n}</strong><small>{n===unlockedWorld+1?'Откроется после завершения текущего этапа':'Сюрприз впереди'}</small></div></article>)}</div></section>}
 {canAdvance&&<section className="mw-panel"><p>🎉 Этап завершён! Следующий мир ждёт тебя.</p><button className="mw-primary" disabled={advancingWorld} onClick={()=>setCelebration(unlockedWorld as 1|2|3)}>✨ Перейти к другому этапу</button></section>}
 {connected&&cloud.role==='parent'&&unlockedWorld<4&&actualXp>=unlockedWorld*WORLD_01_END&&<section className="mw-panel">🎉 Этап завершён. Илья может перейти в следующий мир из детского аккаунта.</section>}
 {section==='progress'&&<section className="mw-panel"><div className="mw-section-label">КАК РАЗВИВАТЬ МИР</div><p className="mw-task-explain">Каждое подтверждённое родителем задание приносит монеты и очки развития. Постройки возникают сами, в прежнем порядке. Трогай Миро на острове: он увеличится и поможет разобраться с уроками.</p><button className="mw-primary" onClick={()=>setTab('tasks')}>Посмотреть задания →</button></section>}
 </>}
 {tab === 'tasks' && (connected?<CloudTasks cloud={cloud} section={section==='manage'&&cloud.role!=='parent'?'today':section}/>:<CloudSignIn cloud={cloud}/>)}
 {tab==='health'&&<button type="button" className="mw-health-back" onClick={()=>{setSectionFor('world','day');setTab('world')}}>← Мой мир</button>}
 {tab === 'health' && <Suspense fallback={<div className="mw-panel">Загружаем раздел здоровья…</div>}><HealthHub openKitchen={destination?.kitchen?destination:undefined} onMealDecision={cloud.refresh} themeMode={theme.selection} themeResolved={theme.resolved} onThemeChange={theme.setTheme} onOpenSettings={()=>goSettings('alarm')} parent={shownParent} childId={cloud.childId||'local-ilya'} familyId={connected?cloud.familyId:undefined}/></Suspense>}
 {tab === 'school' && (connected?<Suspense fallback={<div className="mw-panel">Загружаем учебные материалы…</div>}><SchoolHub cloud={cloud} school={school} reminders={reminders} onAskMiro={askMiro} section={section}/></Suspense>:<CloudSignIn cloud={cloud}/>)}
 {tab === 'shop' && (connected?<>{section==='time'?<PlayTimeBank cloud={cloud}/>:<CloudShop cloud={cloud} section={section}/>}</>:<CloudSignIn cloud={cloud}/>)}
 {tab === 'spiritual' && (connected?<>{section==='text'?<DailyTextReader cloud={cloud} onAskMiro={askMiro} onSchoolSettings={()=>goSettings('school')}/>:<CloudSpiritual cloud={cloud} section={section} onBibleJourney={()=>setSectionFor('spiritual','bible')} onDailyText={()=>setSectionFor('spiritual','text')}/>}</>:<CloudSignIn cloud={cloud}/>)}
 {tab === 'family' && (connected&&cloud.session?<>{section==='overview'&&<section className="mw-family-overview" aria-label="Обзор семьи"><header><div className="mw-eyebrow">СЕМЕЙНЫЙ ЦЕНТР</div><h1>Семья ❤️</h1><p>Выбери нужный раздел. Все функции доступны и здесь, и в верхнем меню.</p></header>{sectionItems.family.filter(x=>x.id!=='overview').map(item=><button className="mw-family-link" key={item.id} onClick={()=>setSectionFor('family',item.id)}><span aria-hidden="true">{item.icon}</span><span><strong>{item.label}</strong><small>{({chat:'Сообщения и связь с близкими',calendar:'События, планы и семейная статистика',location:'Последняя отправленная позиция на карте',safety:'Правила использования телефона и помощь',tools:'Диагностика, журнал и настройки защиты'} as Record<string,string>)[item.id]}</small></span><b aria-hidden="true">›</b></button>)}</section>}{section==='safety'&&<><FamilySafety key={"FamilySafety:"+cloud.session.user.id} cloud={cloud}/></>}{section==='calendar'&&<FamilyManagement key={"FamilyManagement:"+cloud.session.user.id} cloud={cloud} onGo={next=>{setSectionFor(next,sectionDefaults[next]);setTab(next)}}/>}{section==='chat'&&<><Suspense fallback={<div className="mw-panel">Загружаем семейный чат…</div>}><FamilyChat familyId={cloud.familyId} userId={cloud.session.user.id}/></Suspense></>}</>:<CloudSignIn cloud={cloud}/>)}
 {tab === 'settings' && <div className="mw-settings-section"><section className="mw-greeting"><div className="mw-eyebrow">МОЙ МИР · УПРАВЛЕНИЕ</div><h1>⚙️ Настройки</h1><p>Выбери нужную категорию в верхней строке.</p></section>
 {section==='general'&&<><div className="mw-settings-tile mw-theme-settings"><AppThemeSwitch selection={theme.selection} onChange={theme.setTheme}/><p>Тема действует во всех разделах.</p></div><div className="mw-settings-tile"><strong>🎵 Звуки и музыка</strong><SoundControl onChange={setSound}/><MusicControl/></div></>}
 {section==='alarm'&&<><MiroAlarmPanel lessons={school.lessons}/>{connected&&cloud.role==='child'&&<RemoteWakeSetup family={cloud.familyId} child={cloud.childId}/>}{connected&&cloud.role==='parent'&&<ParentWake family={cloud.familyId} child={cloud.childId} name={cloud.childName}/>}</>}
 {section==='notifications'&&<div className="mw-settings-tile"><strong>🔔 Уведомления приложения</strong><p>Сообщения семьи, достижения и родительские решения. Разреши системные уведомления в Android.</p></div>}
 {section==='school'&&(connected?<Suspense fallback={<div className="mw-panel">Загружаем напоминания…</div>}><SchoolHub cloud={cloud} school={school} reminders={reminders} onAskMiro={askMiro} section="reminders"/></Suspense>:<CloudSignIn cloud={cloud}/>)}
 {section==='account'&&<><div className="mw-settings-tile"><strong>👨‍👩‍👦 Семейный аккаунт</strong><button onClick={()=>setShowConnection(true)}>{connected?'Открыть аккаунт':'Войти'}</button></div>{connected&&cloud.role==='parent'&&cloud.childId&&<ParentChildAccess key={cloud.childId} childId={cloud.childId} childName={cloud.childName}/>}{connected&&<div className="mw-settings-tile"><strong>Вход Ильи</strong><p>Уведомление родителю при открытии приложения. Не чаще одного раза в 15 минут.</p></div>}</>}
 {section==='updates'&&<div className="mw-section-summary">Обновления устанавливаются внутри приложения. Данные аккаунта сохраняются.</div>}
 </div>}


 </div>
 <nav className="mw-bottom" aria-label="Навигация">{nav.map(([id, ico, label]) => <button key={id} className={tab === id ? 'active' : ''} aria-current={tab===id?"page":undefined} onClick={() => {setDestination(null);setMissingTarget(false);if(id==='family')setSectionFor('family','overview');setTab(id)}}><span>{ico}</span><small>{label}</small>{id === 'shop' && pending.length > 0 && <i>{pending.length}</i>}</button>)}</nav>
 {false&&pinOpen&&<div className="mw-pin-overlay" role="dialog" aria-label="Вход родителя" aria-modal="true"><form className="mw-pin-card" onSubmit={e=>{e.preventDefault();void enterParent()}}>
 <div className="mw-pin-icon">🔐</div><h2>{parentPinHash?'Вход для родителей':'Создать код родителя'}</h2>
 <p>{parentPinHash?'Введите созданный вами код, чтобы редактировать задания и подтверждать награды.':'Установите родительский код из 4–6 цифр. Ребёнок не сможет открыть настройки простым нажатием.'}</p>
 <label>Родительский код<input aria-label="Родительский код" type="password" inputMode="numeric" autoComplete="off" minLength={4} maxLength={6} pattern="[0-9]{4,6}" value={pinInput} onChange={e=>setPinInput(e.target.value.replace(/\D/g,''))} required/></label>
 {!parentPinHash&&<label>Повторите код<input aria-label="Повторите код" type="password" inputMode="numeric" autoComplete="off" minLength={4} maxLength={6} pattern="[0-9]{4,6}" value={pinAgain} onChange={e=>setPinAgain(e.target.value.replace(/\D/g,''))} required/></label>}
 {pinError&&<p className="mw-pin-error">{pinError}</p>}
 <div className="mw-pin-actions"><button type="button" onClick={()=>{setPinOpen(false);setPinError('')}}>Отмена</button><button type="submit">{parentPinHash?'Войти':'Создать код'}</button></div>
 <small>Это локальная защита тестовой версии, а не серверная семейная авторизация.</small>
 </form></div>}
 {connected&&cloud.role==='child'&&<CalendarNotice key={cloud.session?.user.id+':'+cloud.familyId} family={cloud.familyId} child={cloud.childId}/>}
 {connected&&cloud.role==='child'&&<ChildWake key={cloud.session?.user.id+':'+cloud.familyId} family={cloud.familyId}/>}
 {celebration&&canAdvance&&<WorldCelebration stage={celebration} name={cloud.childName} busy={advancingWorld} error={worldAdvanceError} onAdvance={()=>void advanceWorld()} onClose={closeCelebration}/>}
 {message && <div className="mw-toast" role="status">{message}</div>}
 </div>
 </main>;
};