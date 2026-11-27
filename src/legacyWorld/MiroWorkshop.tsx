import {useEffect,useState,useRef,Component,type ReactNode} from 'react'
import {Canvas} from '@react-three/fiber'
import {createPortal} from 'react-dom'
import {MIRO_CATALOG,PAINTS,useMiroWardrobe,type MiroItem,type Wardrobe} from './miroWardrobe'
import {MiroModel} from './MiroModel'
import {CanvasLifecycle} from './CanvasLifecycle'
import './MiroWorkshop.css'
class PreviewBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?this.props.fallback:this.props.children}}
export function MiroCostumeAvatar({look}:{look:Wardrobe}){
 const k=look.skin,a=look.accessory,c=PAINTS[look.paint]||({'skin-spider':'#d42c47','skin-rabbit':'#eac8e1','skin-astro':'#e6eff5','skin-diver':'#269bba','skin-explorer':'#b39358','skin-dragon':'#79be78'} as Record<string,string>)[k]||'#eafaff'
 return <svg viewBox="0 0 150 172" aria-hidden="true" data-miro-skin={k} data-miro-accessory={a} data-miro-paint={look.paint}><ellipse cx="75" cy="157" rx="37" ry="9" fill="#55e6ef" opacity=".45"/>
 {a==='acc-wings'&&<path d="M44 91L10 70 18 125 45 119M106 91L140 70 132 125 105 119" fill="#b5deff" stroke="#38648c" strokeWidth="3"/>}
 {a==='acc-pack'&&<rect x="34" y="82" width="82" height="60" rx="16" fill="#bb7848"/>}
 {k==='skin-rabbit'&&<><ellipse cx="52" cy="29" rx="13" ry="27" fill={c} stroke="#936a93" strokeWidth="2"/><ellipse cx="98" cy="29" rx="13" ry="27" fill={c} stroke="#936a93" strokeWidth="2"/><ellipse cx="52" cy="29" rx="6" ry="19" fill="#f39abb"/><ellipse cx="98" cy="29" rx="6" ry="19" fill="#f39abb"/></>}
 {k==='skin-dragon'&&<><path d="M31 40L39 9 60 43M90 43L111 9 119 40" fill="#e9c46a"/><path d="M43 104L7 79 13 124 42 130M107 104L143 79 137 124 108 130" fill="#409b82"/><path d="M106 134Q139 142 137 110" stroke={c} strokeWidth="15" fill="none" strokeLinecap="round"/></>}
 <ellipse cx="75" cy="111" rx="39" ry="40" fill={c} stroke="#557890" strokeWidth="2"/><ellipse cx="35" cy="113" rx="12" ry="22" fill={k==='skin-spider'?'#2855b3':c}/><ellipse cx="115" cy="113" rx="12" ry="22" fill={k==='skin-spider'?'#2855b3':c}/><ellipse cx="56" cy="147" rx="15" ry="10" fill={k==='skin-diver'?'#ecb84a':c}/><ellipse cx="94" cy="147" rx="15" ry="10" fill={k==='skin-diver'?'#ecb84a':c}/>
 <rect x="22" y="43" width="106" height="59" rx="28" fill={c} stroke="#7198ad" strokeWidth="2"/><rect x="31" y="53" width="88" height="39" rx="20" fill={k==='skin-diver'?'#75cbdf':'#153a55'}/>
 {k==='skin-spider'?<path d="M44 61L67 68 56 84 44 78ZM106 61L83 68 94 84 106 78Z" fill="white"/>:<><ellipse cx="57" cy="71" rx="8" ry="10" fill="#a0fff3"/><ellipse cx="93" cy="71" rx="8" ry="10" fill="#a0fff3"/></>}
 <path d="M69 83Q75 87 81 83" fill="none" stroke="#a0fff3" strokeWidth="2"/>
 {k==='skin-spider'&&<g stroke="#14213c" strokeWidth="3"><ellipse cx="75" cy="115" rx="4" ry="9" fill="#14213c"/>{[0,1,2,3].map(i=><path key={i} d={'M63 '+(106+i*5)+'L75 115 87 '+(106+i*5)}/>)}</g>}
 {k==='skin-astro'&&<circle cx="75" cy="72" r="57" fill="#b2e6fb" fillOpacity=".17" stroke="#e3f9ff" strokeWidth="5"/>}
 {k==='skin-diver'&&<><rect x="31" y="54" width="88" height="40" rx="15" fill="none" stroke="#233d54" strokeWidth="5"/><path d="M120 80V35H130" fill="none" stroke="#ecb84a" strokeWidth="8" strokeLinecap="round"/></>}
 {k==='skin-explorer'&&<><ellipse cx="75" cy="48" rx="66" ry="8" fill="#8a6b48"/><path d="M42 43Q43 15 75 15T108 43Z" fill={c}/><path d="M42 43H108" stroke="#483b33" strokeWidth="6"/><path d="M44 129H106" stroke="#513d2d" strokeWidth="8"/><rect x="69" y="125" width="12" height="8" fill="#e3bd64"/></>}
 {a==='acc-headphones'&&<g stroke="#344e70" strokeWidth="5" fill="#344e70"><path d="M20 71Q20 20 75 20T130 71" fill="none"/><rect x="13" y="61" width="15" height="28" rx="7"/><rect x="122" y="61" width="15" height="28" rx="7"/></g>}
 {a==='acc-antenna'&&<><path d="M75 43V18" stroke="#354f70" strokeWidth="4"/><circle cx="75" cy="16" r="7" fill="#ffd06c"/></>}
 </svg>
}
export function MiroWorkshop({onClose}:{onClose:()=>void}){
 const store=useMiroWardrobe(),[tab,setTab]=useState<'skin'|'acc'|'paint'>('skin'),[preview,setPreview]=useState<MiroItem|null>(null),[angle,setAngle]=useState(0)
 const drag=useRef<{x:number;angle:number}|null>(null)
 const look=preview?{...store.wardrobe,[preview.id.startsWith('skin-')?'skin':preview.id.startsWith('acc-')?'accessory':'paint']:preview.id}:store.wardrobe
 const selected=preview?store.wardrobe.owned.includes(preview.id)||preview.cost===0:false
 useEffect(()=>{document.body.classList.add('miro-workshop-active');window.dispatchEvent(new Event('moymir-workshop-visibility'));return()=>{document.body.classList.remove('miro-workshop-active');window.dispatchEvent(new Event('moymir-workshop-visibility'))}},[])
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&!store.busy)onClose()};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[store.busy,onClose])
 async function apply(){if(!preview)return;const buy=!selected;if(buy&&!confirm('Купить «'+preview.label+'» за '+preview.cost+' монет?'))return;if(await store.equip(preview,buy))setPreview(null)}
 return createPortal(<div className="miro-workshop" role="dialog" aria-modal="true" aria-label="Мастерская Миро 3D"><header><div><small>ЛАБОРАТОРИЯ РОБОТОВ</small><h2>Создай своего Миро</h2></div><button disabled={store.busy} onClick={onClose}>✕ Закрыть</button></header>
 <div className="miro-workshop-status"><span>🪙 {store.connected?store.balance:'—'}</span><span>{store.parent?'Просмотр гардероба':store.ready?'Мой гардероб · '+store.wardrobe.owned.length:'Гардероб не загружен'}</span></div>
 <div className="miro-workshop-stage" data-skin={look.skin} data-accessory={look.accessory} data-paint={look.paint} onPointerDown={e=>{drag.current={x:e.clientX,angle};e.currentTarget.setPointerCapture(e.pointerId)}} onPointerMove={e=>{if(drag.current)setAngle(drag.current.angle+(e.clientX-drag.current.x)*.018)}} onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}>
 <PreviewBoundary fallback={<div className="miro-workshop-fallback"><MiroCostumeAvatar look={look}/><small>3D недоступно на этом устройстве. Показан эскиз костюма.</small></div>}><Canvas camera={{position:[0,.2,4.9],fov:39}} dpr={[1,1.35]} gl={{antialias:true,alpha:true}}><CanvasLifecycle activeInWorkshop/><ambientLight intensity={1.1}/><directionalLight position={[3,4,5]} intensity={2.5}/><directionalLight position={[-3,2,-3]} color="#89b8ff" intensity={2}/><group position={[0,-1.04,0]}><MiroModel look={look} rotation={angle}/><mesh position={[0,-.04,0]}><cylinderGeometry args={[1.0,1.08,.08,48]}/><meshStandardMaterial color="#284a67" metalness={.35} roughness={.4}/></mesh></group></Canvas></PreviewBoundary>
 <span className="miro-workshop-label">{preview?'ПРИМЕРКА':'МОЙ РОБОТ'} · {MIRO_CATALOG.find(x=>x.id===look.skin)?.label}</span>
 </div><div className="miro-workshop-turn"><button onClick={()=>setAngle(a=>a-Math.PI/4)}>↶</button><span>Проведи пальцем, чтобы повернуть</span><button onClick={()=>setAngle(a=>a+Math.PI/4)}>↷</button><button onClick={()=>setAngle(0)}>Спереди</button></div>
 <nav aria-label="Категории деталей">{(['skin','acc','paint'] as const).map((t,i)=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{['Костюмы','Детали','Цвета'][i]}</button>)}</nav>
 <div className="miro-workshop-catalog">{MIRO_CATALOG.filter(x=>x.id.startsWith(tab+'-')).map(item=>{const owned=store.wardrobe.owned.includes(item.id)||item.cost===0;const current=[store.wardrobe.skin,store.wardrobe.accessory,store.wardrobe.paint].includes(item.id);return <button key={item.id} aria-pressed={preview?.id===item.id} onClick={()=>setPreview(item)} disabled={store.busy}><span style={PAINTS[item.id]?{color:PAINTS[item.id]}:undefined}>{item.icon}</span><strong>{item.label}</strong><small>{current?'Надето':owned?'В гардеробе':'🪙 '+item.cost}</small></button>})}</div>
 <footer>{preview?<><div><strong>{preview.label}</strong><small>{preview.description}</small></div><button disabled={store.parent||!store.ready||store.busy||!selected&&store.balance<preview.cost} onClick={()=>void apply()}>{store.busy?'Сохраняем…':selected?'Надеть':'Купить · '+preview.cost+' 🪙'}</button><button className="miro-cancel" disabled={store.busy} onClick={()=>setPreview(null)}>Отмена</button></>:<small>Примерка бесплатна. Купленные детали можно менять сколько угодно. Выбранный костюм сохраняется в облаке.</small>}{!store.ready&&store.connected&&<button disabled={store.busy} onClick={()=>void store.reload()}>Обновить</button>}{store.notice&&<small role="status">{store.notice}</small>}</footer></div>,document.body)
}
