import {getPracticeBank} from '../subjects/practiceBank'
import type {MainSubject} from '../subjects/practiceBank'
export const MIRO_TOPICS=[
 {id:'fractions',label:'Дроби и десятичные числа',subject:'Математика',question:'Объясни дроби на простом примере, затем дай мне одну задачу.'},
 {id:'integers',label:'Целые числа',subject:'Математика',question:'Помоги повторить отрицательные и положительные числа. Дай одну задачу.'},
 {id:'maps',label:'Координаты и карты',subject:'География',question:'Объясни широту и долготу, затем проверь меня одним вопросом.'},
 {id:'climate',label:'Климат и рельеф',subject:'География',question:'Помоги повторить климат и рельеф на понятных примерах.'},
 {id:'cells',label:'Клетка и живые организмы',subject:'Биология',question:'Объясни устройство клетки, затем задай один вопрос.'},
 {id:'spanish',label:'Грамматика испанского',subject:'Испанский',question:'Давай потренируем испанскую грамматику. Объясняй по-русски.'},
 {id:'english',label:'Разговорный английский',subject:'Английский',question:'Давай проведём короткий диалог на английском. Исправляй ошибки по-русски.'},
 {id:'history',label:'История',subject:'История',question:'Помоги повторить первые цивилизации, по одному вопросу за раз.'}
] as const
export type MiroTopicId=typeof MIRO_TOPICS[number]['id']
export type MiroStyle='classic'|'mint'|'gold'|'violet'|'silver'
export const MIRO_LEVELS:{at:number;name:string;style:MiroStyle;label:string}[]=[
 {at:0,name:'Помощник',style:'classic',label:'Классический'},
 {at:400,name:'Исследователь',style:'mint',label:'Мятный'},
 {at:1000,name:'Мастер знаний',style:'gold',label:'Золотой'},
 {at:1600,name:'Наставник',style:'violet',label:'Фиолетовый'},
 {at:3200,name:'Эксперт',style:'silver',label:'Серебряный'}
]
export type MiroProfile={topics:MiroTopicId[];style:MiroStyle;autoSpeak:boolean;language:'ru-RU'|'es-ES'|'en-GB'}
export const DEFAULT_MIRO_PROFILE:MiroProfile={topics:[],style:'classic',autoSpeak:false,language:'ru-RU'}
const key=(id:string)=>'moymir-miro-profile-v2:'+id
export function readMiroProfile(id:string):MiroProfile{try{const v=JSON.parse(localStorage.getItem(key(id))||'null');return {topics:Array.isArray(v?.topics)?MIRO_TOPICS.filter(t=>v.topics.includes(t.id)).map(t=>t.id):[],style:MIRO_LEVELS.some(l=>l.style===v?.style)?v.style:'classic',autoSpeak:v?.autoSpeak===true,language:['ru-RU','es-ES','en-GB'].includes(v?.language)?v.language:'ru-RU'}}catch{return {...DEFAULT_MIRO_PROFILE}}}
export function saveMiroProfile(id:string,p:MiroProfile){try{localStorage.setItem(key(id),JSON.stringify(p));return true}catch{return false}}
export function miroLevel(points:number){return MIRO_LEVELS.filter(l=>l.at<=Math.max(0,points)).at(-1)||MIRO_LEVELS[0]}
export type StudySummary={subject:string;chapter:string;score:number;total:number}
const practiceSubjects:Record<string,string>={matematicas:'Математика',lengua:'Испанский',historia:'География и история',biologia:'Биология'}
export function localStudySummary(child:string):StudySummary[]{
 try{const prefix='moymir-practice-v1:'+encodeURIComponent(child)+':';const rows:StudySummary[]=[];
 for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!k?.startsWith(prefix))continue;const subject=k.slice(prefix.length);if(!practiceSubjects[subject])continue;const data=JSON.parse(localStorage.getItem(k)||'[]');if(!Array.isArray(data))continue;const seen=new Set<string>();for(const v of data.slice(0,30)){if(typeof v.chapter!=='string'||seen.has(v.chapter)||!Number.isFinite(v.score)||!Number.isFinite(v.total)||v.total<=0||v.score<0||v.score>v.total)continue;seen.add(v.chapter);rows.push({subject:practiceSubjects[subject],chapter:(getPracticeBank(subject as MainSubject).find(ch=>ch.id===v.chapter)?.title||v.chapter).slice(0,80),score:v.score,total:v.total})}}
 return rows.sort((a,b)=>a.score/a.total-b.score/b.total).slice(0,8)}catch{return []}
}
