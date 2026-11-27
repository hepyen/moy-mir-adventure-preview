import {useEffect,useRef} from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
export function CheckinMap({latitude,longitude,accuracy}:{latitude:number;longitude:number;accuracy:number}){
 const host=useRef<HTMLDivElement>(null)
 useEffect(()=>{if(!host.current)return;const center:L.LatLngTuple=[latitude,longitude];const map=L.map(host.current,{scrollWheelZoom:false,attributionControl:true}).setView(center,15);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);const circle=L.circle(center,{radius:Math.max(5,accuracy),color:'#287cc2',fillOpacity:.16}).addTo(map);L.circleMarker(center,{radius:7,color:'#fff',weight:2,fillColor:'#267bc4',fillOpacity:1}).addTo(map);map.fitBounds(circle.getBounds(),{maxZoom:17,padding:[25,25]});const resize=new ResizeObserver(()=>map.invalidateSize());resize.observe(host.current);return()=>{resize.disconnect();map.remove()}},[latitude,longitude,accuracy])
 return <div ref={host} aria-label="Карта отправленной позиции и радиус точности" style={{height:280,borderRadius:12,overflow:'hidden',background:'#d9e6e8',position:'relative',zIndex:0}}/>
}
