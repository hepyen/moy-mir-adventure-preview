export type DailyStatus = 'open' | 'pending' | 'approved'
export type DailyTask = { id:string; title:string; points:number; icon:string; days:number[]; active:boolean }
export type DailyRecord = { date:string; taskId:string; state:DailyStatus; points:number }
export const dailyDefaults: DailyTask[] = [
 {id:'brush-am',title:'Почистить зубы утром',points:5,icon:'🪥',days:[0,1,2,3,4,5,6],active:true},
 {id:'brush-pm',title:'Почистить зубы вечером',points:5,icon:'🪥',days:[0,1,2,3,4,5,6],active:true},
 {id:'bed',title:'Заправить кровать',points:5,icon:'🛏️',days:[0,1,2,3,4,5,6],active:true},
 {id:'bible',title:'Почитать Библию',points:0,icon:'📖',days:[0,1,2,3,4,5,6],active:true},
 {id:'homework',title:'Сделать школьные домашние задания',points:20,icon:'📚',days:[1,2,3,4,5],active:true},
 {id:'room',title:'Привести комнату в порядок',points:10,icon:'🧹',days:[0,1,2,3,4,5,6],active:true},
 {id:'dishes',title:'Помыть посуду или помочь с посудой',points:10,icon:'🍽️',days:[0,1,2,3,4,5,6],active:true},
 {id:'vacuum',title:'Пропылесосить',points:15,icon:'🧼',days:[2,6],active:true},
]
export function localDay(date:Date):string {
 return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)
}
export function dailyForDate(tasks:DailyTask[],date:Date) {return tasks.filter(t=>t.active && t.days.includes(date.getDay()))}
export function dailyEarnings(records:DailyRecord[]) {return records.filter(r=>r.state==='approved').reduce((n,r)=>n+r.points,0)}
export function dailyRecord(records:DailyRecord[],date:string,taskId:string) {return records.find(r=>r.date===date && r.taskId===taskId)}
export function changeDailyRecord(records:DailyRecord[],date:string,task:DailyTask,state:DailyStatus):DailyRecord[] {
 const previous=dailyRecord(records,date,task.id)
 if (previous?.state==='approved' || state==='approved' && previous?.state!=='pending') return records
 return [...records.filter(r=>!(r.date===date && r.taskId===task.id)),{date,taskId:task.id,state,points:task.points}]
}
