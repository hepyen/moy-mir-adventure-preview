import {useState} from 'react'
import {supabase} from './lib/supabase'

export default function PasswordRecovery({onBack}:{onBack:()=>void}){
 const [email,setEmail]=useState('')
 const [link,setLink]=useState('')
 const [password,setPassword]=useState('')
 const [repeat,setRepeat]=useState('')
 const [busy,setBusy]=useState(false)
 const [notice,setNotice]=useState('')
 const [success,setSuccess]=useState(false)
 async function send(){
  if(!supabase||!email.trim())return
  setBusy(true);setNotice('')
  try{
   const {error}=await supabase.auth.resetPasswordForEmail(email.trim())
   if(error)throw error
   setNotice('Письмо отправлено. Скопируй адрес новой ссылки из письма (не открывай её), затем вставь ниже.')
  }catch(e){setNotice(e instanceof Error?e.message:'Ошибка отправки письма')}
  finally{setBusy(false)}
 }
 async function change(){
  if(!supabase)return
  if(password.length<8){setNotice('Пароль должен содержать минимум 8 символов.');return}
  if(password!==repeat){setNotice('Пароли не совпадают.');return}
  let url:URL
  try{url=new URL(link.trim())}catch{setNotice('Скопируй полную ссылку из письма.');return}
  const origin=new URL(import.meta.env.VITE_SUPABASE_URL).origin
  if(url.origin!==origin||url.pathname!=='/auth/v1/verify'||url.searchParams.get('type')!=='recovery'){
   setNotice('Это не исходная ссылка восстановления. Нужна ссылка из письма Supabase.');return
  }
  const token=url.searchParams.get('token_hash')||url.searchParams.get('token')
  if(!token){setNotice('В ссылке нет кода восстановления. Отправь новое письмо.');return}
  setBusy(true);setNotice('')
  try{
   const {error:verifyError}=await supabase.auth.verifyOtp({token_hash:token,type:'recovery'})
   if(verifyError)throw verifyError
   const {error:passwordError}=await supabase.auth.updateUser({password})
   if(passwordError)throw passwordError
   setSuccess(true);setPassword('');setRepeat('');setLink('')
   setNotice('Пароль изменён. Теперь можно войти с новым паролем. Все баллы сохранены.')
  }catch(e){setNotice((e instanceof Error?e.message:'Ошибка')+'. Если ссылка уже открывалась, отправь новое письмо.')}
  finally{setBusy(false)}
 }
 return <main className="shell auth-shell"><div className="brand"><span className="logo">✦</span><div><h1>МОЙ МИР</h1><small>Восстановление доступа</small></div></div>
  <section className="auth-card"><h2>🔑 Забыли пароль?</h2>
   <p className="muted">Баллы, задания и достижения сохранятся. Используй почту существующего аккаунта.</p>
   {!success&&<><div className="auth-form">
    <label>Электронная почта<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Почта аккаунта"/></label>
    <button type="button" className="action" disabled={busy||!email.trim()} onClick={()=>void send()}>Отправить письмо</button>
   </div><p className="muted">В письме скопируй адрес ссылки восстановления, не переходя по ней. Вставь скопированную ссылку здесь:</p>
   <div className="auth-form">
    <label>Ссылка из письма<input type="url" value={link} onChange={e=>setLink(e.target.value)} placeholder="https://...supabase.co/auth/v1/verify?..."/></label>
    <label>Новый пароль<input type="password" minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
    <label>Повторить пароль<input type="password" minLength={8} autoComplete="new-password" value={repeat} onChange={e=>setRepeat(e.target.value)}/></label>
    <button type="button" className="action primary" disabled={busy||!link||!password||!repeat} onClick={()=>void change()}>Сменить пароль</button>
   </div></>}
   {notice&&<p role="status" className="notice">{notice}</p>}
   <button type="button" className="text-button" onClick={()=>void (async()=>{if(success)await supabase?.auth.signOut();onBack()})()}>{success?'Вернуться ко входу':'Отмена, вернуться ко входу'}</button>
  </section>
 </main>
}
