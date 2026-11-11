import {useState} from 'react';
import type {FormEvent} from 'react';
import {supabase} from '../lib/supabase';
import './ParentChildAccess.css';

export function ParentChildAccess({childId,childName}:{childId:string;childName:string}){
 const [parentPassword,setParentPassword]=useState('');
 const [childPassword,setChildPassword]=useState('');
 const [repeat,setRepeat]=useState('');
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [done,setDone]=useState(false);
 const ready=childPassword.length>=10&&childPassword.length<=128&&/\p{L}/u.test(childPassword)&&/\d/.test(childPassword);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy)return;
  setError('');setDone(false);
  if(!supabase||!childId){setError('Нужен интернет и вход в семейный аккаунт');return}
  if(!ready){setError('Минимум 10 символов: буквы и цифры');return}
  if(childPassword!==repeat){setError('Новые пароли не совпадают');return}
  setBusy(true);
  try{
   const {data,error:invokeError}=await supabase.functions.invoke('moymir-parent-child-access',{body:{childId,parentPassword,newPassword:childPassword}});
   if(invokeError){
    let message='Не удалось изменить пароль';
    try{const details=await (invokeError as {context?:Response}).context?.json() as {error?:string}|undefined;message=details?.error||message}catch{}
    throw new Error(message);
   }
   if(!data?.success)throw new Error(data?.error||'Изменение не подтверждено');
   setDone(true);setParentPassword('');setChildPassword('');setRepeat('');
  }catch(e){setError(e instanceof Error?e.message:'Ошибка восстановления')}
  finally{setBusy(false)}
 }
 return <details className="mw-settings-tile mw-parent-recovery">
  <summary>🔐 Восстановить доступ ребёнку</summary>
  <p>Если {childName} забыл пароль, задайте новый. Баллы, история заданий и миры сохранятся.</p>
  <form onSubmit={e=>void submit(e)}>
   <label>Ваш пароль родителя<input type="password" autoComplete="current-password" required value={parentPassword} onChange={e=>setParentPassword(e.target.value)}/></label>
   <label>Новый пароль ребёнка<input type="password" autoComplete="new-password" required minLength={10} maxLength={128} value={childPassword} onChange={e=>setChildPassword(e.target.value)} placeholder="10 символов, буквы и цифры"/></label>
   <label>Повтор нового пароля<input type="password" autoComplete="new-password" required value={repeat} onChange={e=>setRepeat(e.target.value)}/></label>
   <small>Электронная почта ребёнка не меняется. После сброса он сможет войти на своём телефоне.</small>
   {error&&<p role="alert" className="mw-cloud-error">{error}</p>}
   {done&&<p role="status" className="mw-recovery-success">✓ Пароль ребёнка изменён. Теперь можно войти на телефоне.</p>}
   <button type="submit" disabled={busy||!parentPassword||!ready||!repeat}>{busy?'Проверка…':'Сменить пароль ребёнка'}</button>
  </form>
 </details>
}

