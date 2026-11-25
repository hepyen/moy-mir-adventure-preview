import {WORLD_01_OBJECTS} from './world01'
import {TREEHOUSE_STAGES} from './treehouseStages'

export const TREEHOUSE_BUILD_ORDER=[0,27,...Array.from({length:26},(_,i)=>i+1),28,29]
export type SpotKind='home'|'door'|'light'|'tree'|'garden'|'pond'|'dog'|'decoration'
export type WorldSpot={id:string;title:string;subtitle:string;description:string;kind:SpotKind;target:[number,number,number];distance:number}
const homePieces=new Set(['blueprint','foundation','wallfront','wallback','wallleft','wallright','roofleft','roofright','chimney','smoke','steps'])
const treePieces=new Set(['sprout','trunk','crown','apples'])
const meadowPositions:Record<string,[number,number,number]>={
 grass:[0,.1,0],flowers:[-2,.2,.5],pebbles:[.6,.15,1.4],dog:[1.5,.35,.4],
 fence:[2,.6,-1.6],bench:[-1.95,.65,1.07],flowerbed:[2.2,.2,-.8],mailbox:[-2.1,.7,.1],
 garden:[-2.05,.25,-1.48],pond:[1.6,.1,1.35],lily:[1.7,.15,1.35],celebration:[0,1.4,0]
}
export function meadowSpot(part:string):WorldSpot{
 const unlocked=WORLD_01_OBJECTS.find(x=>x.id===part)
 const subtitle=unlocked?.title||'Украшение острова'
 const base={id:part,subtitle}
 if(part==='dog')return {...base,title:'🐶 Собачка',kind:'dog',target:[1.5,.35,.4],distance:5.9,description:'Погладь собачку: она остановится, радостно завиляет хвостом и погавкает.'}
 if(part==='door')return {...base,title:'🚪 Дверь домика',kind:'door',target:[.22,.95,.9],distance:5.2,description:'Открой или закрой дверь. Миро покажет, как устроен домик.'}
 if(part==='window'||part==='lamp')return {...base,title:'💡 Освещение домика',kind:'light',target:part==='lamp'?[-.6,1.45,1]:[1,1.3,.9],distance:5.2,description:'Включи свет: окна и фонарь осветят поляну.'}
 if(homePieces.has(part))return {...base,title:'🏡 Домик на поляне',kind:'home',target:[.65,1.3,.12],distance:6.5,description:'За дверью есть настоящий проход и обставленная комната. Открой дверь и загляни внутрь!'}
 if(treePieces.has(part))return {...base,title:'🌳 Яблоня',kind:'tree',target:[-1.35,1.5,-.54],distance:6.6,description:'Дерево растёт по мере выполнения заданий. Дотронься, чтобы листва зашелестела.'}
 if(part==='garden'||part==='flowerbed'||part==='flowers')return {...base,title:'🌼 Цветы и огород',kind:'garden',target:meadowPositions[part],distance:5.7,description:'Каждая грядка и клумба появились благодаря выполненным делам.'}
 if(part==='pond'||part==='lily')return {...base,title:'💧 Пруд',kind:'pond',target:[1.6,.2,1.35],distance:5.2,description:'Тихий пруд с кувшинками. Рассмотри его, вращая остров.'}
 return {...base,title:subtitle,kind:'decoration',target:meadowPositions[part]||[0,.65,0],distance:6.3,description:'Это украшение открыто за выполненные задания. Его можно рассмотреть вблизи.'}
}
export function treehouseSpot(index:number):WorldSpot{
 const stageNumber=TREEHOUSE_BUILD_ORDER.indexOf(index)
 const subtitle=TREEHOUSE_STAGES[stageNumber]||'Домик на дереве'
 const base={id:'treehouse-'+index,subtitle}
 if(index===15)return {...base,title:'🚪 Дверь домика на дереве',kind:'door',target:[.6,3.55,1.0],distance:6.9,description:'Открой дверь и загляни в обставленную комнату на дереве.'}
 if(index===16||index===23)return {...base,title:'💡 Свет в домике на дереве',kind:'light',target:[.6,3.9,1.0],distance:7,description:'Включи освещение окон и подвесных фонариков.'}
 if(index>=12&&index<=20)return {...base,title:'🌳 Домик на дереве',kind:'home',target:[.5,3.7,.35],distance:8.1,description:'Домик построен по этапам. Дверь и окна можно открыть и осветить.'}
 if(index<=8)return {...base,title:'🌲 Большое дерево',kind:'tree',target:[0,3.1,-.4],distance:9.4,description:'Дерево стало основой нового мира. Его ветви и крона живут своей жизнью.'}
 if(index===21)return {...base,title:'🌉 Мостик и площадка',kind:'decoration',target:[-1.8,3.45,.2],distance:6.5,description:'Деревянный мост соединяет площадку с домиком.'}
 if(index===27)return {...base,title:'🐿️ Рыжая белочка',kind:'decoration',target:[0,1.2,.2],distance:5.4,description:'Белочка путешествует по веткам и лестнице.'}
 if(index===22)return {...base,title:'🎠 Качели и сад',kind:'garden',target:[-2.37,3.2,.5],distance:6.5,description:'Качели плавно раскачиваются, а цветы растут вокруг дерева.'}
 if(index===24||index===25)return {...base,title:'🌺 Сад на дереве',kind:'garden',target:[-1.4,1.5,.2],distance:9.0,description:'Цветы украшают дорожку, ветви и балкон.'}
 return {...base,title:subtitle,kind:'decoration',target:[0,2.4,.2],distance:9.5,description:'Эта часть нового мира открыта благодаря достижениям Ильи.'}
}
