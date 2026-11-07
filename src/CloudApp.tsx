import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import PasswordRecovery from './PasswordRecovery'
import { reviewTask, submitTask } from './lib/familyApi'
import type { Session } from '@supabase/supabase-js'
import {lazy,Suspense} from 'react'
import {RewardAnimation} from './world/RewardAnimation'
import {SpiritualStem} from './world/SpiritualStem'
import {spiritualSteps,spiritualStage,spiritualMilestone} from './lib/spiritualProgress'
import {localDay} from './lib/dailyTasks'
import {NotificationInbox} from './notifications/NotificationInbox'
import {FamilyChat} from './chat/FamilyChat'
// Separate Android test package has not been enrolled for native FCM yet.
// Existing primary app keeps its current push notifications.
const World3D=lazy(()=>import('./world/World3D').then(module=>({default:module.World3D})))

type Role = 'parent' | 'child'
type Member = { family_id: string; role: Role }
type Child = { user_id: string; display_name?:string }
type Task = { id: string; title: string; points: number; assigned_child: string }
type Submission = { id: string; task_id: string; child_id: string; activity_date: string; status: 'pending' | 'approved' | 'rejected' }
type DailyTemplate={id:string;child_id:string;title:string;points:number;icon:string;weekdays:number[];active:boolean}
type DailyCompletion={id:string;template_id:string;child_id:string;activity_date:string;status:'pending'|'approved'|'rejected';points_awarded:number}
type ChildProposal={
 id:string;family_id:string;child_id:string;title:string;proposed_points:number;
 approved_points:number|null;status:'pending'|'approved'|'rejected'|'cancelled';created_task_id:string|null
}
type BehaviorPoint={id:string;child_id:string;category:string;reason:string;amount:number;created_at:string;cancelled_at:string|null}
type Reward = { id: string; title: string; cost: number; active: boolean }
type SpiritualRow={id:string;child_id:string;activity_date:string;step_id:string;points:number}
type SpiritualRequest={id:string;child_id:string;title:string;proposed_points:number;approved_points:number|null;status:'pending'|'approved'|'rejected'|'cancelled';created_at:string}
type RewardRequest = { id: string; reward_id: string; child_id: string; cost_snapshot: number; status: 'pending' | 'approved' | 'rejected'; mystery_prize: string | null }

function Message({ children }: { children: React.ReactNode }) {
  return <p className="notice" role="status">{children}</p>
}

