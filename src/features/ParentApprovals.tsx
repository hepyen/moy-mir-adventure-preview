import {useState} from 'react';
import type {useFamilyCloud} from '../lib/useFamilyCloud';
import {reviewAnchor,reviewDestination} from '../notifications/destinations';
import type {Destination,ReviewKind} from '../notifications/destinations';
import './ParentApprovals.css';

type Cloud=ReturnType<typeof useFamilyCloud>;
export type Approval={
 kind:ReviewKind; id:string; title:string; detail:string; date?:string;
 decision?:(approve:boolean)=>Promise<unknown>;
};

export function taskApprovals(cloud:Cloud):Approval[]{
 const dailyTitles=new Map(cloud.dailyTemplates.map(x=>[x.id,x.title]));
 const taskTitles=new Map(cloud.tasks.map(x=>[x.id,x.title]));
 const daily:Approval[]=cloud.dailyDone.filter(row=>row.status==='pending').map(row=>({
  kind:'daily',id:row.id,title:dailyTitles.get(row.template_id)??'Ежедневное дело',detail:'Выполнено ежедневное дело',date:row.activity_date,
  decision:approve=>cloud.rpc('review_daily_chore',{p_completion:row.id,p_approve:approve}),
 }));
 const tasks:Approval[]=cloud.activity.filter(row=>row.status==='pending').map(row=>({
  kind:'task',id:row.id,title:taskTitles.get(row.task_id)??'Задание',detail:'Выполнено задание',date:row.activity_date,
  decision:approve=>cloud.rpc('review_task',{p_submission_id:row.id,p_approve:approve}),
 }));
 return [...daily,...tasks].sort((a,b)=>(b.date??'').localeCompare(a.date??''));
}

export function ApprovalCard({item,onOpen,anchored=false}:{item:Approval;onOpen?:(destination:Destination)=>void;anchored?:boolean}){
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 async function decide(approve:boolean){
  if(!item.decision||busy)return;
  setBusy(true);
  setError('');
  try{await item.decision(approve)}
  catch(e){setError(e instanceof Error?e.message:(e as {message?:string})?.message||'Не удалось сохранить решение')}
  finally{setBusy(false)}
 }
 return <article className="mw-approval-card" id={anchored?reviewAnchor(item.kind,item.id):undefined} tabIndex={anchored?-1:undefined}>
  <div className="mw-approval-copy">
   <strong>{item.title}</strong>
   <small>{item.detail}{item.date&&' · '+new Date(item.date+'T12:00:00Z').toLocaleDateString('ru-RU',{day:'numeric',month:'short',timeZone:'Europe/Madrid'})}</small>
  </div>
  <div className="mw-approval-actions">
   {item.decision&&<><button type="button" disabled={busy} onClick={()=>void decide(true)}>Подтвердить</button><button type="button" className="mw-approval-reject" disabled={busy} onClick={()=>void decide(false)}>Отклонить</button></>}
   {onOpen&&<button type="button" className="mw-approval-open" onClick={()=>onOpen(reviewDestination(item.kind,item.id))}>Открыть</button>}
  </div>
  {error&&<p className="mw-cloud-error" role="alert">{error}</p>}
 </article>;
}

export function ParentApprovals({cloud,onOpen}:{cloud:Cloud;onOpen:(destination:Destination)=>void}){
 const entries:Approval[]=[
  ...taskApprovals(cloud),
  ...cloud.proposals.filter(row=>row.status==='pending').map((row):Approval=>({
   kind:'proposal',id:row.id,title:row.title,detail:'Предложение задания · '+row.proposed_points+' баллов',
   decision:approve=>cloud.rpc('review_child_task_proposal',{p_proposal:row.id,p_approve:approve,p_points:approve?row.proposed_points:null}),
  })),
  ...cloud.rewardRequests.filter(row=>row.status==='pending').map((row):Approval=>({
   kind:'reward',id:row.id,title:cloud.rewards.find(reward=>reward.id===row.reward_id)?.title??'Награда',detail:'Запрос награды · '+row.cost_snapshot+' баллов',
   decision:approve=>cloud.rpc('review_reward',{p_request:row.id,p_approve:approve}),
  })),
  ...cloud.pendingSpiritual.filter(row=>row.status==='pending').map((row):Approval=>({
   kind:'spiritual',id:row.id,title:row.title,detail:'Запрос духовных очков · '+row.proposed_points+' очков',
   decision:approve=>cloud.rpc('review_spiritual_points_request',{p_request:row.id,p_approve:approve,p_points:approve?row.proposed_points:null}),
  })),
  ...cloud.pendingPlaytime.filter(row=>row.status==='pending').map((row):Approval=>({
   kind:'playtime',id:row.id,title:row.minutes+' мин PlayStation',detail:'Запрос игрового времени',
   decision:approve=>cloud.rpc('moymir_playtime_review',{p_id:row.id,p_approve:approve}),
  })),
  ...cloud.pendingMeals.filter(row=>row.status==='pending').map((row):Approval=>({
   kind:'meal',id:row.id,title:row.suggestion,detail:'Предложение блюда',
  })),
 ];
 return <section className="mw-panel mw-approvals" aria-label="Ждёт вашего решения">
  <div className="mw-approvals-heading"><div><h2>Ждёт вашего решения</h2><p>{cloud.childName} · задания и запросы</p></div><strong className="mw-approvals-count">{entries.length}</strong></div>
  {entries.length===0&&<p>{cloud.error?'Не удалось обновить список.':'Сейчас всё проверено.'}</p>}
  {entries.map(item=><ApprovalCard key={item.kind+':'+item.id} item={item} onOpen={onOpen}/>)}
 </section>;
}
