export type StepStatus='pending'|'approved'
export type SpiritualStep={id:string;title:string;points:number;icon:string;rhythm:'daily'|'when-possible'}
export type SpiritualRecord={date:string;stepId:string;state:StepStatus;points:number}
export const spiritualSteps:SpiritualStep[]=[
{id:'bible',title:'Почитать Библию',points:10,icon:'📖',rhythm:'daily'},
{id:'daily-text',title:'Прочитать ежедневный стих',points:5,icon:'🌤️',rhythm:'daily'},
{id:'bedtime-prayer',title:'Помолиться перед сном',points:5,icon:'🙏',rhythm:'daily'},
{id:'meeting-prep',title:'Подготовиться к встрече собрания',points:15,icon:'📝',rhythm:'when-possible'},
{id:'meeting-attend',title:'Побывать на встрече собрания',points:10,icon:'🏛️',rhythm:'when-possible'},
{id:'comment',title:'Подготовить или дать комментарий',points:10,icon:'💬',rhythm:'when-possible'},
{id:'school-prep',title:'Подготовить учебное задание',points:20,icon:'📚',rhythm:'when-possible'},
{id:'school-present',title:'Выступить с учебным заданием',points:20,icon:'🎤',rhythm:'when-possible'},
{id:'ministry',title:'Принять участие в служении',points:15,icon:'🚶',rhythm:'when-possible'},
{id:'ministry-share',title:'Поделиться библейской мыслью',points:10,icon:'🗣️',rhythm:'when-possible'},
{id:'family-worship',title:'Участвовать в семейном поклонении',points:15,icon:'🏠',rhythm:'when-possible'},
{id:'personal-study',title:'Провести личное изучение Библии',points:15,icon:'🔎',rhythm:'when-possible'},
{id:'encourage',title:'Поддержать кого-то добрым словом',points:5,icon:'💛',rhythm:'when-possible'}
]
export const spiritualMilestone=1000
export const spiritualStages=[
{name:'Первый росток',icon:'🌱'},
{name:'Крепкий стебелёк',icon:'🌿'},
{name:'Первые листья',icon:'🍃'},
{name:'Зелёное поле',icon:'🌲'},
{name:'Завязь колоса',icon:'🌼'},
{name:'Золотые колосья',icon:'🌻'},
{name:'Наливаются зёрна',icon:'🌽'},
{name:'Спелый урожай',icon:'🍂'},
{name:'Полная корзина',icon:'🧺'},
{name:'Щедрое поле',icon:'🏵️'}
]
export function spiritualStage(total:number) {
 const index=Math.min(Math.floor(Math.max(0,total)/spiritualMilestone),spiritualStages.length-1)
 return {index,number:index+1,...spiritualStages[index],progress:index===spiritualStages.length-1?spiritualMilestone:Math.max(0,total)%spiritualMilestone}
}
export function totalSpiritualPoints(records:SpiritualRecord[]):number {
 return records.filter(r=>r.state==='approved').reduce((n,r)=>n+r.points,0)
}
export function spiritualRecord(records:SpiritualRecord[],date:string,stepId:string) {
 return records.find(r=>r.date===date&&r.stepId===stepId)
}
export function updateSpiritualRecord(records:SpiritualRecord[],date:string,step:SpiritualStep,action:'submit'|'approve'|'reject'):SpiritualRecord[] {
 const old=spiritualRecord(records,date,step.id)
 if(action==='submit') {
  if(old) return records
  return [...records,{date,stepId:step.id,state:'approved',points:step.points}]
 }
 if(!old||old.state!=='pending')return records
 if(action==='reject')return records.filter(r=>!(r.date===date&&r.stepId===step.id))
 return records.map(r=>r===old?{...r,state:'approved'}:r)
}
