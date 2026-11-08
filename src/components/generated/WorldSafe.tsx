import React,{Component,useMemo,useState} from 'react';
import {MiroRobot} from '../../legacyWorld/MiroRobot';
import './WorldSafe.css';
function canUseWebGL():boolean{
 try{const canvas=document.createElement('canvas');return !!(canvas.getContext('webgl2')||canvas.getContext('webgl'))}catch{return false}
}
function WorldFallback({worldNumber,points,spiritualPoints,soundEnabled,userId}:{worldNumber:1|2;points:number;spiritualPoints:number;soundEnabled:boolean;userId:string}){
 const ratio=Math.min(100,Math.max(0,points/1600*100));
 return <section className="mw-world-fallback" aria-label="Упрощённый режим игрового мира">
  <div className="mw-world-fallback-label">🌍 {worldNumber===1?'Домик на поляне':'Домик на дереве'} · 2D-режим</div>
  <div className="mw-world-fallback-scene">
   <div className="mw-world-fallback-cloud">☁️</div>
   {worldNumber===1?<><div className="mw-world-fallback-tree">{points>=280?'🌳':points>=200?'🌱':'🌿'}</div>{points>=400&&<div className="mw-world-fallback-house">🏠</div>}{points>=120&&<div className="mw-world-fallback-dog">🐕</div>}</>:<><div className="mw-world-fallback-treehouse">🌳</div>{points>=400&&<div className="mw-world-fallback-house">🏡</div>}{points>=120&&<div className="mw-world-fallback-dog">🐿️</div>}</>}
   <div className="mw-world-fallback-miro"><MiroRobot worldPoints={points} spiritualPoints={spiritualPoints} soundEnabled={soundEnabled} userId={userId}/></div>
  </div>
  <div className="mw-world-fallback-meter"><span style={{width:ratio+'%'}}/></div>
  <p><strong>{points} / 1600 очков</strong> · Постройки и достижения сохраняются. Объёмная графика недоступна на этом устройстве.</p>
 </section>;
}
class RendererBoundary extends Component<{children:React.ReactNode;worldNumber:1|2;points:number;spiritualPoints:number;soundEnabled:boolean;userId:string},{error:boolean}>{
 state={error:false};
 static getDerivedStateFromError(){return {error:true}}
 componentDidCatch(error:Error){console.warn('3D-renderer unavailable. Switching to safe view:',error.message)}
 render(){const {worldNumber,points,spiritualPoints,soundEnabled,userId}=this.props;return this.state.error?<WorldFallback worldNumber={worldNumber} points={points} spiritualPoints={spiritualPoints} soundEnabled={soundEnabled} userId={userId}/>:this.props.children}
}
export function WorldSafe({worldNumber,points,spiritualPoints,soundEnabled,userId='guest',children}:{worldNumber:1|2;points:number;spiritualPoints:number;soundEnabled:boolean;userId?:string;children:React.ReactNode}){
 const [allowed]=useState(canUseWebGL);
 const key=useMemo(()=>worldNumber+':'+(allowed?'3D':'2D'),[allowed,worldNumber]);
 if(!allowed)return <WorldFallback worldNumber={worldNumber} points={points} spiritualPoints={spiritualPoints} soundEnabled={soundEnabled} userId={userId}/>;
 return <RendererBoundary key={key} worldNumber={worldNumber} points={points} spiritualPoints={spiritualPoints} soundEnabled={soundEnabled} userId={userId}>{children}</RendererBoundary>;
}
