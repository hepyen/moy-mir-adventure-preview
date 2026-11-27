import {useEffect,useRef} from 'react'
import './SectionNav.css'
export type SectionItem={id:string;label:string;icon:string}
export function SectionNav({label,items,value,onChange}:{label:string;items:SectionItem[];value:string;onChange:(id:string)=>void}){
 const root=useRef<HTMLDivElement>(null)
 useEffect(()=>{const active=root.current?.querySelector<HTMLElement>('button[aria-pressed=true]');if(!active||!root.current)return;const rail=root.current;const r=active.getBoundingClientRect(),p=rail.getBoundingClientRect();if(r.left<p.left||r.right>p.right)rail.scrollLeft+=r.left-p.left-(p.width-r.width)/2},[value])
 return <div className="mw-section-nav-wrap"><div className="mw-section-nav-title">{label}<small>{items.length>3?'Листайте →':''}</small></div><div ref={root} className="mw-section-nav" role="group" aria-label={label}>{items.map(item=><button type="button" key={item.id} aria-pressed={value===item.id} onClick={()=>onChange(item.id)}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}</div></div>
}
