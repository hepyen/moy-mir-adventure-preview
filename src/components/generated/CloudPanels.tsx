import {BibleJourney} from '../../daily/BibleJourney';
import {ParentActivityJournal} from './ParentActivityJournal';
import {GrowthFocus} from './GrowthFocus';
import {WeeklyReport} from './WeeklyReport';
import React,{useState} from 'react';
import type {CloudItem} from '../../lib/useFamilyCloud';
import {useFamilyCloud} from '../../lib/useFamilyCloud';
import {spiritualSteps,spiritualStage} from '../../lib/spiritualProgress';
import {PioneerSection} from '../../pioneer/PioneerSection';
import '../../pioneer/PioneerEntry.css';
import './CloudPanels.css';
import {ApprovalCard,taskApprovals} from '../../features/ParentApprovals';
import {reviewAnchor} from '../../notifications/destinations';
import {PLAYSTATION_30_REWARD_ID,playStationClaimedToday} from '../../playtime/PlayStationGift';
type Cloud=ReturnType<typeof useFamilyCloud>;
const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function CloudSignIn({cloud}:{cloud:Cloud}){
 const [email,setEmail]=useState(''),[pass,setPass]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <section className="mw-panel mw-cloud-login">
  <h2>🔐 Подключить прежний «Мой Мир»</h2>
  <p>Войди с тем же адресом почты и паролем, что в первоначальном приложении. Мы покажем реальные баллы, задания, призы и достижения из семейной базы. Ничего не сбрасывается.</p>
  <form onSubmit={e=>{e.preventDefault();setBusy(true);setError('');void cloud.login(email.trim(),pass).catch(err=>setError(err instanceof Error?err.message:'Ошибка входа')).finally(()=>setBusy(false))}}>
  <label>Электронная почта<input aria-label="Почта семейного аккаунта" type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></label>
  <label>Пароль<input aria-label="Пароль семейного аккаунта" type="password" required value={pass} onChange={e=>setPass(e.target.value)} autoComplete="current-password"/></label>
  {error&&<p className="mw-cloud-error" role="alert">{error}</p>}
  <button className="mw-primary" type="submit" disabled={busy}>{busy?'Входим…':'Подключить мой прогресс'}</button>
  </form>
  <small>Забыл пароль? Попроси родителя открыть ⚙️ Настройки → «Восстановить доступ ребёнку» в его аккаунте. Новую семью создавать не нужно.</small>
 </section>;
}
function Action({children,run,disabled=false,className=''}:{children:React.ReactNode;run:()=>Promise<unknown>;disabled?:boolean;className?:string}){
 const[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <span className="mw-cloud-action"><button type="button" disabled={busy||disabled} className={className} onClick={()=>{setBusy(true);setError('');void run().catch(e=>setError(e instanceof Error?e.message:'Ошибка')).finally(()=>setBusy(false))}}>{busy?'Обновление…':children}</button>{error&&<small className="mw-cloud-error">{error}</small>}</span>
}
function DailySettings({cloud}:{cloud:Cloud}){
 const [title,setTitle]=useState(''),[points,setPoints]=useState('5'),[icon,setIcon]=useState('✅');
 const [weekdays,setWeekdays]=useState<number[]>([0,1,2,3,4,5,6]);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 const names=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
 async function create(e:React.FormEvent){
  e.preventDefault();if(busy)return;
  if(!weekdays.length){setError('Выбери хотя бы один день');return}
  setBusy(true);setError('');
  try{
   await cloud.rpc('create_daily_chore',{p_family:cloud.familyId,p_child:cloud.childId,p_title:title.trim(),p_points:Number(points),p_icon:icon,p_weekdays:weekdays});
   setTitle('');setPoints('5');setIcon('✅');setWeekdays([0,1,2,3,4,5,6]);
  }catch(e){setError(e instanceof Error?e.message:'Не удалось сохранить ежедневное дело')}
  finally{setBusy(false)}
 }
 return <details className="mw-panel mw-cloud-form" aria-label="Управление ежедневными заданиями"><summary>📆 Управление ежедневными заданиями ({cloud.dailyTemplates.length})</summary>
  <p>Добавляй новые ежедневные дела, меняй названия и дни недели. Кнопка «Убрать из дел» скрывает задание у Ильи, не удаляя историю и баллы.</p>
  <form onSubmit={e=>void create(e)}>
   <input required maxLength={160} placeholder="Например, почистить зубы вечером" value={title} onChange={e=>setTitle(e.target.value)}/>
   <div className="mw-cloud-inline"><label>Значок<input aria-label="Значок ежедневного дела" maxLength={8} value={icon} onChange={e=>setIcon(e.target.value)}/></label>
   <label>Баллы<input type="number" min={0} max={1000} required value={points} onChange={e=>setPoints(e.target.value)}/></label></div>
   <div className="mw-weekdays">{names.map((name,i)=><label key={i}><input type="checkbox" checked={weekdays.includes(i)} onChange={e=>setWeekdays(old=>e.target.checked?[...old,i].sort():old.filter(x=>x!==i))}/>{name}</label>)}</div>
   {error&&<small className="mw-cloud-error" role="alert">{error}</small>}
   <button type="submit" disabled={busy}>{busy?'Сохраняем…':'Добавить ежедневное дело'}</button>
  </form>
  {cloud.dailyTemplates.map(t=><DailyTemplateEditor key={t.id} cloud={cloud} item={t} names={names}/>)}
 </details>
}
function ArchiveTaskAction({active,onChange,busy}:{active:boolean;onChange:(next:boolean)=>Promise<void>;busy:boolean}){
 const[confirm,setConfirm]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState('');
 async function action(){if(busy||pending)return;setPending(true);setError('');try{await onChange(!active);setConfirm(false)}catch(e){setError(e instanceof Error?e.message:'Не удалось изменить список')}finally{setPending(false)}}
 return <div className="mw-task-archive-control">
  {!confirm?<button type="button" className={active?'mw-task-remove':'mw-task-restore'} disabled={busy} onClick={()=>{setError('');setConfirm(true)}}>{active?'🗑 Убрать из дел':'↩ Восстановить'}</button>:<div className="mw-task-archive-confirm" role="group" aria-label={active?'Подтверждение удаления дела':'Подтверждение восстановления дела'}>
   <p>{active?'Убрать дело из списка Ильи? Прежние выполнения и заработанные баллы останутся в истории.':'Вернуть это дело в список Ильи?'}</p>
   <button type="button" className="mw-task-archive-yes" disabled={pending||busy} onClick={()=>void action()}>{pending?'Сохраняем…':active?'Да, убрать':'Да, восстановить'}</button>
   <button type="button" disabled={pending} onClick={()=>setConfirm(false)}>Отмена</button>
  </div>}
  {error&&<small className="mw-cloud-error" role="alert">{error}</small>}
 </div>
}
function FamilyTaskEditor({cloud,item}:{cloud:Cloud;item:CloudItem}){
 const[editing,setEditing]=useState(false),[title,setTitle]=useState(item.title),[points,setPoints]=useState(item.points),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const change=async(nextActive:boolean)=>{await cloud.rpc('manage_family_task',{p_id:item.id,p_title:item.title,p_points:item.points,p_active:nextActive})}
 async function save(e:React.FormEvent){e.preventDefault();if(busy)return;setBusy(true);setError('');try{await cloud.rpc('manage_family_task',{p_id:item.id,p_title:title.trim(),p_points:points,p_active:item.active!==false});setEditing(false)}catch(e){setError(e instanceof Error?e.message:'Не удалось изменить дело')}finally{setBusy(false)}}
 return <div className="mw-family-task-editor" data-task-id={item.id}>
  <div className="mw-family-task-row"><div><strong>{item.title}</strong><small>+{item.points} монет · {item.active===false?'Убрано из списка':'Активно'}</small></div><button type="button" className="mw-inline-edit" onClick={()=>{setTitle(item.title);setPoints(item.points);setEditing(!editing)}}>{editing?'Отмена':'✎ Изменить'}</button></div>
  {editing&&<form className="mw-inline-editor" onSubmit={e=>void save(e)}><label>Название дела<input required minLength={1} maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Монеты за выполнение<input type="number" min={0} max={1000} required value={points} onChange={e=>setPoints(Number(e.target.value))}/></label><button type="submit" disabled={busy}>{busy?'Сохраняем…':'Сохранить изменения'}</button>{error&&<small role="alert" className="mw-cloud-error">{error}</small>}</form>}
  <ArchiveTaskAction active={item.active!==false} busy={busy} onChange={change}/>
 </div>
}
function DailyTemplateEditor({cloud,item,names}:{cloud:Cloud;item:CloudItem;names:string[]}){
 const[edit,setEdit]=useState(false),[title,setTitle]=useState(item.title),[icon,setIcon]=useState(item.icon||'✅');
 const[points,setPoints]=useState(item.points),[days,setDays]=useState<number[]>(item.weekdays||[0,1,2,3,4,5,6]);
 const[active,setActive]=useState(item.active!==false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function save(e:React.FormEvent){e.preventDefault();if(!days.length){setError('Выбери хотя бы один день');return}
  setBusy(true);setError('');try{await cloud.rpc('manage_daily_chore',{p_id:item.id,p_title:title.trim(),p_points:points,p_icon:icon,p_weekdays:days,p_active:active});setEdit(false)}catch(e){setError(e instanceof Error?e.message:'Ошибка')}finally{setBusy(false)}}
 return <div className="mw-cloud-line"><div><strong>{item.icon||'✅'} {item.title}</strong><small>+{item.points} монет · {(item.weekdays||[]).map(d=>names[d]).join(', ')} · {item.active?'Активно':'Приостановлено'}</small><small>{item.penaltyEnabled?'Возможный штраф: −'+item.points+' монет':'Без штрафа за пропуск'}</small></div>
  <button type="button" className="mw-inline-edit" onClick={()=>setEdit(x=>!x)}>{edit?'Закрыть':'Изменить'}</button>
  {edit&&<form className="mw-inline-editor" onSubmit={e=>void save(e)}><label>Название<input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Значок<input maxLength={8} value={icon} onChange={e=>setIcon(e.target.value)}/></label><label>Баллы<input type="number" min={0} max={1000} value={points} onChange={e=>setPoints(Number(e.target.value))}/></label><div className="mw-weekdays">{names.map((name,i)=><label key={i}><input type="checkbox" checked={days.includes(i)} onChange={e=>setDays(old=>e.target.checked?[...old,i].sort():old.filter(x=>x!==i))}/>{name}</label>)}</div><label className="mw-inline-check"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/>Активно</label><button type="submit" disabled={busy}>{busy?'Сохраняем…':'Сохранить изменения'}</button>{error&&<p role="alert" className="mw-cloud-error">{error}</p>}</form>}
  <Action disabled={busy||item.active===false} run={()=>cloud.rpc('set_daily_chore_penalty',{p_id:item.id,p_enabled:!item.penaltyEnabled})}>{item.penaltyEnabled?'Отключить штраф':'Включить штраф'}</Action>
  <ArchiveTaskAction active={item.active!==false} busy={busy} onChange={async(nextActive)=>{await cloud.rpc('manage_daily_chore',{p_id:item.id,p_title:item.title,p_points:item.points,p_icon:item.icon||'✅',p_weekdays:item.weekdays||[0,1,2,3,4,5,6],p_active:nextActive});setActive(nextActive)}}/>
 </div>
}
export function CloudTasks({cloud}:{cloud:Cloud}){
 const[title,setTitle]=useState(''),[points,setPoints]=useState('10'),[propose,setPropose]=useState(''),[proposePoints,setProposePoints]=useState('10');
 const[deductReason,setDeductReason]=useState(''),[deductAmount,setDeductAmount]=useState('5'),[category,setCategory]=useState('agreement');
 const all=[...cloud.daily.map(x=>({...x,kind:'daily'})),...cloud.tasks.filter(x=>x.active!==false).map(x=>({...x,kind:'ordinary'}))];
 const today=day();
 const todayDaily=new Map(cloud.dailyDone.filter(row=>row.activity_date===today).map(row=>[row.template_id,row.id]));
 const todayTasks=new Map(cloud.activity.filter(row=>row.activity_date===today).map(row=>[row.task_id,row.id]));
 const visibleIds=new Set(all.map(x=>x.kind==='daily'?todayDaily.get(x.id):todayTasks.get(x.id)));
 const earlier=cloud.role==='parent'?taskApprovals(cloud).filter(item=>!visibleIds.has(item.id)):[];
 const completed=all.filter(x=>x.status==='approved').length;
 const onCreate=async()=>{if(cloud.role!=='parent'||!title.trim())return;await cloud.rpc('create_family_task',{p_family:cloud.familyId,p_child:cloud.childId,p_title:title.trim(),p_points:Number(points)});setTitle('')};
 const onProposal=async()=>{if(cloud.role!=='child'||!propose.trim())return;await cloud.rpc('propose_child_task',{p_family:cloud.familyId,p_title:propose.trim(),p_points:Number(proposePoints)});setPropose('')};
 const review=(x:CloudItem,kind:string,approve:boolean)=>{
  if(kind==='daily'){const completion=cloud.dailyDone.find(r=>r.template_id===x.id&&r.activity_date===day()&&r.status==='pending');if(!completion)return Promise.reject(new Error('Заявка ещё не загружена'));return cloud.rpc('review_daily_chore',{p_completion:completion.id,p_approve:approve})}
  const submission=cloud.activity.find(r=>r.task_id===x.id&&r.activity_date===day()&&r.status==='pending');if(!submission)return Promise.reject(new Error('Заявка ещё не загружена'));return cloud.rpc('review_task',{p_submission_id:submission.id,p_approve:approve})
 };
 const submit=(x:CloudItem,kind:string)=>kind==='daily'?cloud.rpc('submit_daily_chore',{p_template:x.id,p_date:day()}):cloud.rpc('submit_task',{p_task_id:x.id});
 return <>
 <section className="mw-greeting"><div className="mw-eyebrow">ПРЕЖНИЕ СЕМЕЙНЫЕ ЗАДАНИЯ</div><h1>{cloud.role==='parent'?'Проверка заданий':'Мои дела'}</h1><p>{completed} из {all.length} выполнено сегодня · Обновление из семейной базы.</p></section>
 <WeeklyReport stats={cloud.weekly} role={cloud.role}/>
 <section className="mw-panel mw-penalty-info"><h3>⚖️ Обязательные дела и монеты</h3><p>В 19:00 Миро напоминает о невыполненных обязательных делах. Монеты автоматически не списываются. Решение о штрафе принимает только родитель.</p><p>{cloud.role==='parent'?'Штраф можно отключить для отдельного дела в управлении ежедневными заданиями или вернуть монеты в истории.':'Отметь дела до конца дня. Если не смог выполнить дело по уважительной причине, обратись к родителю.'} Построенный мир и достижения сохраняются.</p></section>
 {cloud.role==='child'&&<section className="mw-panel mw-cloud-form"><h3>💡 Предложить задание</h3><p>Предложение отправится родителям на рассмотрение.</p>
 <form onSubmit={e=>{e.preventDefault();void onProposal().catch(e=>alert(e.message))}}><input required maxLength={160} placeholder="Например, помочь приготовить ужин" value={propose} onChange={e=>setPropose(e.target.value)}/><label>Баллы<input type="number" min={0} max={1000} required value={proposePoints} onChange={e=>setProposePoints(e.target.value)}/></label><button type="submit">Отправить родителю</button></form></section>}
 {cloud.role==='parent'&&<section className="mw-panel mw-cloud-form"><h3>➕ Добавить задание</h3><form onSubmit={e=>{e.preventDefault();void onCreate().catch(e=>alert(e.message))}}><input required maxLength={160} placeholder="Название задания" value={title} onChange={e=>setTitle(e.target.value)}/><label>Баллы<input type="number" min={0} max={1000} value={points} onChange={e=>setPoints(e.target.value)}/></label><button type="submit">Создать задание</button></form></section>}
 {cloud.role==='parent'&&<details className="mw-panel mw-cloud-form" aria-label="Управление обычными делами"><summary>✎ Изменить или удалить обычные дела ({cloud.tasks.length})</summary><p>Редактируй названия и монеты, убирай ненужные задания из списка или возвращай их. История выполнений и начисленные баллы сохраняются.</p>
  {cloud.tasks.length?cloud.tasks.map(item=><FamilyTaskEditor key={item.id} item={item} cloud={cloud}/>):<p>Обычных дел пока нет. Добавь первое через форму выше.</p>}
 </details>}
 {cloud.role==='parent'&&<DailySettings cloud={cloud}/>}
 {cloud.role==='parent'&&cloud.choreDecisions.length>0&&<section className="mw-panel mw-cloud-form" id="chore-decisions"><h3>⚖️ Дела, требующие решения</h3>{cloud.choreDecisions.map(x=><article className="mw-family-task-editor" key={x.template_id+x.activity_date}><strong>{x.title}</strong><small>{x.activity_date} · {x.status==='pending'?'Отправлено на проверку':'Не подтверждено'}</small><div className="mw-cloud-inline"><Action run={()=>cloud.rpc('decide_daily_chore',{p_template:x.template_id,p_date:x.activity_date,p_decision:'approve'})}>Подтвердить +{x.points}</Action><Action run={async()=>{if(window.confirm('Оштрафовать за это дело на '+x.points+' монет?'))await cloud.rpc('decide_daily_chore',{p_template:x.template_id,p_date:x.activity_date,p_decision:'penalty'})}}>Оштрафовать −{x.points}</Action><Action run={()=>cloud.rpc('decide_daily_chore',{p_template:x.template_id,p_date:x.activity_date,p_decision:'excuse'})}>Освободить</Action></div></article>)}</section>}
 {earlier.length>0&&<section className="mw-panel"><h3>Другие дела на проверку</h3>{earlier.map(item=><ApprovalCard key={item.id} item={item} anchored/>)}</section>}
 <h3 className="mw-cloud-heading" id="review-tasks">🗓️ Ежедневные дела ({cloud.daily.length})</h3>
 {all.length===0&&<p className="mw-note">Заданий пока нет. Нажми «Обновить» на панели аккаунта.</p>}
 {all.map(x=>{const id=x.kind==='daily'?todayDaily.get(x.id):todayTasks.get(x.id);return <article className="mw-chore" key={x.kind+x.id} id={id?reviewAnchor(x.kind==='daily'?'daily':'task',id):undefined} tabIndex={id?-1:undefined}><div className="mw-task-emoji">{x.icon||'✅'}</div><div className="mw-task-body"><strong>{x.title}</strong><small>{x.status==='penalty'?'Родитель назначил штраф':x.status==='excuse'?'Освобождён от дела':x.status==='approved'?'✓ Подтверждено':x.status==='pending'?'⏳ Ожидает решения родителя':'Доступно сегодня'} · {x.kind==='daily'?'Ежедневное':'Обычное'}</small></div><div className="mw-task-right"><b>+{x.points} 🪙</b>{x.kind==='daily'&&x.penaltyEnabled&&x.points>0&&x.status!=='approved'&&<small className="mw-penalty-value">При пропуске: −{x.points} 🪙</small>}
 {cloud.role==='child'&&x.status!=='pending'&&x.status!=='approved'&&x.status!=='penalty'&&x.status!=='excuse'&&<Action run={()=>submit(x,x.kind)}>Готово</Action>}
 {cloud.role==='parent'&&x.status==='pending'&&<div className="mw-cloud-inline"><Action run={()=>review(x,x.kind,true)}>✓</Action><Action run={()=>review(x,x.kind,false)}>✕</Action></div>}
 </div></article>})}
 <section className="mw-panel mw-cloud-form" id="review-proposals"><h3>💡 Предложения заданий</h3>
 {cloud.proposals.length===0&&<p>Предложений пока нет.</p>}
 {cloud.proposals.map(x=><div className="mw-cloud-line" key={x.id} id={reviewAnchor('proposal',x.id)} tabIndex={-1}><div><strong>{x.title}</strong><small>{x.status==='pending'?'На рассмотрении':x.status==='approved'?'✓ Принято':x.status==='rejected'?'Отклонено':'Отменено'} · {x.proposed_points} баллов</small></div>
 {cloud.role==='parent'&&x.status==='pending'&&<><Action run={()=>cloud.rpc('review_child_task_proposal',{p_proposal:x.id,p_approve:true,p_points:x.proposed_points})}>Принять</Action><Action run={()=>cloud.rpc('review_child_task_proposal',{p_proposal:x.id,p_approve:false,p_points:null})}>Отклонить</Action></>}
 </div>)}</section>
 {cloud.role==='parent'&&<section className="mw-panel mw-cloud-form"><h3>⚖️ Дисциплинарные меры</h3><p>Списания уменьшают баланс магазина, но не разрушают построенный мир.</p>
 <form onSubmit={e=>{e.preventDefault();void cloud.rpc('add_behavior_point_deduction',{p_family:cloud.familyId,p_child:cloud.childId,p_category:category,p_reason:deductReason,p_amount:Number(deductAmount)}).then(()=>setDeductReason('')).catch(e=>alert(e.message))}}>
 <select value={category} onChange={e=>setCategory(e.target.value)}><option value="agreement">Нарушение договорённости</option><option value="respect">Неуважительный разговор</option><option value="kindness">Обидные слова</option><option value="honesty">Вопрос честности</option><option value="other">Другое</option></select>
 <label>Баллы<select value={deductAmount} onChange={e=>setDeductAmount(e.target.value)}><option value="5">−5</option><option value="10">−10</option></select></label>
 <textarea required minLength={8} maxLength={300} placeholder="Причина и как исправить ситуацию" value={deductReason} onChange={e=>setDeductReason(e.target.value)}/><button type="submit">Зафиксировать списание</button></form></section>}
 {cloud.behavior.length>0&&<section className="mw-panel" id="behavior-history"><h3>История штрафов и дисциплинарных мер</h3>{cloud.behavior.map(x=><div className="mw-cloud-line" key={x.id}><div><strong>{x.cancelled_at?'Отменено':'−'+x.amount+' 🪙'}</strong><small>{x.reason}</small>{x.chore_date&&<small>Решение родителя за {x.chore_date}</small>}</div>{cloud.role==='parent'&&!x.cancelled_at&&<Action run={()=>cloud.rpc('cancel_behavior_point_deduction',{p_id:x.id})}>Вернуть</Action>}</div>)}</section>}
 {cloud.role==='parent'&&<ParentActivityJournal cloud={cloud}/>}
 </>;
}
function RewardEditor({cloud,item}:{cloud:Cloud;item:CloudItem}){
 const[edit,setEdit]=useState(false),[title,setTitle]=useState(item.title),[cost,setCost]=useState(item.cost||100),[active,setActive]=useState(item.active!==false);
 const[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function save(e:React.FormEvent){e.preventDefault();setBusy(true);setError('');
  try{await cloud.rpc('manage_reward',{p_id:item.id,p_title:title.trim(),p_cost:cost,p_active:active});setEdit(false)}
  catch(e){setError(e instanceof Error?e.message:'Не удалось обновить награду')}
  finally{setBusy(false)}}
 return <div className="mw-reward-editor"><button className="mw-inline-edit" type="button" onClick={()=>setEdit(x=>!x)}>{edit?'Отмена':'✎ Изменить награду'}</button>
  {edit&&<form className="mw-inline-editor" onSubmit={e=>void save(e)}><label>Название<input required maxLength={160} minLength={2} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Стоимость 🪙<input type="number" min={1} max={100000} required value={cost} onChange={e=>setCost(Number(e.target.value))}/></label><label className="mw-inline-check"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/>Награда доступна Илье</label><button disabled={busy}>{busy?'Сохраняем…':'Сохранить награду'}</button>{error&&<small role="alert" className="mw-cloud-error">{error}</small>}</form>}
 </div>;
}
function StoreRewardButton({cloud,item,reserved}:{cloud:Cloud;item:CloudItem;reserved:number}){
 const[busy,setBusy]=useState(false),[warning,setWarning]=useState(''),[success,setSuccess]=useState('');
 const gift=item.id===PLAYSTATION_30_REWARD_ID;
 const claimed=gift&&playStationClaimedToday(cloud.rewardRequests);
 const pending=cloud.rewardRequests.some(r=>r.reward_id===item.id&&r.status==='pending'&&(!gift||(r.requested_at&&new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(r.requested_at))===day())));
 const insufficient=cloud.balance-reserved<(item.cost||0);
 const disabled=busy||(!claimed&&(insufficient||pending));
 async function order(){
  if(busy)return;
  setSuccess('');setWarning('');
  if(claimed){setWarning('🎮 Илья, ты уже активировал подарок «30 минут PlayStation» сегодня. Повторно заказать его нельзя. Завтра можно получить ещё 30 минут, а накопленное время не сгорает.');return}
  setBusy(true);
  try{await cloud.rpc('request_reward',{p_reward:item.id});setSuccess(gift?'Запрос на подарок отправлен родителю. Сегодня повторить его уже нельзя.':'Запрос отправлен родителю.');}
  catch(e){const raw=e instanceof Error?e.message:'Не удалось оформить подарок';setWarning(gift&&(/уже активировал|once|duplicate|unique/i).test(raw)?'🎮 Ты уже активировал 30 минут PlayStation сегодня. Дождись завтра.':raw)}
  finally{setBusy(false)}
 }
 return <span className="mw-cloud-action mw-gift-purchase"><button type="button" disabled={disabled} onClick={()=>void order()}>{busy?'Отправляем…':claimed?'🎮 Заказать снова':pending?'Ожидает родителя':'Заказать'}</button>
 {gift&&<small className="mw-gift-daily-note">{claimed?'Сегодня подарок уже запрошен · повтор завтра':'Один подарок на 30 минут в день · время копится'}</small>}
 {warning&&<small className="mw-gift-warning" role="alert">{warning}</small>}{success&&<small className="mw-gift-success" role="status">{success}</small>}</span>
}
export function CloudShop({cloud}:{cloud:Cloud}){
 const[title,setTitle]=useState(''),[cost,setCost]=useState('100');
 const reserved=cloud.rewardRequests.filter(x=>x.status==='pending').reduce((n,x)=>n+Number(x.cost_snapshot),0);
 return <><section className="mw-greeting"><div className="mw-eyebrow">ПРЕЖНИЙ МАГАЗИН НАГРАД</div><h1>Сокровища острова 🎁</h1><p>Подарок «30 минут PlayStation» можно запросить один раз в день. После одобрения родителем минуты попадают в копилку и накапливаются.</p></section>
 <div className="mw-wallet"><span>ДОСТУПНО</span><strong>🪙 {Math.max(0,cloud.balance-reserved)}</strong><p>Всего {cloud.balance} · Зарезервировано {reserved}</p></div>
 <div className="mw-reward-grid">{cloud.rewards.filter(x=>cloud.role==='parent'||x.active!==false).map(x=><article className="mw-reward" key={x.id}><div className="mw-reward-icon">🎁</div><h3>{x.title}</h3>{x.active===false&&<small>Приостановлена</small>}<div className="mw-reward-foot"><strong>🪙 {x.cost}</strong>{cloud.role==='child'&&<StoreRewardButton cloud={cloud} item={x} reserved={reserved}/>}</div>{cloud.role==='parent'&&<RewardEditor cloud={cloud} item={x}/>}</article>)}</div>
 {cloud.role==='parent'&&<section className="mw-panel mw-cloud-form"><h3>Добавить награду</h3><form onSubmit={e=>{e.preventDefault();void cloud.rpc('create_reward',{p_family:cloud.familyId,p_title:title,p_cost:Number(cost)}).then(()=>setTitle('')).catch(e=>alert(e.message))}}><input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Название награды"/><input type="number" min={1} max={100000} required value={cost} onChange={e=>setCost(e.target.value)}/><button type="submit">Добавить</button></form></section>}
 <section className="mw-panel" id="review-rewards"><h3>История заказов</h3>{cloud.rewardRequests.map(r=><div className="mw-cloud-line" key={r.id} id={reviewAnchor('reward',r.id)} tabIndex={-1}><div><strong>{cloud.rewards.find(x=>x.id===r.reward_id)?.title||'Награда'}</strong><small>{r.status==='approved'?'✓ Выдано':r.status==='pending'?'⏳ Ожидает родителя':'Отклонено'} · {r.cost_snapshot} баллов {r.mystery_prize?' · '+r.mystery_prize:''}</small></div>{cloud.role==='parent'&&r.status==='pending'&&<><Action run={()=>cloud.rpc('review_reward',{p_request:r.id,p_approve:true})}>✓</Action><Action run={()=>cloud.rpc('review_reward',{p_request:r.id,p_approve:false})}>✕</Action></>}</div>)}{!cloud.rewardRequests.length&&<p>Покупок пока нет.</p>}</section>
 </>;
}
export function CloudSpiritual({cloud}:{cloud:Cloud}){
 const stage=spiritualStage(cloud.spiritualPoints);
 const [request,setRequest]=useState(''),[points,setPoints]=useState('10');
 return <><section className="mw-greeting"><div className="mw-eyebrow">МОЙ ДУХОВНЫЙ РОСТ</div><h1>🌾 Духовный рост</h1><p>Отдельный прогресс. Он не расходуется в магазине и не уменьшается из-за дисциплинарных мер.</p></section>
 <div className="mw-spirit-hero"><span>{stage.icon}</span><div><strong>{stage.name}</strong><p>Этап {stage.number} из 10</p><h2>{cloud.spiritualPoints} ✨</h2></div></div>
 <div className="mw-progress"><div className="mw-progress-head"><strong>До следующего этапа</strong><span>{stage.progress}/1000</span></div><div className="mw-progress-track"><div style={{width:`${stage.progress/1000*100}%`}}/></div></div>
 <GrowthFocus cloud={cloud}/>
 <BibleJourney key={cloud.session?.user.id} userId={cloud.session?.user.id||"guest"} readonly={cloud.role!=="child"}/>
 <PioneerSection cloud={cloud}/>
 <h3 className="mw-cloud-heading">Библейские занятия</h3>
 {spiritualSteps.map(x=>{const done=cloud.spiritual.some(r=>r.step_id===x.id&&r.activity_date===day()&&(x.id!=='daily-text'||Number(r.points)>=10));return <div className="mw-chore" key={x.id}><div className="mw-task-emoji">{x.icon}</div><div className="mw-task-body"><strong>{x.title}</strong><small>{done?'✓ Сегодня отмечено':x.rhythm==='daily'?'Ежедневное занятие':'По возможности'}</small></div><div className="mw-task-right"><b>+{x.points} ✨</b>{cloud.role==='child'&&(x.id==='daily-text'?<button type='button' className='mw-read-quicklink' onClick={()=>document.querySelector('.daily-reader')?.scrollIntoView({behavior:'smooth',block:'start'})}>{done?'✓ Прочитано':'Читать'}</button>:<Action run={()=>cloud.rpc(done?'unmark_spiritual_activity':'mark_spiritual_activity',{p_family:cloud.familyId,p_date:day(),p_step:x.id})}>{done?'Отменить':'Отметить'}</Action>)}</div></div>})}
 {cloud.role==='child'&&<section className="mw-panel mw-cloud-form"><h3>💡 Предложить дополнительные духовные очки</h3><form onSubmit={e=>{e.preventDefault();void cloud.rpc('request_spiritual_points',{p_family:cloud.familyId,p_title:request,p_points:Number(points)}).then(()=>setRequest('')).catch(e=>alert(e.message))}}><input required maxLength={160} minLength={3} placeholder="Что я сделал?" value={request} onChange={e=>setRequest(e.target.value)}/><input type="number" min={1} max={100} required value={points} onChange={e=>setPoints(e.target.value)}/><button type="submit">Отправить родителю</button></form></section>}
 {cloud.pendingSpiritual.length>0&&<section className="mw-panel" id="review-spiritual"><h3>Предложения духовных очков</h3>{cloud.pendingSpiritual.map(x=><div className="mw-cloud-line" key={x.id} id={reviewAnchor('spiritual',x.id)} tabIndex={-1}><div><strong>{x.title}</strong><small>{x.status} · {x.proposed_points} ✨</small></div>{cloud.role==='parent'&&x.status==='pending'&&<><Action run={()=>cloud.rpc('review_spiritual_points_request',{p_request:x.id,p_approve:true,p_points:x.proposed_points})}>Принять</Action><Action run={()=>cloud.rpc('review_spiritual_points_request',{p_request:x.id,p_approve:false,p_points:null})}>Отказать</Action></>}</div>)}</section>}
 </>;
}