export default function CloudApp({ onDemo }: { onDemo: () => void }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!!supabase)
  const [membership, setMembership] = useState<Member | null>(null)
  const [mode, setMode] = useState<Role>('parent')
  const [register, setRegister] = useState(false)
  const [recoveryOpen,setRecoveryOpen]=useState(false)
  const [chatOpen,setChatOpen]=useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [message, setMessage] = useState('')
  const [dailyFeedback,setDailyFeedback]=useState('')
  const [busy, setBusy] = useState(false)
  const [children, setChildren] = useState<Child[]>([])
  const [childNameEdit,setChildNameEdit]=useState<string|null>(null)
  const [childNameValue,setChildNameValue]=useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [balances, setBalances] = useState<{ child_id: string; delta: number }[]>([])
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPoints, setTaskPoints] = useState('20')
  const [targetChild, setTargetChild] = useState('')
  const [generatedInvite, setGeneratedInvite] = useState('')
  const [generatedParentInvite,setGeneratedParentInvite]=useState('')
  const [rewards, setRewards] = useState<Reward[]>([])
  const [rewardRequests, setRewardRequests] = useState<RewardRequest[]>([])
  const [worldStages,setWorldStages]=useState<{child_id:string;active_world:number}[]>([])
  const [viewFinishedWorld,setViewFinishedWorld]=useState(false)
  const [rewardCelebration,setRewardCelebration]=useState<Reward|null>(null)
  const [revealedMysteryPrize,setRevealedMysteryPrize]=useState<string|null>(null)
  const [rewardTitle, setRewardTitle] = useState('')
  const [rewardCost, setRewardCost] = useState('50')
  const [editingReward,setEditingReward]=useState<string|null>(null)
  const [editRewardTitle,setEditRewardTitle]=useState('')
  const [editRewardCost,setEditRewardCost]=useState('')
  const [showArchivedRewards,setShowArchivedRewards]=useState(false)
  const [behaviorRows,setBehaviorRows]=useState<BehaviorPoint[]>([])
  const [behaviorCategory,setBehaviorCategory]=useState('respect')
  const [behaviorReason,setBehaviorReason]=useState('')
  const [behaviorAmount,setBehaviorAmount]=useState('5')
  const [spiritualRows,setSpiritualRows]=useState<SpiritualRow[]>([])
  const [spiritualRequests,setSpiritualRequests]=useState<SpiritualRequest[]>([])
  const [spiritualRequestTitle,setSpiritualRequestTitle]=useState('')
  const [spiritualRequestPoints,setSpiritualRequestPoints]=useState('10')
  const [spiritualEditing,setSpiritualEditing]=useState<string|null>(null)
  const [spiritualReviewing,setSpiritualReviewing]=useState<string|null>(null)
  const [spiritualApprovedPoints,setSpiritualApprovedPoints]=useState('10')
  const [spiritualPreview,setSpiritualPreview]=useState<number|null>(null)
  const [spiritualToday,setSpiritualToday]=useState(()=>localDay(new Date()))
  const [dailyTemplates,setDailyTemplates]=useState<DailyTemplate[]>([])
  const [dailyCompletions,setDailyCompletions]=useState<DailyCompletion[]>([])
  const [childProposals,setChildProposals]=useState<ChildProposal[]>([])
  const [suggestionTitle,setSuggestionTitle]=useState('')
  const [suggestionPoints,setSuggestionPoints]=useState('20')
  const [reviewedProposal,setReviewedProposal]=useState<string|null>(null)
  const [proposalPoints,setProposalPoints]=useState('20')
  const [editingDaily,setEditingDaily]=useState<string|null>(null)
  const [dailyTitle,setDailyTitle]=useState('')
  const [dailyPoints,setDailyPoints]=useState('5')
  const [dailyIcon,setDailyIcon]=useState('✅')
  const [dailyWeekdays,setDailyWeekdays]=useState<number[]>([0,1,2,3,4,5,6])
  const [showArchivedDaily,setShowArchivedDaily]=useState(false)
  const [addingDaily,setAddingDaily]=useState(false)

  const refresh = useCallback(async (userId: string) => {
    if (!supabase) return
    const { data: memberRows, error: memberError } = await supabase.from('family_members')
      .select('family_id,role').eq('user_id',userId).limit(1)
    if (memberError) throw memberError
    const member = memberRows?.[0] as Member | undefined
    setMembership(member ?? null)
    if (!member) { setChildren([]); setTasks([]); setSubmissions([]); setBalances([]); setRewards([]); setRewardRequests([]); setWorldStages([]);setSpiritualRows([]);setSpiritualRequests([]);setDailyTemplates([]);setDailyCompletions([]);setChildProposals([]);setBehaviorRows([]);return }
    const [people, jobs, reviews, ledger, catalogue, requests] = await Promise.all([
      member.role === 'parent'
        ? supabase.from('family_members').select('user_id').eq('family_id',member.family_id).eq('role','child')
        : Promise.resolve({ data: [] as Child[], error: null }),
      supabase.from('tasks').select('id,title,points,assigned_child').eq('family_id',member.family_id),
      supabase.from('task_submissions').select('id,task_id,child_id,activity_date,status'),
      supabase.from('point_ledger').select('child_id,delta').eq('family_id',member.family_id),
      supabase.from('rewards').select('id,title,cost,active').eq('family_id',member.family_id),
      supabase.from('reward_requests').select('id,reward_id,child_id,cost_snapshot,status,mystery_prize').eq('family_id',member.family_id),
    ])
    for (const result of [people,jobs,reviews,ledger,catalogue,requests]) if (result.error) throw result.error
    const profiles=member.role==='parent'
      ?await supabase.from('family_child_profiles').select('child_id,display_name').eq('family_id',member.family_id)
      :null
    if(profiles?.error)throw profiles.error
    const names=new Map((profiles?.data??[]).map(p=>[p.child_id,p.display_name]))
    setChildren(((people.data ?? []) as Child[]).map(c=>({...c,display_name:names.get(c.user_id)??undefined})))
    setTasks((jobs.data ?? []) as Task[])
    setSubmissions((reviews.data ?? []) as Submission[])
    setBalances((ledger.data ?? []) as { child_id: string; delta: number }[])
    setRewards((catalogue.data ?? []) as Reward[])
    setRewardRequests((requests.data ?? []) as RewardRequest[])
    const [dailyDefinitions,dailyDone]=await Promise.all([
      supabase.from('daily_chore_templates').select('id,child_id,title,points,icon,weekdays,active').eq('family_id',member.family_id),
      supabase.from('daily_chore_completions').select('id,template_id,child_id,activity_date,status,points_awarded').eq('family_id',member.family_id),
    ])
    if(dailyDefinitions.error)throw dailyDefinitions.error
    if(dailyDone.error)throw dailyDone.error
    setDailyTemplates((dailyDefinitions.data??[]) as DailyTemplate[])
    setDailyCompletions((dailyDone.data??[]) as DailyCompletion[])
    const proposalResult=await supabase.from('child_task_proposals')
      .select('id,family_id,child_id,title,proposed_points,approved_points,status,created_task_id')
      .eq('family_id',member.family_id)
      .order('created_at',{ascending:false})
    if(proposalResult.error)throw proposalResult.error
    setChildProposals((proposalResult.data??[]) as ChildProposal[])
    const behaviors=await supabase.from('behavior_points')
      .select('id,child_id,category,reason,amount,created_at,cancelled_at')
      .eq('family_id',member.family_id).order('created_at',{ascending:false})
    if(behaviors.error)throw behaviors.error
    setBehaviorRows((behaviors.data??[]) as BehaviorPoint[])
    const spiritual=await supabase.from('spiritual_activity_records')
      .select('id,child_id,activity_date,step_id,points')
      .eq('family_id',member.family_id)
    if(spiritual.error)throw spiritual.error
    setSpiritualRows((spiritual.data??[]) as SpiritualRow[])
    const extras=await supabase.from('spiritual_point_requests')
      .select('id,child_id,title,proposed_points,approved_points,status,created_at')
      .eq('family_id',member.family_id).order('created_at',{ascending:false})
    if(extras.error)throw extras.error
    setSpiritualRequests((extras.data??[]) as SpiritualRequest[])
    const worlds=await supabase.from('child_world_progress').select('child_id,active_world').eq('family_id',member.family_id)
    if(!worlds.error)setWorldStages((worlds.data??[]) as {child_id:string;active_world:number}[])
  }, [])

  // Lightweight credit sync while the app is visible. Realtime can be delayed on mobile WebViews.
  // Keep this independent of the slower complete family refresh.
  const refreshCredits=useCallback(async (familyId:string)=>{
    if(!supabase)return
    const [ledger,daily]=await Promise.all([
      supabase.from('point_ledger').select('child_id,delta').eq('family_id',familyId),
      supabase.from('daily_chore_completions').select('id,template_id,child_id,activity_date,status,points_awarded').eq('family_id',familyId),
    ])
    if(ledger.error||daily.error)throw ledger.error??daily.error
    setBalances((ledger.data??[]) as {child_id:string;delta:number}[])
    setDailyCompletions((daily.data??[]) as DailyCompletion[])
  },[])

  useEffect(()=>{
    if(!session||!membership)return
    let active=true
    let running=false
    const sync=()=>{
      if(!active||running||document.visibilityState==='hidden')return
      running=true
      void refreshCredits(membership.family_id)
        .catch(error=>{if(active)console.warn('Баллы: временная задержка синхронизации',error)})
        .finally(()=>{running=false})
    }
    sync()
    const timer=window.setInterval(sync,5000)
    const resume=()=>{sync()}
    window.addEventListener('focus',resume)
    document.addEventListener('visibilitychange',resume)
    return()=>{active=false;window.clearInterval(timer);window.removeEventListener('focus',resume);document.removeEventListener('visibilitychange',resume)}
  },[session,membership,refreshCredits])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    let active = true
    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setMessage(error.message)
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = client.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if(event==='SIGNED_OUT'){setMembership(null);setMessage('')}
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!session) return
    let active = true
    void Promise.resolve().then(() => refresh(session.user.id)).catch(error => { if (active) setMessage(String(error.message ?? error)) })
    return () => { active = false }
  }, [session, refresh])

  useEffect(()=>{
    const timer=window.setInterval(()=>setSpiritualToday(localDay(new Date())),60000)
    return()=>window.clearInterval(timer)
  },[])

  // Periodic sync is a fallback until database change feeds are configured.
  // No timer is created for guests or the offline demonstration.
  useEffect(() => {
    if (!session || !membership) return
    const timer = setInterval(() => {
      void refresh(session.user.id).catch(error => setMessage(String(error.message ?? error)))
    }, 20000)
    return () => clearInterval(timer)
  }, [session, membership, refresh])

  // Fast cross-device delivery for approved chores, reward requests and family membership.
  // RLS protects each table; a 20-second polling fallback remains for outages.
  useEffect(() => {
    if (!supabase || !session || !membership) return
    const client = supabase
    const filter = `family_id=eq.${membership.family_id}`
    let refreshTimer: ReturnType<typeof setTimeout>|null = null
    const notify=()=>{
      if (refreshTimer!==null)clearTimeout(refreshTimer)
      refreshTimer=setTimeout(()=>{
        void refresh(session.user.id).catch(error=>setMessage(String(error.message??error)))
      },180)
    }
    const channel=client.channel(`family-${membership.family_id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'tasks',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'point_ledger',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'rewards',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'reward_requests',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'family_members',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'child_world_progress',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'spiritual_activity_records',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'spiritual_point_requests',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'daily_chore_templates',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'daily_chore_completions',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'child_task_proposals',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'family_child_profiles',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'behavior_points',filter},notify)
      .on('postgres_changes',{event:'*',schema:'public',table:'task_submissions'},notify)
      .subscribe()
    return()=>{
      if(refreshTimer!==null)clearTimeout(refreshTimer)
      void client.removeChannel(channel)
    }
  },[session,membership,refresh])

  async function action(callback: () => Promise<void>) {
    setBusy(true)
    setMessage('')
    try { await callback(); if (session) await refresh(session.user.id) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Ошибка связи с сервером') }
    finally { setBusy(false) }
  }
  async function signIn(e: React.FormEvent) {
    e.preventDefault()
    await action(async () => {
      if (!supabase) throw new Error('Для настоящего входа требуется подключить Supabase.')
      if (password.length < 8) throw new Error('Пароль должен содержать минимум 8 символов.')
      if (register) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.session) { setSession(data.session); setMessage('Аккаунт создан. Завершите настройку семьи.') }
        else setMessage('Проверьте почту и подтвердите адрес, затем войдите.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    })
  }

  if(recoveryOpen)return <PasswordRecovery onBack={()=>setRecoveryOpen(false)}/>
  if (loading) return <main className="shell"><h1>МОЙ МИР</h1><p>Проверяем вход…</p></main>
  if (!session) return <main className="shell auth-shell">
    <div className="brand"><span className="logo">✦</span><div><h1>МОЙ МИР</h1><small>Семейные задания и награды</small></div></div>
    <section className="auth-card">
      <span className="eyebrow">ЛИЧНОЕ ПРОСТРАНСТВО</span>
      <h2>Добро пожаловать!</h2>
      <p className="muted">У каждого участника свой аккаунт. Ребёнок не сможет подтверждать задания за родителя.</p>
      <div className="account-tabs" role="group" aria-label="Тип аккаунта">
        <button className={mode==='parent'?'selected':''} onClick={() => setMode('parent')}>👨‍👩‍👦 Я родитель</button>
        <button className={mode==='child'?'selected':''} onClick={() => setMode('child')}>🧒 Я ребёнок</button>
      </div>
      <h3>{register ? 'Создать аккаунт' : 'Войти в аккаунт'}</h3>
      <form className="auth-form" onSubmit={e => { void signIn(e) }}>
        <label>Электронная почта<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></label>
        <label>Пароль<input required minLength={8} type="password" autoComplete={register?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Не менее 8 символов"/></label>
        <button className="action primary" disabled={busy || !supabase} type="submit">{register ? 'Зарегистрироваться' : 'Войти'}</button>
      </form>
      <button className="text-button" onClick={()=>{setRegister(!register);setMessage('')}}>{register?'Уже есть аккаунт? Войти':'Нет аккаунта? Зарегистрироваться'}</button>
      {!register&&<button type="button" className="text-button" onClick={()=>setRecoveryOpen(true)}>🔑 Забыли пароль?</button>}
      <p className="muted small-info">{mode==='child'?'После регистрации введи код, который даст родитель.':'После регистрации вы сможете создать семью и пригласить ребёнка.'}</p>
      {!supabase && <Message>Облачная авторизация пока не подключена. Форма готова, но настоящая регистрация станет доступна после настройки сервера.</Message>}
      {message && <Message>{message}</Message>}
    </section>
    {!supabase && <div className="demo-entry"><button className="reject" onClick={onDemo}>Открыть пробную версию без аккаунта</button><small>В пробной версии нет защиты ролей. Только для ознакомления.</small></div>}
  </main>

  if (!membership) return <main className="shell auth-shell">
    <header><h1>МОЙ МИР</h1><button className="reject" onClick={()=>{void supabase?.auth.signOut()}}>Выйти</button></header>
    <section className="auth-card">
      <h2>Подключение к семье</h2>
      <p className="muted">Родитель создаёт семейное пространство, затем приглашает ребёнка с помощью одноразового кода.</p>
      <div className="onboard">
        <button disabled={busy} className="action primary" onClick={()=>void action(async()=>{
          const {error}=await supabase!.rpc('create_parent_family')
          if(error) throw error
        })}>Я родитель — создать семью</button>
        <label>Одноразовый код от родителя<input value={invite} onChange={e=>setInvite(e.target.value.trim())} placeholder="Вставь код приглашения"/></label>
        <button disabled={busy||!invite} className="reject" onClick={()=>void action(async()=>{
          const {error}=await supabase!.rpc('join_family_as_child',{p_invite:invite})
          if(error) throw error
          setInvite('')
        })}>Я ребёнок — присоединиться</button>
        <button disabled={busy||!invite} className="action" onClick={()=>void action(async()=>{
          const {error}=await supabase!.rpc('join_family_as_parent',{p_invite:invite})
          if(error) throw error
          setInvite('')
        })}>Я второй родитель — присоединиться</button>
      </div>
      {message && <Message>{message}</Message>}
    </section>
  </main>

  const isParent = membership.role === 'parent'
  if(chatOpen)return <main className="shell"><header><h1>МОЙ МИР</h1><button className="action" onClick={()=>setChatOpen(false)}>← Вернуться в приложение</button></header><FamilyChat familyId={membership.family_id} userId={session.user.id}/></main>
  const activeChildId=isParent?(targetChild||children[0]?.user_id):session.user.id
  const nameOfChild=(id:string)=>children.find(c=>c.user_id===id)?.display_name||'Ребёнок'
  const dailyEarnedForChild=(childId:string)=>dailyCompletions
    .filter(c=>c.child_id===childId&&c.status==='approved')
    .reduce((sum,c)=>sum+c.points_awarded,0)
  const lifetimeWorldPoints=balances.filter(b=>b.child_id===activeChildId&&b.delta>0).reduce((sum,b)=>sum+b.delta,0)+dailyEarnedForChild(activeChildId)
  const activeWorld=worldStages.find(w=>w.child_id===activeChildId)?.active_world??1
  const displayedWorld=viewFinishedWorld&&activeWorld===2?1:activeWorld
  const currentSpiritualRows=spiritualRows.filter(r=>r.child_id===activeChildId)
  const approvedExtraSpiritual=spiritualRequests
    .filter(r=>r.child_id===activeChildId&&r.status==='approved')
    .reduce((sum,r)=>sum+(r.approved_points??0),0)
  const spiritualPoints=currentSpiritualRows.reduce((sum,r)=>sum+r.points,0)+approvedExtraSpiritual
  const spiritualLevel=spiritualStage(spiritualPoints)
  const displayedPoints=displayedWorld===1?(activeWorld===2?1600:lifetimeWorldPoints):Math.max(0,lifetimeWorldPoints-1600)
  const earnedForChild=(childId:string)=>balances.filter(b=>b.child_id===childId)
    .reduce((sum,b)=>sum+b.delta,0)+dailyEarnedForChild(childId)
  const spentForChild=(childId:string)=>rewardRequests.filter(r=>r.child_id===childId&&r.status==='approved')
    .reduce((sum,r)=>sum+r.cost_snapshot,0)
  const deductedForChild=(childId:string)=>behaviorRows.filter(r=>r.child_id===childId&&!r.cancelled_at)
    .reduce((sum,r)=>sum+r.amount,0)
  const activeChildBalance=earnedForChild(activeChildId)-spentForChild(activeChildId)-deductedForChild(activeChildId)
  const earned = isParent?0:earnedForChild(session.user.id)
  const spent = isParent?0:spentForChild(session.user.id)
  const pendingReserved=rewardRequests.filter(r=>!isParent&&r.child_id===session.user.id&&r.status==='pending').reduce((sum,r)=>sum+r.cost_snapshot,0)
  const deducted=isParent?0:deductedForChild(session.user.id)
  const total = isParent ? null : earned - spent - deducted
  const availableForRewards=Math.max(0,(total??0)-pendingReserved)
  const firstPendingRequest=isParent?rewardRequests.find(r=>r.status==='pending'):undefined
  const firstPendingReward=firstPendingRequest?rewards.find(r=>r.id===firstPendingRequest.reward_id):undefined
  const currentWeekday=new Date(spiritualToday+'T12:00:00').getDay()
  const displayedDaily=dailyTemplates.filter(d=>d.child_id===activeChildId && (d.active||isParent&&showArchivedDaily)
    && (d.weekdays.includes(currentWeekday)||isParent&&showArchivedDaily))
  const todaysDailyCount=displayedDaily.filter(d=>d.active&&d.weekdays.includes(currentWeekday)).length
  function startDailyEditor(d:DailyTemplate){
    setEditingDaily(d.id);setAddingDaily(false)
    setDailyTitle(d.title);setDailyPoints(String(d.points));setDailyIcon(d.icon);setDailyWeekdays(d.weekdays.slice())
  }
  function startDailyAdd(){
    setAddingDaily(true);setEditingDaily(null)
    setDailyTitle('');setDailyPoints('5');setDailyIcon('✅');setDailyWeekdays([0,1,2,3,4,5,6])
  }
  function toggleWeekday(day:number){setDailyWeekdays(old=>old.includes(day)?old.filter(n=>n!==day):[...old,day].sort())}
  const dailyEditor=(id:string|null)=><form className="daily-editor" onSubmit={e=>{e.preventDefault();void action(async()=>{
    if(dailyWeekdays.length===0)throw new Error('Выбери хотя бы один день недели')
    const {error}=id
      ?await supabase!.rpc('manage_daily_chore',{p_id:id,p_title:dailyTitle,p_points:Number(dailyPoints),p_icon:dailyIcon,p_weekdays:dailyWeekdays,p_active:true})
      :await supabase!.rpc('create_daily_chore',{p_family:membership.family_id,p_child:activeChildId,p_title:dailyTitle,p_points:Number(dailyPoints),p_icon:dailyIcon,p_weekdays:dailyWeekdays})
    if(error)throw error
    setEditingDaily(null);setAddingDaily(false)
  })}}>
    <div className="daily-editor-fields">
      <label>Название<input value={dailyTitle} onChange={e=>setDailyTitle(e.target.value)} maxLength={160} required/></label>
      <label>Баллы<input type="number" min="0" max="1000" value={dailyPoints} onChange={e=>setDailyPoints(e.target.value)} required/></label>
      <label>Значок<input value={dailyIcon} onChange={e=>setDailyIcon(e.target.value)} maxLength={8} required/></label>
    </div>
    <fieldset><legend>Повторять по дням недели</legend><div className="daily-weekdays">
    {['Вс','Пн','Вт','Ср','Чт','Пт','Сб'].map((label,i)=><label key={i}><input type="checkbox" checked={dailyWeekdays.includes(i)} onChange={()=>toggleWeekday(i)}/>{label}</label>)}
    </div></fieldset>
    <div className="daily-editor-actions"><button type="submit" disabled={busy} className="action">Сохранить расписание</button><button type="button" className="reject" onClick={()=>{setAddingDaily(false);setEditingDaily(null)}}>Отмена</button></div>
  </form>
  return <main className="shell">
    <header><div className="brand"><span className="logo">✦</span><div><h1>МОЙ МИР 2.5</h1><small>{isParent?'Защищённый кабинет родителя':'Личный кабинет ребёнка'}</small></div></div><div className="balance">{isParent?'👨‍👩‍👦 Кабинет родителя':<>🪙 {total} <span>баллов</span></>}</div></header>
    <NotificationInbox userId={session.user.id} familyId={membership.family_id}/>

    <button type="button" className="action" onClick={()=>setChatOpen(true)}>💬 Открыть семейный чат</button>
    <div className="account-bar"><span>Вы вошли как <strong>{isParent?'родитель':'ребёнок'}</strong></span><button className="reject" onClick={()=>{void supabase?.auth.signOut()}}>Выйти</button></div>
    <nav className="family-shortcuts" aria-label="Разделы приложения">
      <a href="#world-progress">🌍 Мои миры</a>
      <a href="#daily-chores">✅ Ежедневные дела</a>
      <a href="#task-suggestions">💡 Предложить задание</a>
      <a href="#family-rewards">🎁 Все призы</a>
      {isParent&&<a href="#parent-settings">➕ Новое задание</a>}
      {isParent&&<a href="#family-discipline">⚖️ Дисциплинарные меры</a>}
    </nav>
    <section className="hero hero-live"><div className="hero-live-emoji">🏡 🌳 ✨</div><div className="hero-text"><span className="eyebrow">МОЙ МИР 2.5 · СЕМЕЙНОЕ ПРОДВИЖЕНИЕ</span><h2>{isParent?'Результаты и достижения':'Добро пожаловать в свой мир!'}</h2><p>{isParent?'Здесь отображаются реальные результаты ребёнка из прежнего приложения.':'Все прежние баллы, задания и награды сохранены в семейном аккаунте.'}</p><div className="hero-live-stats"><span>🌍 Мир {activeWorld} из 2</span><span>⭐ Накоплено {lifetimeWorldPoints} очков</span><span>🎁 {rewards.filter(r=>r.active).length} наград</span></div></div></section>
    {isParent && <section id="parent-settings" className="auth-card settings-card">
      <h2>Управление семьёй</h2>
      <button disabled={busy} className="action" onClick={()=>void action(async()=>{
        const {data,error}=await supabase!.rpc('create_child_invite',{p_family:membership.family_id})
        if(error) throw error
        setGeneratedInvite(String(data))
      })}>Создать приглашение для ребёнка</button>
      {generatedInvite && <div className="invite-value"><strong>Код ребёнка действителен 24 часа, использовать можно один раз:</strong><code>{generatedInvite}</code><button className="reject" onClick={()=>void navigator.clipboard.writeText(generatedInvite)}>Копировать</button></div>}
      <button disabled={busy} className="action" onClick={()=>void action(async()=>{
        const {data,error}=await supabase!.rpc('create_parent_invite',{p_family:membership.family_id})
        if(error)throw error
        setGeneratedParentInvite(String(data))
      })}>Пригласить второго родителя</button>
      {generatedParentInvite&&<div className="invite-value"><strong>Код второго родителя · действует 24 часа и только один раз:</strong><code>{generatedParentInvite}</code><button className="reject" onClick={()=>void navigator.clipboard.writeText(generatedParentInvite)}>Копировать</button></div>}
      <h3>Новое задание</h3>
      {children.length === 0 ? <p className="muted">Сначала пригласите ребёнка в семью.</p> :
      <form className="auth-form" onSubmit={e=>{e.preventDefault();void action(async()=>{
        const {error}=await supabase!.rpc('create_family_task',{p_family:membership.family_id,p_child:targetChild||children[0].user_id,p_title:taskTitle,p_points:Number(taskPoints)})
        if(error) throw error
        setTaskTitle('')
      })}}>
        <label>Для кого<select value={targetChild || children[0].user_id} onChange={e=>setTargetChild(e.target.value)}>{children.map(c=><option key={c.user_id} value={c.user_id}>{c.display_name||'Ребёнок (имя не задано)'}</option>)}</select></label>
        <label>Название<input maxLength={160} required value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="Убрать комнату"/></label>
        <label>Баллы<input required type="number" min="0" max="1000" value={taskPoints} onChange={e=>setTaskPoints(e.target.value)}/></label>
        <button disabled={busy} className="action primary" type="submit">Добавить задание</button>
      </form>}
    </section>}
    <section id="task-suggestions" className="tasks proposal-online">
      <div className="section-title">
        <div><span className="eyebrow">МОЯ ИНИЦИАТИВА</span><h2>💡 Предложить задание</h2></div>
        <span>{childProposals.filter(p=>p.status==='pending'&&(isParent||p.child_id===session.user.id)).length} на рассмотрении</span>
      </div>
      {!isParent&&<><p className="muted">Есть идея, как помочь дома или выполнить дополнительное дело? Предложи родителям задание и свои баллы. Родитель решит, сколько оно будет стоить. Баллы начислятся только после выполнения и подтверждения.</p>
       <form className="proposal-form" onSubmit={e=>{e.preventDefault();void action(async()=>{
        const {error}=await supabase!.rpc('propose_child_task',{
         p_family:membership.family_id,p_title:suggestionTitle.trim(),p_points:Number(suggestionPoints)
        });if(error)throw error
        setSuggestionTitle('');setSuggestionPoints('20')
       })}}>
        <label>Что я предлагаю сделать?<input required maxLength={160} value={suggestionTitle}
          onChange={e=>setSuggestionTitle(e.target.value)} placeholder="Например, помыть машину"/></label>
        <label>Предложенные баллы<input required type="number" min="0" max="1000" value={suggestionPoints}
          onChange={e=>setSuggestionPoints(e.target.value)}/></label>
        <button className="action" type="submit" disabled={busy}>💡 Отправить родителю</button>
       </form>
      </>}
      {isParent&&<p className="muted">Ребёнок предлагает дело и количество баллов. Ты можешь согласиться, указать собственную стоимость или отклонить. После одобрения дело появляется в списке заданий ребёнка.</p>}
      {childProposals.filter(p=>isParent||p.child_id===session.user.id).slice(0,25).map(p=><article className="proposal-card" key={p.id}>
        <div className="proposal-details"><strong>{p.title}</strong>
          <small>{p.status==='pending'?'Ожидает ответа родителя':p.status==='approved'?'✓ Одобрено, задание создано':p.status==='rejected'?'Отклонено':'Отменено'}
          {isParent?' · '+nameOfChild(p.child_id):''}</small>
          <span>Предложение: <b>{p.proposed_points} 🪙</b>{p.status==='approved'?' · Одобрено: '+p.approved_points+' 🪙':''}</span>
        </div>
        {isParent&&p.status==='pending'&&<div className="proposal-actions">
          {reviewedProposal===p.id?<form className="proposal-review" onSubmit={e=>{e.preventDefault();void action(async()=>{
            const {error}=await supabase!.rpc('review_child_task_proposal',{
              p_proposal:p.id,p_approve:true,p_points:Number(proposalPoints)
            });if(error)throw error
            setReviewedProposal(null)
          })}}>
            <label>Баллы после согласования<input type="number" min="0" max="1000" required
              value={proposalPoints} onChange={e=>setProposalPoints(e.target.value)}/></label>
            <button className="action" type="submit" disabled={busy}>✓ Одобрить с этой стоимостью</button>
            <button className="reject" type="button" onClick={()=>setReviewedProposal(null)}>Отмена</button>
          </form>:<button className="action" type="button" disabled={busy}
            onClick={()=>{setReviewedProposal(p.id);setProposalPoints(String(p.proposed_points))}}>✓ Одобрить / изменить баллы</button>}
          <button className="reject" type="button" disabled={busy} onClick={()=>void action(async()=>{
            const {error}=await supabase!.rpc('review_child_task_proposal',{
              p_proposal:p.id,p_approve:false,p_points:null
            });if(error)throw error
            if(reviewedProposal===p.id)setReviewedProposal(null)
          })}>✕ Отклонить</button>
        </div>}
        {!isParent&&p.status==='pending'&&<button className="reject" disabled={busy}
          onClick={()=>void action(async()=>{
            const {error}=await supabase!.rpc('cancel_child_task_proposal',{p_proposal:p.id})
            if(error)throw error
          })}>Отменить предложение</button>}
      </article>)}
    </section>
    <section id="daily-chores" className="tasks daily-online">
      <div className="section-title">
        <div><span className="eyebrow">TAREAS DIARIAS</span><h2>🗓️ Ежедневные дела</h2></div>
        <span>{todaysDailyCount} дел на сегодня · {spiritualToday.split('-').reverse().join('.')}</span>
      </div>
{dailyFeedback&&<p className="notice" role="status">{dailyFeedback}</p>}
      <p className="muted">Задания появляются автоматически каждый день по расписанию. Ребёнок отмечает выполнение, родитель подтверждает баллы. Вчерашние отметки остаются в истории.</p>
      {isParent&&children.length===0&&<p className="muted">Подключи ребёнка: стандартные ежедневные дела добавятся автоматически.</p>}
      {isParent&&children.length>0&&<div className="daily-parent-toolbar">
        <strong>Ребёнок: {nameOfChild(activeChildId)}</strong>
        {childNameEdit===activeChildId?<form className="proposal-review" onSubmit={e=>{e.preventDefault();void action(async()=>{
          const {error}=await supabase!.rpc('rename_family_child',{p_family:membership.family_id,p_child:activeChildId,p_name:childNameValue.trim()})
          if(error)throw error
          setChildNameEdit(null)
        })}}>
          <label>Имя<input required maxLength={50} value={childNameValue} onChange={e=>setChildNameValue(e.target.value)} placeholder="Например, Илья"/></label>
          <button className="action" type="submit" disabled={busy}>Сохранить имя</button>
          <button className="reject" type="button" onClick={()=>setChildNameEdit(null)}>Отмена</button>
        </form>:<button className="action" type="button" onClick={()=>{setChildNameEdit(activeChildId);setChildNameValue(children.find(c=>c.user_id===activeChildId)?.display_name??'')}}>✎ Переименовать ребёнка</button>}
      </div>}

      {isParent&&children.length>0&&<div className="daily-parent-toolbar">
        <button className="action" onClick={startDailyAdd}>+ Добавить повседневное дело</button>
        <button className="reject" onClick={()=>setShowArchivedDaily(v=>!v)}>{showArchivedDaily?'Скрыть отключённые и другие дни':'Показать все расписания'}</button>
      </div>}
      {isParent&&addingDaily&&dailyEditor(null)}
      {activeChildId&&displayedDaily.length===0&&<p className="muted">На сегодня запланированных дел нет.</p>}
      {displayedDaily.map(d=>{
        const done=dailyCompletions.find(c=>c.template_id===d.id&&c.activity_date===spiritualToday&&c.child_id===activeChildId)
        const scheduled=d.weekdays.includes(currentWeekday)
        const actionable=d.active&&scheduled
        return <div className="daily-chore" key={d.id}>
          <div className="daily-chore-main">
            <span className="daily-chore-icon">{d.icon}</span>
            <div className="daily-chore-title"><strong>{d.title}</strong>
              <small>{!d.active?'Отключено':!scheduled?'Сегодня не запланировано':done?.status==='approved'?'✓ Подтверждено родителем':done?.status==='pending'?'Ожидает подтверждения':done?.status==='rejected'?'Отклонено — можно отметить снова':'Ещё не выполнено'}</small>
            </div>
            <span className="points">+{d.points} 🪙</span>
            {!isParent&&actionable&&done?.status!=='pending'&&done?.status!=='approved'&&<button className="action" disabled={busy} onClick={()=>void action(async()=>{
              const {error}=await supabase!.rpc('submit_daily_chore',{p_template:d.id,p_date:spiritualToday})
              if(error){setDailyFeedback('Не удалось отметить «'+d.title+'»: '+error.message);throw error}
              setDailyFeedback('✓ «'+d.title+'» отправлено родителю на подтверждение')
            })}>Готово</button>}
            {isParent&&<div className="daily-chore-actions">
              {done?.status==='pending'&&<><button className="action" disabled={busy} onClick={()=>void action(async()=>{
                const {error}=await supabase!.rpc('review_daily_chore',{p_completion:done.id,p_approve:true});if(error)throw error
              })}>✓ Принять</button><button className="reject" disabled={busy} onClick={()=>void action(async()=>{
                const {error}=await supabase!.rpc('review_daily_chore',{p_completion:done.id,p_approve:false});if(error)throw error
              })}>✕</button></>}
              <button className="reject" onClick={()=>startDailyEditor(d)} disabled={busy}>✎</button>
              {d.active?<button className="reject" disabled={busy} onClick={()=>void action(async()=>{
                if(!window.confirm('Отключить «'+d.title+'»? Старые начисления сохранятся.'))return
                const {error}=await supabase!.rpc('manage_daily_chore',{p_id:d.id,p_title:d.title,p_points:d.points,p_icon:d.icon,p_weekdays:d.weekdays,p_active:false})
                if(error)throw error
              })}>Отключить</button>:<button className="action" disabled={busy} onClick={()=>void action(async()=>{
                const {error}=await supabase!.rpc('manage_daily_chore',{p_id:d.id,p_title:d.title,p_points:d.points,p_icon:d.icon,p_weekdays:d.weekdays,p_active:true})
                if(error)throw error
              })}>Включить</button>}
            </div>}
          </div>
          {isParent&&editingDaily===d.id&&dailyEditor(d.id)}
        </div>
      })}
    </section>
    <section id="world-progress" className="world3d-intro"><div><span className="eyebrow">СЕМЕЙНЫЙ ОНЛАЙН-Мир</span><h2>{displayedWorld===1?'Домик на поляне':'Домик на дереве'}</h2>
      <p>{isParent?'Просмотр прогресса ребёнка по подтверждённым заданиям.':'За задания, подтверждённые родителями, открываются новые предметы и персонажи.'}</p></div></section>
    {isParent&&children.length>1&&<label className="world-child-selector">Мир ребёнка <select value={activeChildId} onChange={e=>{setTargetChild(e.target.value);setViewFinishedWorld(false)}}>
      {children.map(child=><option key={child.user_id} value={child.user_id}>{child.display_name||'Ребёнок (имя не задано)'}</option>)}</select></label>}
    {activeWorld===2&&<button className="reject" onClick={()=>setViewFinishedWorld(value=>!value)}>{viewFinishedWorld?'🌳 Вернуться в домик на дереве':'🏡 Посмотреть завершённую поляну'}</button>}
    {activeChildId&&<div className="child-balance-panel" role="status" aria-label="Баланс баллов ребёнка">
      <div><small>🪙 Общий баланс сейчас</small><strong>{activeChildBalance} баллов</strong></div>
      <div><small>Заработано</small><strong>+{earnedForChild(activeChildId)}</strong></div>
      <div><small>Потрачено на награды</small><strong>−{spentForChild(activeChildId)}</strong></div>
      <div><small>Списано за нарушения</small><strong className={deductedForChild(activeChildId)>0?'balance-deduction':''}>−{deductedForChild(activeChildId)}</strong></div>
    </div>}
    <p className="muted world-balance-explanation">Прогресс строительства ниже показывает накопленные достижения. Штрафы меняют общий баланс, но не убирают уже открытые предметы.</p>
    <Suspense fallback={<p className="muted">Загружаем мир…</p>}><World3D key={displayedWorld+'-'+activeChildId} worldNumber={displayedWorld} points={displayedPoints}/></Suspense>
    {!isParent&&activeWorld===1&&lifetimeWorldPoints>=1600&&<div className="world-next-panel"><strong>🎉 Первый мир завершён!</strong><p>Открывай домик на дереве. Первый мир останется доступным для просмотра.</p>
      <button className="action" disabled={busy} onClick={()=>void action(async()=>{const {error}=await supabase!.rpc('advance_my_world',{p_family:membership.family_id});if(error)throw error;setViewFinishedWorld(false)})}>🌳 Перейти ко второму миру</button></div>}
    <section id="family-tasks" className="tasks"><div className="section-title"><h2>{isParent?'Задания семьи':'Мои задания'}</h2><button className="reject" onClick={()=>void action(async()=>{await refresh(session.user.id)})} disabled={busy}>Обновить</button></div>
      {tasks.length===0 && <p className="muted">Заданий пока нет.</p>}
      {tasks.map(t=>{
        const attempts=submissions.filter(s=>s.task_id===t.id && s.child_id===t.assigned_child && s.activity_date===spiritualToday)
        const approved=attempts.some(s=>s.status==='approved')
        const pending=attempts.find(s=>s.status==='pending')
        return <article className="task" key={t.id}><div className="task-icon">✓</div><div className="task-name"><strong>{t.title}</strong><small>{approved?'✓ Сегодня подтверждено':pending?'Сегодня ждёт подтверждения':'Доступно сегодня'}</small></div><span className="points">+{t.points} 🪙</span>
          {isParent && pending && <div className="actions"><button disabled={busy} className="action" onClick={()=>void action(async()=>{await reviewTask(pending.id,true)})}>✓</button><button disabled={busy} className="reject" onClick={()=>void action(async()=>{await reviewTask(pending.id,false)})}>✕</button></div>}
          {!isParent && !pending && !approved && <button disabled={busy} className="action" onClick={()=>void action(async()=>{await submitTask(t.id)})}>Готово</button>}
        </article>
      })}
    </section>
    <section id="family-discipline" className="tasks behavior-section">
      <div className="section-title">
        <div><span className="eyebrow">ПОНЯТНЫЕ ПРАВИЛА</span><h2>⚖️ Правила и последствия</h2></div>
        <span>История решений</span>
      </div>
      <p className="muted">Списания уменьшают только доступные баллы магазина. Построенные миры и духовный рост не затрагиваются. Каждое решение можно отменить.</p>
      {isParent&&activeChildId&&<form className="behavior-form" onSubmit={e=>{e.preventDefault();void action(async()=>{
        const {error}=await supabase!.rpc('add_behavior_point_deduction',{
          p_family:membership.family_id,p_child:activeChildId,
          p_category:behaviorCategory,p_reason:behaviorReason.trim(),p_amount:Number(behaviorAmount)
        });if(error)throw error
        setBehaviorReason('')
      })}}>
        <label>Ситуация<select value={behaviorCategory} onChange={e=>setBehaviorCategory(e.target.value)}>
          <option value="respect">Неуважительный разговор</option>
          <option value="agreement">Нарушил договорённость</option>
          <option value="kindness">Обидные слова</option>
          <option value="honesty">Не сказал правду</option>
          <option value="other">Другая ситуация</option>
        </select></label>
        <label>Списание<select value={behaviorAmount} onChange={e=>setBehaviorAmount(e.target.value)}>
          <option value="5">−5 баллов</option><option value="10">−10 баллов</option>
        </select></label>
        <label className="behavior-reason">Причина и договорённость<textarea rows={2} minLength={8} maxLength={300} required
          placeholder="Что произошло? Как можно исправить ситуацию?" value={behaviorReason}
          onChange={e=>setBehaviorReason(e.target.value)}/></label>
        <button disabled={busy||behaviorReason.trim().length<8} className="reject" type="submit">Зафиксировать последствие</button>
      </form>}
      {!isParent&&<p>Списано из доступных баллов: <strong>−{deducted} 🪙</strong></p>}
      {behaviorRows.filter(r=>r.child_id===activeChildId).slice(0,20).map(r=><article className="behavior-entry" key={r.id}>
        <div><strong>{({respect:'Неуважительный разговор',agreement:'Нарушена договорённость',kindness:'Обидные слова',honesty:'Вопрос честности',other:'Другая ситуация'} as Record<string,string>)[r.category]??'Ситуация'}</strong>
          <small>{new Date(r.created_at).toLocaleDateString('ru-RU')} · {r.reason}</small>
          {r.cancelled_at&&<small>Решение отменено. Баллы возвращены.</small>}
        </div>
        <span className="points">{r.cancelled_at?'Отменено':'−'+r.amount+' 🪙'}</span>
        {isParent&&!r.cancelled_at&&<button type="button" className="action" disabled={busy} onClick={()=>void action(async()=>{
          if(!window.confirm('Отменить списание и вернуть баллы?'))return
          const {error}=await supabase!.rpc('cancel_behavior_point_deduction',{p_id:r.id})
          if(error)throw error
        })}>Вернуть баллы</button>}
      </article>)}
      {behaviorRows.filter(r=>r.child_id===activeChildId).length===0&&<p className="muted">Записей пока нет.</p>}
    </section>
    <section className="tasks spiritual-self-points">
      <div className="section-title">
        <div><span className="eyebrow">МОЯ ИНИЦИАТИВА</span><h2>✨ Мои духовные очки</h2></div>
        <span>{spiritualRequests.filter(r=>r.status==='pending'&&(isParent||r.child_id===session.user.id)).length} заявок</span>
      </div>
      <p className="muted">Ребёнок может предложить дополнительные духовные очки за выполненное занятие и исправить заявку до ответа родителя. Баллы поступают в духовный прогресс только после подтверждения, отдельно от магазина наград.</p>
      {!isParent&&<form className="proposal-form" onSubmit={e=>{e.preventDefault();void action(async()=>{
        const values={p_title:spiritualRequestTitle.trim(),p_points:Number(spiritualRequestPoints)}
        const {error}=spiritualEditing
          ?await supabase!.rpc('edit_spiritual_points_request',{p_request:spiritualEditing,...values})
          :await supabase!.rpc('request_spiritual_points',{p_family:membership.family_id,...values})
        if(error)throw error
        setSpiritualEditing(null);setSpiritualRequestTitle('');setSpiritualRequestPoints('10')
      })}}>
        <label>Что я сделал?<input required minLength={3} maxLength={160} value={spiritualRequestTitle}
          onChange={e=>setSpiritualRequestTitle(e.target.value)} placeholder="Например, подготовился к встрече"/></label>
        <label>Сколько очков предлагаю?<input required type="number" min="1" max="100"
          value={spiritualRequestPoints} onChange={e=>setSpiritualRequestPoints(e.target.value)}/></label>
        <button type="submit" className="action" disabled={busy}>{spiritualEditing?'Сохранить изменения':'Отправить родителю'}</button>
        {spiritualEditing&&<button type="button" className="reject" onClick={()=>{setSpiritualEditing(null);setSpiritualRequestTitle('');setSpiritualRequestPoints('10')}}>Отмена</button>}
      </form>}
      {spiritualRequests.filter(r=>isParent||r.child_id===session.user.id).slice(0,20).map(r=><article className="proposal-card" key={r.id}>
        <div className="proposal-details">
          <strong>{r.title}</strong>
          <small>{r.status==='pending'?'Ожидает подтверждения':r.status==='approved'?'✓ Подтверждено':r.status==='rejected'?'Отклонено':'Отменено'}{isParent?' · '+nameOfChild(r.child_id):''}</small>
          <span>Запрошено: {r.proposed_points} ✨{r.status==='approved'?' · Начислено: '+r.approved_points+' ✨':''}</span>
        </div>
        {!isParent&&r.status==='pending'&&<div className="proposal-actions">
          <button type="button" className="action" disabled={busy} onClick={()=>{setSpiritualEditing(r.id);setSpiritualRequestTitle(r.title);setSpiritualRequestPoints(String(r.proposed_points))}}>✎ Изменить</button>
          <button type="button" className="reject" disabled={busy} onClick={()=>void action(async()=>{
            const {error}=await supabase!.rpc('cancel_spiritual_points_request',{p_request:r.id})
            if(error)throw error
            if(spiritualEditing===r.id){setSpiritualEditing(null);setSpiritualRequestTitle('');setSpiritualRequestPoints('10')}
          })}>Отменить</button>
        </div>}
        {isParent&&r.status==='pending'&&<div className="proposal-actions">
          {spiritualReviewing===r.id?<form className="proposal-review" onSubmit={e=>{e.preventDefault();void action(async()=>{
            const {error}=await supabase!.rpc('review_spiritual_points_request',{p_request:r.id,p_approve:true,p_points:Number(spiritualApprovedPoints)})
            if(error)throw error
            setSpiritualReviewing(null)
          })}}>
            <label>Подтвердить очки<input required min="1" max="100" type="number"
              value={spiritualApprovedPoints} onChange={e=>setSpiritualApprovedPoints(e.target.value)}/></label>
            <button type="submit" className="action" disabled={busy}>✓ Начислить</button>
            <button type="button" className="reject" onClick={()=>setSpiritualReviewing(null)}>Отмена</button>
          </form>:<button type="button" className="action" disabled={busy}
            onClick={()=>{setSpiritualReviewing(r.id);setSpiritualApprovedPoints(String(r.proposed_points))}}>✓ Подтвердить / изменить</button>}
          <button type="button" className="reject" disabled={busy} onClick={()=>void action(async()=>{
            const {error}=await supabase!.rpc('review_spiritual_points_request',{p_request:r.id,p_approve:false,p_points:null})
            if(error)throw error
            if(spiritualReviewing===r.id)setSpiritualReviewing(null)
          })}>✕ Отклонить</button>
        </div>}
      </article>)}
    </section>
    <section className="tasks spiritual-online">
      <div className="section-title"><div><span className="eyebrow">ЛИЧНЫЙ РОСТ</span><h2>🌾 Духовный рост</h2></div><span>{spiritualPoints} духовных очков</span></div>
      <p className="muted">Духовные занятия растят отдельный колос. Они не начисляют баллы для магазина наград. Занятия отмечаются добровольно.</p>
      {isParent&&children.length===0&&<p className="muted">После подключения ребёнка здесь появится его духовный прогресс.</p>}
      {activeChildId&&<div className="spiritual-online-grid">
        <div className="spiritual-online-stem">
          <strong>{spiritualLevel.icon} {spiritualLevel.name}</strong>
          <Suspense fallback={<p>Загружаем росток…</p>}>
            <SpiritualStem points={spiritualPreview??spiritualPoints}/>
          </Suspense>
          <p>Всего: {spiritualPoints} очков · этап {spiritualLevel.number}/10</p>
          <progress max={spiritualMilestone} value={spiritualLevel.progress}/>
        </div>
        <div className="spiritual-online-activities">
          <h3>Ежедневные духовные занятия</h3>
          <p className="muted">📖 Ежедневный стих, чтение Библии и вечерняя молитва отмечаются каждый день. Отметки не влияют на магазин наград.</p>
          {spiritualSteps.map(step=>{
            const done=currentSpiritualRows.some(r=>r.activity_date===spiritualToday&&r.step_id===step.id)
            return <div className={step.rhythm==='daily'?'spiritual-online-activity spiritual-daily':'spiritual-online-activity'} key={step.id}>
              <span>{step.icon}</span><div><strong>{step.title}</strong><small>+{step.points} духовных очков</small></div>
              {!isParent&&<button className={done?'reject':'action'} disabled={busy} onClick={()=>void action(async()=>{
                const {error}=await supabase!.rpc(done?'unmark_spiritual_activity':'mark_spiritual_activity',{p_family:membership.family_id,p_date:spiritualToday,p_step:step.id})
                if(error)throw error
              })}>{done?'✓ Отмечено':'Отметить'}</button>}
              {isParent&&<span className={done?'spiritual-complete':'muted'}>{done?'✓ Выполнено':'Не отмечено'}</span>}
            </div>
          })}
          {isParent&&<div className="world-tour-controls"><span>Предпросмотр роста (не меняет очки)</span><input type="range" min="0" max="10000" step="100" value={spiritualPreview??spiritualPoints} onChange={e=>setSpiritualPreview(Number(e.target.value))}/><button className="reject" onClick={()=>setSpiritualPreview(null)}>Сброс просмотра</button></div>}
        </div>
      </div>}
    </section>
    <section id="family-rewards" className="tasks">
      <div className="section-title"><h2>🎁 Магазин наград</h2><span>{rewards.filter(r=>r.active).length} наград</span></div>
      {isParent&&<div className="reward-admin-toolbar"><p>Управление магазином: переименовать, изменить стоимость или убрать награду. Старые заявки сохраняются.</p><button className="reject" onClick={()=>setShowArchivedRewards(v=>!v)}>{showArchivedRewards?'Скрыть удалённые':'Показать удалённые'}</button></div>}
      {!isParent&&<p className="reward-balance-info">Доступно: <strong>{availableForRewards} 🪙</strong> · В резерве: <strong>{pendingReserved} 🪙</strong></p>}
      {isParent && <form className="reward-form" onSubmit={e=>{e.preventDefault();void action(async()=>{
        const {error}=await supabase!.rpc('create_reward',{p_family:membership.family_id,p_title:rewardTitle,p_cost:Number(rewardCost)})
        if(error) throw error
        setRewardTitle('')
      })}}>
        <label>Награда<input required maxLength={160} value={rewardTitle} onChange={e=>setRewardTitle(e.target.value)} placeholder="Выбрать семейный фильм"/></label>
        <label>Стоимость в баллах<input required type="number" min="1" max="100000" value={rewardCost} onChange={e=>setRewardCost(e.target.value)}/></label>
        <button className="action" disabled={busy}>Добавить награду</button>
      </form>}
      {rewards.filter(r=>r.active).length===0 && <p className="muted">Родитель пока не добавил награды.</p>}
      {rewards.filter(r=>r.active||(isParent&&showArchivedRewards)).map(r=>{
        const pending=rewardRequests.find(q=>q.reward_id===r.id && q.status==='pending' && (isParent || q.child_id===session.user.id))
        return <article className="task reward-managed-item" key={r.id}>
          <div className="task-icon">🎁</div><div className="task-name"><strong>{r.title}</strong>
          <small>{!r.active?'Удалена из магазина':pending?'Заявка ожидает одобрения':'Доступна для заказа'}{r.title==='Секретная награда'&&r.cost===120?' · 10 случайных призов':''}</small></div>
          <span className="points">{r.cost} 🪙</span>
          {isParent&&r.active&&<div className="reward-manage-actions">
            <button type="button" className="action" disabled={busy} onClick={()=>{setEditingReward(r.id);setEditRewardTitle(r.title);setEditRewardCost(String(r.cost))}}>✎ Изменить</button>
            <button type="button" className="reject" disabled={busy} onClick={()=>{if(window.confirm('Убрать «'+r.title+'» из магазина? Уже отправленные заявки останутся в истории.'))void action(async()=>{const {error}=await supabase!.rpc('archive_family_reward',{p_reward:r.id});if(error)throw error;setEditingReward(null)})}}>Удалить</button>
          </div>}
          {isParent&&editingReward===r.id&&<form className="reward-inline-edit" onSubmit={e=>{e.preventDefault();void action(async()=>{const {error}=await supabase!.rpc('edit_family_reward',{p_reward:r.id,p_title:editRewardTitle.trim(),p_cost:Number(editRewardCost),p_active:true});if(error)throw error;setEditingReward(null)})}}>
            <label>Новое название<input value={editRewardTitle} onChange={e=>setEditRewardTitle(e.target.value)} required maxLength={160}/></label>
            <label>Стоимость в баллах<input type="number" min="1" max="100000" value={editRewardCost} onChange={e=>setEditRewardCost(e.target.value)} required/></label>
            <button className="action" disabled={busy} type="submit">Сохранить</button>
            <button className="reject" type="button" onClick={()=>setEditingReward(null)}>Отмена</button>
          </form>}
          {isParent&&!r.active&&<button className="action" disabled={busy} onClick={()=>void action(async()=>{const {error}=await supabase!.rpc('edit_family_reward',{p_reward:r.id,p_title:r.title,p_cost:r.cost,p_active:true});if(error)throw error})}>Восстановить</button>}
          {!isParent && <button className="action" disabled={busy || availableForRewards<r.cost || !!pending} onClick={()=>void action(async()=>{
            const {data:requestId,error}=await supabase!.rpc('request_reward',{p_reward:r.id})
            if(error) throw error
            setRevealedMysteryPrize(null)
            if(r.title==='Секретная награда'&&r.cost===120){
              const {data:draw,error:drawError}=await supabase!.from('reward_requests')
                .select('mystery_prize').eq('id',requestId).single()
              if(drawError)throw drawError
              if(!draw?.mystery_prize)throw new Error('Приз пока не получен. Проверь историю запросов.')
              setRevealedMysteryPrize(draw.mystery_prize)
            }
            setRewardCelebration(r)
          })}>Заказать</button>}
        </article>
      })}
      {!isParent&&rewardRequests.filter(q=>q.child_id===session.user.id&&q.mystery_prize).slice(0,5).map(q=><p key={q.id} className="muted">🎁 Секретный сундук: <strong>{q.mystery_prize}</strong> · {q.status==='pending'?'Ожидает решения родителя':q.status==='approved'?'✓ Одобрено':'Отклонено'}</p>)}
      {isParent && rewardRequests.filter(q=>q.status==='pending').map(q=><article className="task" key={q.id}>
        <div className="task-icon">🧾</div><div className="task-name"><strong>{rewards.find(r=>r.id===q.reward_id)?.title ?? 'Награда'}</strong><small>Ожидает решения · {nameOfChild(q.child_id)}{q.mystery_prize?' · Выпало: '+q.mystery_prize:''}</small></div>
        <span className="points">{q.cost_snapshot} 🪙</span><div className="actions">
          <button className="action" disabled={busy} onClick={()=>void action(async()=>{const {error}=await supabase!.rpc('review_reward',{p_request:q.id,p_approve:true});if(error)throw error})}>✓</button>
          <button className="reject" disabled={busy} onClick={()=>void action(async()=>{const {error}=await supabase!.rpc('review_reward',{p_request:q.id,p_approve:false});if(error)throw error})}>✕</button>
        </div>
      </article>)}
    </section>
    {!isParent&&rewardCelebration&&<div className="reward-animated-backdrop" role="dialog" aria-modal="true" aria-label="Запрос награды отправлен">
      <div className="reward-animated-card">
        <RewardAnimation id={0} title={rewardCelebration.title}/>
        <h2>{revealedMysteryPrize?'🎁 Сундук открыт!':'Запрос отправлен! ✨'}</h2><p><strong>{rewardCelebration.title}</strong></p>
        {revealedMysteryPrize&&<p className="mystery-prize"><strong>Твой приз: {revealedMysteryPrize}</strong></p>}
        <p>Ожидаем подтверждения родителя. {rewardCelebration.cost} баллов зарезервированы. После одобрения они будут списаны.</p>
        <button className="action" onClick={()=>setRewardCelebration(null)}>Понятно!</button>
      </div>
    </div>}
    {isParent&&firstPendingRequest&&<div className="parent-reward-backdrop" role="dialog" aria-modal="true" aria-label="Подтверждение награды ребёнка">
      <div className="parent-reward-card">
        <div className="parent-reward-alert">🔔 Запрос ребёнка</div>
        <RewardAnimation id={0} title={firstPendingReward?.title??'Награда'}/>
        <h2>Ребёнок запросил награду</h2>
        <h3>{firstPendingReward?.title??'Награда'}</h3>
        {firstPendingRequest.mystery_prize&&<p className="mystery-prize">Выпавший приз: <strong>{firstPendingRequest.mystery_prize}</strong></p>}
        <p>Стоимость: <strong>{firstPendingRequest.cost_snapshot} 🪙</strong></p>
        <p>Подтвердите или отклоните выдачу. Окно не исчезнет, пока вы не примете решение.</p>
        <div className="parent-reward-actions">
          <button className="action" disabled={busy} onClick={()=>void action(async()=>{const {error}=await supabase!.rpc('review_reward',{p_request:firstPendingRequest.id,p_approve:true});if(error)throw error})}>✓ Подтвердить</button>
          <button className="reject" disabled={busy} onClick={()=>void action(async()=>{const {error}=await supabase!.rpc('review_reward',{p_request:firstPendingRequest.id,p_approve:false});if(error)throw error})}>✕ Отклонить</button>
        </div>
      </div>
    </div>}
    {message && <Message>{message}</Message>}
    <footer>МОЙ МИР · Подтверждение задач и баллы хранятся на сервере</footer>
  </main>
}
