import React,{useState} from 'react';
import type {CloudItem} from '../../lib/useFamilyCloud';
import {useFamilyCloud} from '../../lib/useFamilyCloud';
import {spiritualSteps,spiritualStage} from '../../lib/spiritualProgress';
import './CloudPanels.css';
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
  <small>Не регистрируй новую семью. Нужен уже существующий аккаунт.</small>
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
  <p>Создавай дела на выбранные дни недели. Можно выключить старое задание без удаления истории.</p>
  <form onSubmit={e=>void create(e)}>
   <input required maxLength={160} placeholder="Например, почистить зубы вечером" value={title} onChange={e=>setTitle(e.target.value)}/>
   <div className="mw-cloud-inline"><label>Значок<input aria-label="Значок ежедневного дела" maxLength={8} value={icon} onChange={e=>setIcon(e.target.value)}/></label>
   <label>Баллы<input type="number" min={0} max={1000} required value={points} onChange={e=>setPoints(e.target.value)}/></label></div>
   <div className="mw-weekdays">{names.map((name,i)=><label key={i}><input type="checkbox" checked={weekdays.includes(i)} onChange={e=>setWeekdays(old=>e.target.checked?[...old,i].sort():old.filter(x=>x!==i))}/>{name}</label>)}</div>
   {error&&<small className="mw-cloud-error" role="alert">{error}</small>}
   <button type="submit" disabled={busy}>{busy?'Сохраняем…':'Добавить ежедневное дело'}</button>
  </form>
  {cloud.dailyTemplates.map(t=><div className="mw-cloud-line" key={t.id}><div><strong>{t.icon||'✅'} {t.title}</strong><small>+{t.points} монет · {(t.weekdays||[]).map(d=>names[d]).join(', ')} · {t.active?'Активно':'Приостановлено'}</small></div>
   <Action run={()=>cloud.rpc('manage_daily_chore',{p_id:t.id,p_title:t.title,p_points:t.points,p_icon:t.icon||'✅',p_weekdays:t.weekdays||[0,1,2,3,4,5,6],p_active:!t.active})}>{t.active?'Выключить':'Включить'}</Action></div>)}
 </details>
}
export function CloudTasks({cloud}:{cloud:Cloud}){
 const[title,setTitle]=useState(''),[points,setPoints]=useState('10'),[propose,setPropose]=useState(''),[proposePoints,setProposePoints]=useState('10');
 const[deductReason,setDeductReason]=useState(''),[deductAmount,setDeductAmount]=useState('5'),[category,setCategory]=useState('agreement');
 const all=[...cloud.daily.map(x=>({...x,kind:'daily'})),...cloud.tasks.map(x=>({...x,kind:'ordinary'}))];
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
 {cloud.role==='child'&&<section className="mw-panel mw-cloud-form"><h3>💡 Предложить задание</h3><p>Предложение отправится родителям на рассмотрение.</p>
 <form onSubmit={e=>{e.preventDefault();void onProposal().catch(e=>alert(e.message))}}><input required maxLength={160} placeholder="Например, помочь приготовить ужин" value={propose} onChange={e=>setPropose(e.target.value)}/><label>Баллы<input type="number" min={0} max={1000} required value={proposePoints} onChange={e=>setProposePoints(e.target.value)}/></label><button type="submit">Отправить родителю</button></form></section>}
 {cloud.role==='parent'&&<section className="mw-panel mw-cloud-form"><h3>➕ Добавить задание</h3><form onSubmit={e=>{e.preventDefault();void onCreate().catch(e=>alert(e.message))}}><input required maxLength={160} placeholder="Название задания" value={title} onChange={e=>setTitle(e.target.value)}/><label>Баллы<input type="number" min={0} max={1000} value={points} onChange={e=>setPoints(e.target.value)}/></label><button type="submit">Создать задание</button></form></section>}
 {cloud.role==='parent'&&<DailySettings cloud={cloud}/>}
 <h3 className="mw-cloud-heading">🗓️ Ежедневные дела ({cloud.daily.length})</h3>
 {all.length===0&&<p className="mw-note">Заданий пока нет. Нажми «Обновить» на панели аккаунта.</p>}
 {all.map(x=><article className="mw-chore" key={x.kind+x.id}><div className="mw-task-emoji">{x.icon||'✅'}</div><div className="mw-task-body"><strong>{x.title}</strong><small>{x.status==='approved'?'✓ Подтверждено':x.status==='pending'?'⏳ Ожидает решения родителя':'Доступно сегодня'} · {x.kind==='daily'?'Ежедневное':'Обычное'}</small></div><div className="mw-task-right"><b>+{x.points} 🪙</b>
 {cloud.role==='child'&&x.status!=='pending'&&x.status!=='approved'&&<Action run={()=>submit(x,x.kind)}>Готово</Action>}
 {cloud.role==='parent'&&x.status==='pending'&&<div className="mw-cloud-inline"><Action run={()=>review(x,x.kind,true)}>✓</Action><Action run={()=>review(x,x.kind,false)}>✕</Action></div>}
 </div></article>)}
 <section className="mw-panel mw-cloud-form"><h3>💡 Предложения заданий</h3>
 {cloud.proposals.length===0&&<p>Предложений пока нет.</p>}
 {cloud.proposals.map(x=><div className="mw-cloud-line" key={x.id}><div><strong>{x.title}</strong><small>{x.status==='pending'?'На рассмотрении':x.status==='approved'?'✓ Принято':x.status==='rejected'?'Отклонено':'Отменено'} · {x.proposed_points} баллов</small></div>
 {cloud.role==='parent'&&x.status==='pending'&&<><Action run={()=>cloud.rpc('review_child_task_proposal',{p_proposal:x.id,p_approve:true,p_points:x.proposed_points})}>Принять</Action><Action run={()=>cloud.rpc('review_child_task_proposal',{p_proposal:x.id,p_approve:false,p_points:null})}>Отклонить</Action></>}
 </div>)}</section>
 {cloud.role==='parent'&&<section className="mw-panel mw-cloud-form"><h3>⚖️ Дисциплинарные меры</h3><p>Списания уменьшают баланс магазина, но не разрушают построенный мир.</p>
 <form onSubmit={e=>{e.preventDefault();void cloud.rpc('add_behavior_point_deduction',{p_family:cloud.familyId,p_child:cloud.childId,p_category:category,p_reason:deductReason,p_amount:Number(deductAmount)}).then(()=>setDeductReason('')).catch(e=>alert(e.message))}}>
 <select value={category} onChange={e=>setCategory(e.target.value)}><option value="agreement">Нарушение договорённости</option><option value="respect">Неуважительный разговор</option><option value="kindness">Обидные слова</option><option value="honesty">Вопрос честности</option><option value="other">Другое</option></select>
 <label>Баллы<select value={deductAmount} onChange={e=>setDeductAmount(e.target.value)}><option value="5">−5</option><option value="10">−10</option></select></label>
 <textarea required minLength={8} maxLength={300} placeholder="Причина и как исправить ситуацию" value={deductReason} onChange={e=>setDeductReason(e.target.value)}/><button type="submit">Зафиксировать списание</button></form></section>}
 {cloud.behavior.length>0&&<section className="mw-panel"><h3>История дисциплинарных мер</h3>{cloud.behavior.map(x=><div className="mw-cloud-line" key={x.id}><div><strong>{x.cancelled_at?'Отменено':'−'+x.amount+' 🪙'}</strong><small>{x.reason}</small></div>{cloud.role==='parent'&&!x.cancelled_at&&<Action run={()=>cloud.rpc('cancel_behavior_point_deduction',{p_id:x.id})}>Вернуть</Action>}</div>)}</section>}
 </>;
}
export function CloudShop({cloud}:{cloud:Cloud}){
 const[title,setTitle]=useState(''),[cost,setCost]=useState('100');
 const reserved=cloud.rewardRequests.filter(x=>x.status==='pending').reduce((n,x)=>n+Number(x.cost_snapshot),0);
 return <><section className="mw-greeting"><div className="mw-eyebrow">ПРЕЖНИЙ МАГАЗИН НАГРАД</div><h1>Сокровища острова 🎁</h1><p>Те же призы и цены, что и в действующем семейном приложении.</p></section>
 <div className="mw-wallet"><span>ДОСТУПНО</span><strong>🪙 {Math.max(0,cloud.balance-reserved)}</strong><p>Всего {cloud.balance} · Зарезервировано {reserved}</p></div>
 <div className="mw-reward-grid">{cloud.rewards.map(x=><article className="mw-reward" key={x.id}><div className="mw-reward-icon">🎁</div><h3>{x.title}</h3><div className="mw-reward-foot"><strong>🪙 {x.cost}</strong>{cloud.role==='child'&&<Action disabled={cloud.balance-reserved<(x.cost||0)||cloud.rewardRequests.some(r=>r.reward_id===x.id&&r.status==='pending')} run={()=>cloud.rpc('request_reward',{p_reward:x.id})}>Заказать</Action>}</div></article>)}</div>
 {cloud.role==='parent'&&<section className="mw-panel mw-cloud-form"><h3>Добавить награду</h3><form onSubmit={e=>{e.preventDefault();void cloud.rpc('create_reward',{p_family:cloud.familyId,p_title:title,p_cost:Number(cost)}).then(()=>setTitle('')).catch(e=>alert(e.message))}}><input required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Название награды"/><input type="number" min={1} max={100000} required value={cost} onChange={e=>setCost(e.target.value)}/><button type="submit">Добавить</button></form></section>}
 <section className="mw-panel"><h3>История заказов</h3>{cloud.rewardRequests.map(r=><div className="mw-cloud-line" key={r.id}><div><strong>{cloud.rewards.find(x=>x.id===r.reward_id)?.title||'Награда'}</strong><small>{r.status==='approved'?'✓ Выдано':r.status==='pending'?'⏳ Ожидает родителя':'Отклонено'} · {r.cost_snapshot} баллов {r.mystery_prize?' · '+r.mystery_prize:''}</small></div>{cloud.role==='parent'&&r.status==='pending'&&<><Action run={()=>cloud.rpc('review_reward',{p_request:r.id,p_approve:true})}>✓</Action><Action run={()=>cloud.rpc('review_reward',{p_request:r.id,p_approve:false})}>✕</Action></>}</div>)}{!cloud.rewardRequests.length&&<p>Покупок пока нет.</p>}</section>
 </>;
}
export function CloudSpiritual({cloud}:{cloud:Cloud}){
 const stage=spiritualStage(cloud.spiritualPoints);
 const [request,setRequest]=useState(''),[points,setPoints]=useState('10');
 return <><section className="mw-greeting"><div className="mw-eyebrow">МОЙ ДУХОВНЫЙ РОСТ</div><h1>🌾 Духовный рост</h1><p>Отдельный прогресс. Он не расходуется в магазине и не уменьшается из-за дисциплинарных мер.</p></section>
 <div className="mw-spirit-hero"><span>{stage.icon}</span><div><strong>{stage.name}</strong><p>Этап {stage.number} из 10</p><h2>{cloud.spiritualPoints} ✨</h2></div></div>
 <div className="mw-progress"><div className="mw-progress-head"><strong>До следующего этапа</strong><span>{stage.progress}/1000</span></div><div className="mw-progress-track"><div style={{width:`${stage.progress/1000*100}%`}}/></div></div>
 <h3 className="mw-cloud-heading">Библейские занятия</h3>
 {spiritualSteps.map(x=>{const done=cloud.spiritual.some(r=>r.step_id===x.id&&r.activity_date===day());return <div className="mw-chore" key={x.id}><div className="mw-task-emoji">{x.icon}</div><div className="mw-task-body"><strong>{x.title}</strong><small>{done?'✓ Сегодня отмечено':x.rhythm==='daily'?'Ежедневное занятие':'По возможности'}</small></div><div className="mw-task-right"><b>+{x.points} ✨</b>{cloud.role==='child'&&<Action run={()=>cloud.rpc(done?'unmark_spiritual_activity':'mark_spiritual_activity',{p_family:cloud.familyId,p_date:day(),p_step:x.id})}>{done?'Отменить':'Отметить'}</Action>}</div></div>})}
 {cloud.role==='child'&&<section className="mw-panel mw-cloud-form"><h3>💡 Предложить дополнительные духовные очки</h3><form onSubmit={e=>{e.preventDefault();void cloud.rpc('request_spiritual_points',{p_family:cloud.familyId,p_title:request,p_points:Number(points)}).then(()=>setRequest('')).catch(e=>alert(e.message))}}><input required maxLength={160} minLength={3} placeholder="Что я сделал?" value={request} onChange={e=>setRequest(e.target.value)}/><input type="number" min={1} max={100} required value={points} onChange={e=>setPoints(e.target.value)}/><button type="submit">Отправить родителю</button></form></section>}
 {cloud.pendingSpiritual.length>0&&<section className="mw-panel"><h3>Предложения духовных очков</h3>{cloud.pendingSpiritual.map(x=><div className="mw-cloud-line" key={x.id}><div><strong>{x.title}</strong><small>{x.status} · {x.proposed_points} ✨</small></div>{cloud.role==='parent'&&x.status==='pending'&&<><Action run={()=>cloud.rpc('review_spiritual_points_request',{p_request:x.id,p_approve:true,p_points:x.proposed_points})}>Принять</Action><Action run={()=>cloud.rpc('review_spiritual_points_request',{p_request:x.id,p_approve:false,p_points:null})}>Отказать</Action></>}</div>)}</section>}
 </>;
}
