import React,{Component,useMemo,useState} from 'react';
import {MiroRobot} from '../../legacyWorld/MiroRobot';
import './WorldSafe.css';
import {useMiroWardrobe,MIRO_CATALOG} from '../../legacyWorld/miroWardrobe';
import {ownedMechLooks} from '../../legacyWorld/MiroModel';
import {MECH_MODELS} from '../../legacyWorld/MiroMech';
function canUseWebGL():boolean{
 try{const canvas=document.createElement('canvas');const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');if(!gl)return false;gl.getExtension('WEBGL_lose_context')?.loseContext();return true}catch{return false}
}
function WorldFallback({worldNumber,points,spiritualPoints,soundEnabled,userId}:{worldNumber:1|2|3|4;points:number;spiritualPoints:number;soundEnabled:boolean;userId:string}){
 const {wardrobe,ready}=useMiroWardrobe();const robots=ready?ownedMechLooks(wardrobe):[];
 const ratio=Math.min(100,Math.max(0,points/1600*100));
 return <section className="mw-world-fallback" aria-label="Упрощённый режим игрового мира">
  <div className="mw-world-fallback-label">🌍 {worldNumber===1?'Домик на поляне':worldNumber===2?'Домик на дереве':worldNumber===3?'Космос':'Подводная станция'} · 2D-режим</div>
  <div className="mw-world-fallback-scene">
   <div className="mw-world-fallback-cloud">☁️</div>
   {worldNumber===4?<><div className="mw-world-fallback-treehouse">🌊</div><div className="mw-world-fallback-house">🐠</div></>:worldNumber===3?<><div className="mw-world-fallback-treehouse">🪐</div><div className="mw-world-fallback-house">🚀</div></>:worldNumber===1?<><div className="mw-world-fallback-tree">{points>=280?'🌳':points>=200?'🌱':'🌿'}</div>{points>=400&&<div className="mw-world-fallback-house">🏠</div>}{points>=120&&<div className="mw-world-fallback-dog">🐕</div>}</>:<><div className="mw-world-fallback-treehouse">🌳</div>{points>=400&&<div className="mw-world-fallback-house">🏡</div>}{points>=120&&<div className="mw-world-fallback-dog">🐿️</div>}</>}
   <div className="mw-world-fallback-miro"><MiroRobot worldPoints={points} spiritualPoints={spiritualPoints} soundEnabled={soundEnabled} userId={userId}/></div>
  </div>
  {!!robots.length&&<div className="mw-world-fallback-robots" aria-label="Купленные роботы"><small>Купленные роботы · в 2D показаны исходные модели. Для движения и экипировки включи 3D.</small><div>{robots.map(r=><figure key={r.skin}><img src={import.meta.env.BASE_URL+'miro/mechs/'+MECH_MODELS[r.skin]+'.jpg'} alt=""/><figcaption>{MIRO_CATALOG.find(x=>x.id===r.skin)?.label}</figcaption></figure>)}</div></div>}
  <div className="mw-world-fallback-meter"><span style={{width:ratio+'%'}}/></div>
  <p><strong>{points} / 1600 очков</strong> · Постройки и достижения сохраняются. Упрощённая графика; верни 3D, если устройство поддерживает её.</p>
 </section>;
}
class RendererBoundary extends Component<{children:React.ReactNode;worldNumber:1|2|3|4;points:number;spiritualPoints:number;soundEnabled:boolean;userId:string},{error:boolean}>{
 state={error:false};
 static getDerivedStateFromError(){return {error:true}}
 componentDidCatch(error:Error){console.warn('3D-renderer unavailable. Switching to safe view:',error.message)}
 render(){const {worldNumber,points,spiritualPoints,soundEnabled,userId}=this.props;return this.state.error?<WorldFallback worldNumber={worldNumber} points={points} spiritualPoints={spiritualPoints} soundEnabled={soundEnabled} userId={userId}/>:this.props.children}
}
export function WorldSafe({worldNumber,points,spiritualPoints,soundEnabled,userId='guest',children}:{worldNumber:1|2|3|4;points:number;spiritualPoints:number;soundEnabled:boolean;userId?:string;children:React.ReactNode}){
 const [allowed]=useState(canUseWebGL);
 const [economy,setEconomy]=useState(()=>{try{return localStorage.getItem('moymir-world-economy')==='1'}catch{return false}});
 const key=useMemo(()=>worldNumber+':'+(allowed&&!economy?'3D':'2D'),[allowed,worldNumber,economy]);
 function toggle(){const v=!economy;setEconomy(v);try{localStorage.setItem('moymir-world-economy',v?'1':'0')}catch{}}
 return <><div className="mw-render-mode"><span>{!allowed?'3D недоступно':economy?'Экономичный режим · 2D':'Обычный режим · 3D'}</span>{allowed&&<button type="button" aria-pressed={economy} onClick={toggle}>{economy?'Включить 3D':'Экономить заряд'}</button>}</div>{!allowed||economy?<WorldFallback worldNumber={worldNumber} points={points} spiritualPoints={spiritualPoints} soundEnabled={soundEnabled} userId={userId}/>:<RendererBoundary key={key} worldNumber={worldNumber} points={points} spiritualPoints={spiritualPoints} soundEnabled={soundEnabled} userId={userId}>{children}</RendererBoundary>}</>;
}
