import {reviewAnchor} from '../notifications/destinations';
import {useState} from 'react';
import type {HealthMeal,HealthPlan,MealProposal} from './useHealthFamily';
import './HealthKitchen.css';
const WEEK=['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
const MEALS=[['breakfast','🌤️ Завтрак'],['lunch','🥘 Обед'],['dinner','🌙 Ужин'],['snack','🍎 Перекус']] as [keyof HealthMeal,string][];
const IDEAS:Record<keyof HealthMeal,string[]>={
 breakfast:['Овсянка с яблоком и молоком','Омлет с помидорами и хлебом','Йогурт без добавленного сахара с фруктом и овсянкой','Тост с сыром и фрукт'],
 lunch:['Курица с картофелем и овощами','Чечевица с морковью и хлебом','Рыба с рисом и салатом','Макароны с индейкой и томатами'],
 dinner:['Овощной суп и бутерброд с сыром','Омлет с зеленью и помидорами','Рыба в духовке с овощами','Нут с овощами и хлебом'],
 snack:['Яблоко и натуральный йогурт','Банан и бутерброд с сыром','Фрукты и горсть орехов при отсутствии аллергии','Цельнозерновой тост с творогом']
};
const SHOP:{label:string;test:RegExp}[]=[
 {label:'Овощи и зелень',test:/овощ|салат|помидор|морков|зелень|огурец|нут|чечев/},
 {label:'Фрукты и ягоды',test:/фрукт|банан|яблок|ягод/},
 {label:'Картофель',test:/картофел/},
 {label:'Яйца',test:/яйц|омлет|сырник/},
 {label:'Молоко',test:/молок|овсянк/},
 {label:'Натуральный йогурт',test:/йогурт/},
 {label:'Сыр и творог',test:/сыр|творог/},
 {label:'Курица и индейка',test:/куриц|индейк|плов/},
 {label:'Рыба',test:/рыб/},
 {label:'Нут и чечевица',test:/чечевиц|нут/},
 {label:'Рис, гречка, овсянка',test:/рис|гречк|овсянк|плов/},
 {label:'Макароны и хлеб',test:/хлеб|макарон|тост|бутерброд|пицц/},
 {label:'Оливковое масло',test:/овощ|салат|суп|куриц|рыб/}
];
function possiblyContainsAllergen(dish:string,allergy:string){
 const x=allergy.toLowerCase().trim(),name=dish.toLowerCase();
 const keywords=x.includes('орех')?['орех','nuts']:
  x.includes('молок')||x.includes('лактоз')?['молок','сыр','йогурт','творог','сырник']:
  x.includes('яйц')?['яйц','омлет','сырник']:
  x.includes('глютен')||x.includes('пшениц')?['макарон','хлеб','тост','пицц','бутерброд']:
  x.includes('рыб')?['рыб']:[x];
 return keywords.some(k=>name.includes(k));
}
function recipeFor(dish:string):string[]{
 const s=dish.toLowerCase();
 if(/овсянк/.test(s))return ['Подогрей молоко или воду.','Всыпь овсяные хлопья и вари до мягкости, помешивая.','Добавь нарезанный фрукт. Подавай тёплым.'];
 if(/омлет|яйц/.test(s))return ['Взрослый разогревает сковороду с небольшим количеством масла.','Взбей яйца, добавь нарезанные овощи.','Готовь до полной готовности яиц.'];
 if(/куриц|индейк|плов/.test(s))return ['Промой овощи и подготовь гарнир.','Взрослый готовит мясо до полной готовности.','Подавай с овощами, рисом или картофелем.'];
 if(/рыб/.test(s))return ['Взрослый проверяет, нет ли костей.','Запеки рыбу до полной готовности.','Подай с овощами и приготовленным гарниром.'];
 if(/чечевиц|нут/.test(s))return ['Промой и подготовь бобовые.','Туши с овощами до мягкости, учитывая время замачивания, если нужно.','Подавай тёплым с хлебом или салатом.'];
 if(/суп|крем/.test(s))return ['Помой и нарежь овощи вместе со взрослым.','Свари до мягкости.','Подавай как суп или измельчи блендером со взрослым.'];
 if(/пицц/.test(s))return ['Подготовь основу и томатный соус.','Разложи овощи и сыр.','Взрослый выпекает в духовке до готовности.'];
 if(/йогурт|фрукт|банан|яблок|ягод/.test(s))return ['Помой и подготовь фрукты.','Добавь натуральный йогурт или подходящую основу.','Подавай свежим.'];
 return ['Проверь, какие продукты понадобятся.','Готовьте вместе со взрослым, соблюдая гигиену и безопасную температуру.','Добавь овощи или фрукты по вкусу.'];
}
function FoodArt({title,kind}:{title:string;kind:keyof HealthMeal}){
 const n=title.toLowerCase();
 const color=/суп|чечев|нут/.test(n)?'#eeab65':/овсян|йогурт|сырник/.test(n)?'#f4d9a0':/рыб/.test(n)?'#efb19b':/салат|овощ/.test(n)?'#85c987':'#eab978';
 const accent=/ягод|банан|яблок|фрукт/.test(n)?'#e95970':/рыб/.test(n)?'#d67c64':'#5ca971';
 return <svg className="h-food-art" viewBox="0 0 210 135" role="img" aria-label={'Иллюстрация блюда: '+title}>
  <defs><linearGradient id={'food-'+kind} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#eaffec"/><stop offset="1" stopColor="#d5edff"/></linearGradient></defs>
  <rect width="210" height="135" rx="16" fill={'url(#food-'+kind+')'}/>
  <ellipse cx="112" cy="75" rx="82" ry="54" fill="#a8b9a93d"/>
  <ellipse cx="105" cy="67" rx="80" ry="53" fill="#fffefe" stroke="#d1e4e6" strokeWidth="5"/>
  <ellipse cx="105" cy="67" rx="67" ry="42" fill={color}/>
  <path d="M51 68 Q78 31 97 70 T157 65" fill="none" stroke="#f9f5d4" strokeWidth="6" strokeLinecap="round" opacity=".85"/>
  <circle cx="68" cy="49" r="10" fill={accent}/><circle cx="147" cy="84" r="11" fill={accent}/>
  <circle cx="115" cy="53" r="10" fill="#a4d17b"/><circle cx="128" cy="79" r="9" fill="#f9e8a5"/>
  <path d="M48 104 Q60 89 65 97" fill="none" stroke="#68ae70" strokeWidth="4" strokeLinecap="round"/>
  <text x="17" y="22" fontSize="17">{kind==='breakfast'?'☀️':kind==='lunch'?'🍃':kind==='dinner'?'🌙':'🍎'}</text>
 </svg>
}
export function HealthKitchen({plan,parent,connected,requests,onPlan,onPropose,onDecide}:{plan:HealthPlan;parent:boolean;connected:boolean;requests:MealProposal[];onPlan:(next:HealthPlan)=>void;onPropose:(weekday:number,kind:keyof HealthMeal,dish:string)=>Promise<void>;onDecide:(request:MealProposal,approve:boolean)=>Promise<void>}){
 const [day,setDay]=useState(()=>{const d=new Date().getDay();return (d+6)%7});
 const [edit,setEdit]=useState(false);
 const [recipe,setRecipe]=useState<{kind:keyof HealthMeal;dish:string}|null>(null);
 const [choices,setChoices]=useState<keyof HealthMeal|null>(null);
 const [suggestion,setSuggestion]=useState('');
 const [shopping,setShopping]=useState(false);
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 const [allergyEntry,setAllergyEntry]=useState('');
 const todaysMeals:HealthMeal=plan.meals[day]||{breakfast:'',lunch:'',dinner:'',snack:''};
 const basket=SHOP.filter(x=>plan.meals.some(m=>Object.values(m).some(d=>x.test.test(d.toLowerCase())))).map(x=>x.label);
 const pending=requests.filter(x=>x.status==='pending');
 function editMeal(kind:keyof HealthMeal,value:string){if(!parent)return;const next=[...plan.meals];next[day]={...todaysMeals,[kind]:value.slice(0,180)};onPlan({...plan,meals:next});}
 async function ask(kind:keyof HealthMeal,dish:string){
  if(!dish.trim())return;
  setBusy(true);
  try{await onPropose(day,kind,dish);setNotice('Предложение отправлено родителям. Они решат, менять ли меню.');setChoices(null);setSuggestion('')}
  catch(e){setNotice(e instanceof Error?e.message:'Ошибка отправки')}
  finally{setBusy(false)}
 }
 async function decision(p:MealProposal,yes:boolean){
  setBusy(true);
  try{await onDecide(p,yes);setNotice(yes?'Блюдо утверждено и добавлено в меню':'Предложение отклонено')}
  catch(e){setNotice(e instanceof Error?e.message:'Ошибка подтверждения')}
  finally{setBusy(false)}
 }
 return <section className="h-kitchen" aria-label="Моя кухня">
  <div className="h-kitchen-hero"><span>🥗 МОЯ КУХНЯ</span><h2>Что сегодня вкусного?</h2><p>Миро предлагает готовить вместе. Хорошая еда помогает расти и чувствовать себя бодрее.</p></div>
  <div className="h-kitchen-week" role="group" aria-label="День недели">{WEEK.map((x,i)=><button key={x} className={i===day?'selected':''} onClick={()=>{setDay(i);setChoices(null);setRecipe(null)}}>{x.slice(0,2)}</button>)}</div>
  <h3 className="h-kitchen-day">{WEEK[day]}</h3>
  {MEALS.map(([kind,label])=><div key={kind} className="h-food-card">
   <FoodArt title={todaysMeals[kind]||'Вкусное блюдо'} kind={kind}/>
   <div className="h-food-card-body"><strong>{label}</strong>
    {edit&&parent?<textarea aria-label={label} maxLength={180} value={todaysMeals[kind]} onChange={e=>editMeal(kind,e.target.value)}/>:<p>{todaysMeals[kind]}</p>}
    <div className="h-food-actions">
     <button onClick={()=>setRecipe({kind,dish:todaysMeals[kind]})}>📖 Рецепт</button>
     <button onClick={()=>{setChoices(choices===kind?null:kind);setRecipe(null)}}>{parent?'🔁 Заменить':'💡 Предложить'}</button>
    </div>
   </div>
   {choices===kind&&<div className="h-food-alternatives"><small>{parent?'Выбери замену':'Предложи другое блюдо родителю'}</small>
    {IDEAS[kind].filter(d=>!plan.allergies.some(a=>possiblyContainsAllergen(d,a))).map(d=><button key={d} disabled={busy} onClick={()=>parent?(editMeal(kind,d),setChoices(null)):void ask(kind,d)}>{d}</button>)}
    {!parent&&<label>Своё предложение<input value={suggestion} maxLength={160} placeholder="Название блюда" onChange={e=>setSuggestion(e.target.value)}/><button disabled={busy||suggestion.trim().length<2} onClick={()=>void ask(kind,suggestion)}>Отправить родителю</button></label>}
   </div>}
   {recipe?.kind===kind&&<div className="h-food-recipe"><strong>👩‍🍳 Готовим вместе: {recipe.dish}</strong>{recipeFor(recipe.dish).map((x,i)=><p key={i}>{i+1}. {x}</p>)}<small>Используйте подходящие продукты. Работа с ножом, плитой и духовкой — вместе со взрослым.</small></div>}
  </div>)}
  {parent&&<div className="h-card"><div className="h-card-heading"><span className="h-card-icon">👨‍🍳</span><h2>Родительское меню</h2></div>
   <button className="h-subtle-button" onClick={()=>setEdit(v=>!v)}>{edit?'✓ Завершить редактирование':'✏️ Редактировать блюда'}</button>
   <h3>Пищевые ограничения и аллергии</h3><p>Указывайте только подтверждённые ограничения. При аллергии проверяйте состав каждого блюда.</p>
   <div className="h-food-allergies">{plan.allergies.map(x=><button key={x} onClick={()=>onPlan({...plan,allergies:plan.allergies.filter(y=>y!==x)})}>× {x}</button>)}</div>
   <div className="h-food-allergy-entry"><input aria-label="Аллергия или ограничение" placeholder="Например, орехи" maxLength={70} value={allergyEntry} onChange={e=>setAllergyEntry(e.target.value)}/><button disabled={!allergyEntry.trim()} onClick={()=>{onPlan({...plan,allergies:[...plan.allergies,allergyEntry.trim()].slice(0,15)});setAllergyEntry('')}}>Добавить</button></div>
   <h3 id="review-meals">Предложения Ильи {pending.length?('('+pending.length+')'):''}</h3>
   {pending.length===0?<p>Новых предложений нет.</p>:pending.map(p=><div className="h-food-request" key={p.id} id={reviewAnchor('meal',p.id)} tabIndex={-1}><span>{WEEK[p.weekday]} · {MEALS.find(([k])=>k===p.mealKind)?.[1]}<strong>{p.suggestion}</strong></span><button disabled={busy} onClick={()=>void decision(p,true)}>✓ Утвердить</button><button disabled={busy} onClick={()=>void decision(p,false)}>×</button></div>)}
  </div>}
  {!parent&&plan.allergies.length>0&&<div className="h-food-notice">⚠️ Учитываем семейные ограничения: {plan.allergies.join(', ')}. Перед едой проверь состав продуктов со взрослым.</div>}
  <div className="h-card"><div className="h-card-heading"><span className="h-card-icon">🛒</span><h2>Покупки на неделю</h2></div>
   <p>Список автоматически меняется вместе с утверждённым меню. Количество продуктов уточняйте по числу членов семьи и порциям.</p>
   <button className="h-subtle-button" onClick={()=>setShopping(v=>!v)}>{shopping?'Скрыть список':'Показать список покупок'}</button>
   {shopping&&<div className="h-food-shopping">{basket.map(x=><label key={x}><input type="checkbox"/>{x}</label>)}</div>}
  </div>
  <p className="h-food-notice">🍎 Еда не оценивается баллами и не привязана к весу. Меню примерное: ребёнок может есть по голоду и насыщению; запретов и диет для похудения здесь нет.</p>
  {!connected&&<p className="h-food-notice">📱 Сейчас доступно локальное меню. Для согласования блюд между телефонами войди в семейный аккаунт.</p>}
  {notice&&<div className="h-notice" role="status">{notice}</div>}
 </section>;
}
