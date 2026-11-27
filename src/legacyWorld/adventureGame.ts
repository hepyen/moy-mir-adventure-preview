export type WorldId=1|2|3|4
export type V=[number,number,number]
type Treasure={id:string;title:string;emoji:string;color:string;at:number;position:V;clue:string}
type Mission={id:string;title:string;story:string;treasures:Treasure[];recipe:{id:string;title:string;emoji:string;position:V}}
export const ADVENTURES:Record<WorldId,Mission[]>={
 1:[
 {id:'meadow-light',title:'Свет для тропинки',story:'Миро заметил три потерянных детали. Найди их и собери маленький фонарь для поляны.',treasures:[
 {id:'m-wood',title:'Деревянная планка',emoji:'🪵',color:'#b57b50',at:40,position:[-2.3,.22,-1.1],clue:'У дальнего левого края травы.'},
 {id:'m-glass',title:'Голубое стекло',emoji:'💎',color:'#66d9ed',at:80,position:[2.25,.25,-1.55],clue:'На противоположной стороне поляны, у края.'},
 {id:'m-light',title:'Светящийся камешек',emoji:'✨',color:'#ffdb69',at:160,position:[-.65,.23,1.8],clue:'Впереди, рядом с тропинкой.'}],recipe:{id:'m-lantern',title:'Фонарь путешественника',emoji:'🏮',position:[-2.55,.12,1.92]}},
 {id:'meadow-garden',title:'Сад друзей',story:'Собери материалы для маленькой скульптуры возле домика.',treasures:[
 {id:'m-clay',title:'Глина',emoji:'🧱',color:'#db925d',at:400,position:[-2.65,.22,.55],clue:'На западном краю острова.'},
 {id:'m-paint',title:'Цветной пигмент',emoji:'🎨',color:'#ef8db0',at:650,position:[2.64,.24,.25],clue:'У восточного края острова.'},
 {id:'m-seed',title:'Семечко',emoji:'🌱',color:'#86db70',at:900,position:[.12,.25,-1.88],clue:'Позади домика.'}],recipe:{id:'m-flower',title:'Цветок дружбы',emoji:'🌻',position:[2.55,.12,1.9]}}
 ],
 2:[
 {id:'tree-forest',title:'Запасы белочки',story:'Белочка нашла место для тайника. Собери три детали для её кормушки.',treasures:[
 {id:'t-nut',title:'Орешек',emoji:'🌰',color:'#d99458',at:80,position:[-2.3,.22,-1.1],clue:'У корней с левой стороны.'},
 {id:'t-rope',title:'Прочная верёвка',emoji:'🧵',color:'#e7ce8b',at:160,position:[2.3,.25,-1.5],clue:'На дальней стороне острова.'},
 {id:'t-board',title:'Дощечка',emoji:'🪵',color:'#bd8654',at:240,position:[-.7,.22,1.85],clue:'У ближнего края.'}],recipe:{id:'t-feeder',title:'Кормушка белочки',emoji:'🐿️',position:[-2.55,.12,1.9]}},
 {id:'tree-stars',title:'Огоньки в ветвях',story:'Найди материалы для звёздного украшения дерева.',treasures:[
 {id:'t-crystal',title:'Кристалл',emoji:'💎',color:'#b0adff',at:400,position:[-2.65,.25,.5],clue:'Слева от ствола, на краю.'},
 {id:'t-wire',title:'Медная проволока',emoji:'🔧',color:'#e9a063',at:650,position:[2.65,.22,.3],clue:'С правой стороны, у границы травы.'},
 {id:'t-star',title:'Звёздная бусина',emoji:'⭐',color:'#ffda72',at:950,position:[.15,.22,-1.9],clue:'За большим деревом.'}],recipe:{id:'t-star-lamp',title:'Звёздный фонарь',emoji:'⭐',position:[2.55,.12,1.9]}}
 ],
 3:[
 {id:'space-signal',title:'Сигнал с Луны',story:'Разведчик принял слабый сигнал. Найди детали, чтобы собрать маячок связи.',treasures:[
 {id:'s-metal',title:'Лёгкий металл',emoji:'🔩',color:'#a5bfd9',at:40,position:[-2.25,.17,-1.25],clue:'У западного края лунной площадки.'},
 {id:'s-cell',title:'Энергоячейка',emoji:'🔋',color:'#72efc4',at:80,position:[2.25,.2,-1.5],clue:'На противоположной стороне кратера.'},
 {id:'s-chip',title:'Микросхема',emoji:'💾',color:'#5ac7ec',at:160,position:[-.65,.21,2.2],clue:'На ближней стороне площадки.'}],recipe:{id:'s-beacon',title:'Сигнальный маячок',emoji:'📡',position:[-2.2,.06,2.0]}},
 {id:'space-archive',title:'Капсула исследователя',story:'Собери образцы для миниатюрной научной капсулы.',treasures:[
 {id:'s-ore',title:'Лунный образец',emoji:'🪨',color:'#a1a9c8',at:400,position:[-2.85,.22,.25],clue:'У левого края площадки.'},
 {id:'s-vial',title:'Контейнер',emoji:'🧪',color:'#91d8f4',at:650,position:[2.85,.22,.35],clue:'На правом краю площадки.'},
 {id:'s-data',title:'Кристалл данных',emoji:'💎',color:'#d9a3ff',at:950,position:[.2,.22,-2.65],clue:'За станцией.'}],recipe:{id:'s-capsule',title:'Научная капсула',emoji:'🧪',position:[2.2,.06,2.0]}}
 ],
 4:[
 {id:'ocean-reef',title:'Исследование рифа',story:'Собери три образца для миниатюрного аквариума станции.',treasures:[
 {id:'o-shell',title:'Ракушка',emoji:'🐚',color:'#ffd5ad',at:40,position:[-2.25,.16,-1.25],clue:'У дальнего левого края песчаной площадки.'},
 {id:'o-pearl',title:'Жемчужина',emoji:'⚪',color:'#bde8ff',at:80,position:[2.25,.17,-1.5],clue:'На противоположной стороне рифа.'},
 {id:'o-coral',title:'Образец коралла',emoji:'🪸',color:'#f2a0a9',at:160,position:[-.65,.18,2.2],clue:'На ближней стороне площадки.'}],recipe:{id:'o-aquarium',title:'Аквариум исследователя',emoji:'🐠',position:[-2.2,.06,2.0]}},
 {id:'ocean-signal',title:'Голос глубины',story:'Найди детали для подводного сигнального устройства.',treasures:[
 {id:'o-metal',title:'Сплав',emoji:'🔩',color:'#a1c5dd',at:400,position:[-2.85,.2,.25],clue:'У левого края песчаной площадки.'},
 {id:'o-cell',title:'Батарея',emoji:'🔋',color:'#91e8cc',at:650,position:[2.85,.2,.35],clue:'На правом краю площадки.'},
 {id:'o-chip',title:'Датчик',emoji:'💎',color:'#e3b0ff',at:950,position:[.2,.2,-2.65],clue:'За станцией.'}],recipe:{id:'s-beacon-ocean',title:'Подводный сигнализатор',emoji:'📡',position:[2.2,.06,2.0]}}
 ]
}
export type AdventureState={found:string[];crafted:string[]}
export const EMPTY_ADVENTURE:AdventureState={found:[],crafted:[]}
const all=Object.values(ADVENTURES).flat()
const validTreasures=new Set(all.flatMap(m=>m.treasures.map(t=>t.id)))
export function normalizeAdventure(value:unknown):AdventureState{
 const raw=value as Partial<AdventureState>|null
 const found=Array.isArray(raw?.found)?[...new Set(raw.found.filter(x=>validTreasures.has(x)))]:[]
 const crafted=Array.isArray(raw?.crafted)?[...new Set(raw.crafted.filter(id=>all.some(m=>m.recipe.id===id&&m.treasures.every(t=>found.includes(t.id)))))]:[]
 return {found,crafted}
}
export function collectTreasure(s:AdventureState,world:WorldId,points:number,id:string):AdventureState{
 if(s.found.includes(id)||!ADVENTURES[world].some(m=>m.treasures.some(t=>t.id===id&&points>=t.at)))return s
 return {...s,found:[...s.found,id]}
}
export function craftTreasure(s:AdventureState,world:WorldId,points:number,id:string):AdventureState{
 const m=ADVENTURES[world].find(x=>x.recipe.id===id)
 if(!m||s.crafted.includes(id)||!m.treasures.every(t=>points>=t.at&&s.found.includes(t.id)))return s
 return {...s,crafted:[...s.crafted,id]}
}
export function adventureInventory(s:AdventureState,world:WorldId){
 return ADVENTURES[world].flatMap(m=>s.crafted.includes(m.recipe.id)?[]:m.treasures.filter(t=>s.found.includes(t.id)))
}
export const adventureKey=(family:string,child:string)=>'moymir-adventure-v1:'+family+':'+child
