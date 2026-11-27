import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react'
import {supabase} from '../lib/supabase'
import {RoomCloudContext} from './RoomCloudContext'
export const MIRO_CATALOG=[
 {id:'skin-classic',label:'Классический',icon:'🤖',cost:0,description:'Белый корпус и голубой экран'},
 {id:'skin-spider',label:'Паучок-герой',icon:'🕷️',cost:6,description:'Красно-синий костюм, паутинный знак и маска'},
 {id:'skin-rabbit',label:'Пушистый зайка',icon:'🐰',cost:5,description:'Мягкие лапки, длинные уши и хвостик'},
 {id:'skin-astro',label:'Астронавт',icon:'🚀',cost:6,description:'Шлем, скафандр и реактивный блок'},
 {id:'skin-diver',label:'Дайвер',icon:'🤿',cost:5,description:'Маска, трубка, баллон и ласты'},
 {id:'skin-explorer',label:'Следопыт',icon:'🧭',cost:4,description:'Шляпа, куртка и походный пояс'},
 {id:'skin-dragon',label:'Дракончик',icon:'🐲',cost:8,description:'Рожки, крылья, гребень и длинный хвост'},
 {id:'acc-none',label:'Без аксессуара',icon:'○',cost:0,description:'Стандартный костюм'},
 {id:'acc-wings',label:'Реактивные крылья',icon:'🪽',cost:3,description:'Два светящихся двигателя'},
 {id:'acc-headphones',label:'Наушники',icon:'🎧',cost:2,description:'Музыкальная гарнитура'},
 {id:'acc-antenna',label:'Антенна',icon:'📡',cost:2,description:'Светящийся приёмник'},
 {id:'acc-pack',label:'Рюкзак',icon:'🎒',cost:3,description:'Контейнер исследователя'},
 {id:'paint-original',label:'Цвет костюма',icon:'🎨',cost:0,description:'Оригинальное оформление'},
 {id:'paint-mint',label:'Мятный',icon:'●',cost:1,description:'Мятная окраска'},
 {id:'paint-rose',label:'Розовый',icon:'●',cost:1,description:'Розовая окраска'},
 {id:'paint-gold',label:'Золотой',icon:'●',cost:2,description:'Золотая окраска'},
 {id:'paint-violet',label:'Фиолетовый',icon:'●',cost:1,description:'Фиолетовая окраска'},
 {id:'paint-blue',label:'Синий',icon:'●',cost:1,description:'Синяя окраска'}
] as const
export type MiroItem=typeof MIRO_CATALOG[number]
export type Wardrobe={skin:string;accessory:string;paint:string;owned:string[]}
export const DEFAULT_WARDROBE:Wardrobe={skin:'skin-classic',accessory:'acc-none',paint:'paint-original',owned:[]}
export const PAINTS:Record<string,string>={'paint-mint':'#70d6b0','paint-rose':'#ef9fca','paint-gold':'#f6cb67','paint-violet':'#a78deb','paint-blue':'#65a9ee'}
const fallback={wardrobe:DEFAULT_WARDROBE,ready:false,busy:false,parent:false,connected:false,balance:0,notice:'',equip:async(_item:MiroItem,_buy:boolean)=>false,reload:async()=>{}}
const Context=createContext(fallback)
export function useMiroWardrobe(){return useContext(Context)}
export function MiroWardrobeProvider({children}:{children:ReactNode}){
 const scope=useContext(RoomCloudContext)
 const [wardrobe,setWardrobe]=useState<Wardrobe>(DEFAULT_WARDROBE),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[notice,setNotice]=useState('')
 const epoch=useRef(0),flight=useRef(false)
 async function reload(){const id=++epoch.current;setReady(false);if(!scope){setWardrobe(DEFAULT_WARDROBE);return}try{const {data,error}=await supabase.from('moymir_miro_wardrobe').select('skin,accessory,paint,owned').eq('family_id',scope.family).eq('child_id',scope.child).maybeSingle();if(id!==epoch.current)return;if(error)throw error;setWardrobe(data||DEFAULT_WARDROBE);setReady(true);setNotice('Гардероб загружен.')}catch{if(id===epoch.current)setNotice('Не удалось загрузить гардероб. Повтори попытку.')}}
 useEffect(()=>{setWardrobe(DEFAULT_WARDROBE);setNotice('');setBusy(false);flight.current=false;void reload();return()=>{epoch.current++}},[scope?.family,scope?.child,scope?.parent])
 async function equip(item:MiroItem,buy:boolean){if(!scope||scope.parent||!ready||flight.current)return false;const id=epoch.current;flight.current=true;setBusy(true);try{const r=await supabase.rpc('moymir_miro_equip',{p_family:scope.family,p_item:item.id,p_buy:buy});if(r.error)throw r.error;if(id!==epoch.current)return false;setWardrobe(r.data);setNotice(buy?'Покупка сохранена. Костюм обновлён.':'Облик сохранён.');scope.refresh();return true}catch{if(id===epoch.current)setNotice('Не удалось сохранить. Проверь баланс и соединение.');return false}finally{if(id===epoch.current){flight.current=false;setBusy(false)}}}
 return <Context.Provider value={{wardrobe,ready,busy,parent:!!scope?.parent,connected:!!scope,balance:scope?.balance||0,notice,equip,reload}}>{children}</Context.Provider>
}
