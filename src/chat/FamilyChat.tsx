import {useCallback,useEffect,useRef,useState} from 'react'
import {supabase} from '../lib/supabase'
import './FamilyChat.css'
import {playChatTone,primeChatAudio} from './chatSounds'

type ChatMessage={id:string;family_id:string;sender_id:string;body:string;created_at:string}
type Member={user_id:string;role:'parent'|'child'}
export function FamilyChat({familyId,userId}:{familyId:string;userId:string}){
 const [messages,setMessages]=useState<ChatMessage[]>([])
 const [members,setMembers]=useState<Member[]>([])
 const [names,setNames]=useState<Record<string,string>>({})
 const [draft,setDraft]=useState('')
 const [error,setError]=useState('')
 const [sending,setSending]=useState(false)
 const [connected,setConnected]=useState(false)
 const bottom=useRef<HTMLDivElement>(null)
 const load=useCallback(async()=>{
  if(!supabase)return
  const {data,error}=await supabase.from('family_chat_messages')
   .select('id,family_id,sender_id,body,created_at').eq('family_id',familyId)
   .order('created_at',{ascending:false}).limit(100)
  if(error){setError('Не удалось получить сообщения: '+error.message);return}
  setMessages(((data??[]) as ChatMessage[]).reverse());setError('')
 },[familyId])
 useEffect(()=>{
  if(!supabase)return
  const client=supabase
  let active=true
  void Promise.resolve().then(()=>load())
  void client.from('family_members').select('user_id,role').eq('family_id',familyId)
   .then(({data})=>{if(active)setMembers((data??[]) as Member[])})
  void client.from('family_child_profiles').select('child_id,display_name').eq('family_id',familyId)
   .then(({data})=>{if(active)setNames(Object.fromEntries((data??[]).map(x=>[x.child_id,x.display_name])))})
  const channel=client.channel('family-chat-'+familyId)
   .on('postgres_changes',{event:'INSERT',schema:'public',table:'family_chat_messages',filter:'family_id=eq.'+familyId},(payload)=>{
    const incoming=payload.new as ChatMessage
    if(incoming.sender_id!==userId&&document.visibilityState==='visible')playChatTone('received')
    void load()
   })
   .subscribe(status=>{if(active)setConnected(status==='SUBSCRIBED')})
  const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void load()},10000)
  const onFocus=()=>void load()
  window.addEventListener('focus',onFocus)
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('focus',onFocus);void client.removeChannel(channel)}
 },[familyId,load,userId])
 useEffect(()=>{bottom.current?.scrollIntoView({behavior:'smooth',block:'end'})},[messages.length])
 const sender=(id:string)=>id===userId?'Вы':names[id]||(members.find(x=>x.user_id===id)?.role==='parent'?'Родитель':'Ребёнок')
 async function send(e:React.FormEvent){
  e.preventDefault()
  if(!supabase||sending||!draft.trim())return
  primeChatAudio()
  setSending(true);setError('')
  const body=draft.trim()
  const {error}=await supabase.from('family_chat_messages').insert({family_id:familyId,sender_id:userId,body})
  if(error)setError('Не удалось отправить: '+error.message)
  else{playChatTone('sent');setDraft('');await load()}
  setSending(false)
 }
 return <section className="family-chat" aria-label="Семейный чат">
  <header className="family-chat-header"><div><h2>💬 Семейный чат</h2><p>Сообщения видят только участники вашей семьи</p></div><span aria-label={connected?'Онлайн':'Синхронизация'}>{connected?'● Онлайн':'↻ Связь'}</span></header>
  <div className="family-chat-feed" role="log" aria-live="polite">
   {messages.length===0&&<p className="family-chat-empty">Начните разговор: напишите первое сообщение.</p>}
   {messages.map(m=><div key={m.id} className={'family-chat-message '+(m.sender_id===userId?'own':'')}>
    <small>{sender(m.sender_id)} · {new Date(m.created_at).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</small>
    <p>{m.body}</p>
   </div>)}
   <div ref={bottom}/>
  </div>
  {error&&<p className="family-chat-error" role="alert">{error}</p>}
  <form className="family-chat-form" onSubmit={e=>void send(e)}>
   <input aria-label="Сообщение семье" placeholder="Написать сообщение…" value={draft} maxLength={1000} onChange={e=>setDraft(e.target.value)}/>
   <button type="submit" disabled={sending||!draft.trim()} aria-label="Отправить сообщение">Отправить</button>
  </form>
 </section>
}
