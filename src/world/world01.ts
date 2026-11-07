export type WorldObject = {id:string; title:string; at:number; animation:'grow'|'pop'|'drop'|'fade'|'build'}
export const WORLD_01_OBJECTS: WorldObject[] = [
{id:'grass',title:'Мягкая трава',at:40,animation:'grow'},
{id:'flowers',title:'Первые цветы',at:80,animation:'grow'},
{id:'dog',title:'Весёлая собачка',at:120,animation:'pop'},
{id:'pebbles',title:'Камешки',at:160,animation:'pop'},
{id:'sprout',title:'Маленький росток',at:200,animation:'grow'},
{id:'trunk',title:'Ствол дерева',at:240,animation:'grow'},
{id:'crown',title:'Крона дерева',at:280,animation:'grow'},
{id:'apples',title:'Красные яблоки',at:320,animation:'pop'},
{id:'blueprint',title:'Контур дома',at:360,animation:'fade'},
{id:'foundation',title:'Фундамент домика',at:400,animation:'build'},
{id:'wallfront',title:'Передняя стена',at:440,animation:'build'},
{id:'wallback',title:'Задняя стена',at:480,animation:'build'},
{id:'wallleft',title:'Левая стена',at:520,animation:'build'},
{id:'wallright',title:'Правая стена',at:560,animation:'build'},
{id:'door',title:'Дверь',at:600,animation:'pop'},
{id:'window',title:'Окно',at:650,animation:'pop'},
{id:'roofleft',title:'Первый скат крыши',at:700,animation:'drop'},
{id:'roofright',title:'Второй скат крыши',at:750,animation:'drop'},
{id:'chimney',title:'Труба',at:800,animation:'grow'},
{id:'smoke',title:'Дымок',at:850,animation:'fade'},
{id:'lamp',title:'Фонарь у входа',at:900,animation:'pop'},
{id:'steps',title:'Крыльцо',at:950,animation:'build'},
{id:'fence',title:'Белый забор',at:1000,animation:'grow'},
{id:'bench',title:'Деревянная скамейка',at:1100,animation:'build'},
{id:'flowerbed',title:'Клумба',at:1200,animation:'grow'},
{id:'mailbox',title:'Почтовый ящик',at:1300,animation:'pop'},
{id:'garden',title:'Огород',at:1400,animation:'grow'},
{id:'pond',title:'Пруд',at:1450,animation:'grow'},
{id:'lily',title:'Кувшинка',at:1500,animation:'pop'},
{id:'celebration',title:'Праздничный мир завершён',at:1600,animation:'pop'},
]
export const WORLD_01_END = 1600
export function unlockedWorldObjects(approvedLifetimePoints:number):WorldObject[] {
 return WORLD_01_OBJECTS.filter(o=>approvedLifetimePoints>=o.at)
}
export function nextWorldObject(approvedLifetimePoints:number):WorldObject|undefined {
 return WORLD_01_OBJECTS.find(o=>o.at>approvedLifetimePoints)
}
export function earnedWorldPoints(tasks:{points:number;state:string}[],dailyRecords:{points:number;state:string}[]):number {
 return tasks.filter(t=>t.state==='approved').reduce((n,t)=>n+t.points,0)+dailyRecords.filter(r=>r.state==='approved').reduce((n,r)=>n+r.points,0)
}

/** Accumulate preview points without touching the account ledger. */
export function addPreviewScore(current:number,amount:number):number {
 if(!Number.isFinite(current)||!Number.isFinite(amount)||amount<=0)return Math.max(0,Math.min(WORLD_01_END,current||0))
 return Math.min(WORLD_01_END,Math.max(0,current)+amount)
}
