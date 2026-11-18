/** Authored routes stay on the island, skirting both houses, the pond, and the tree trunk. */
export type MiroWaypoint={x:number;z:number;hold?:number;home?:boolean}
export const MEADOW_ROUTE:readonly MiroWaypoint[]=[
 {x:-2.36,z:1.53,hold:1.1},{x:-1.62,z:1.86},{x:-.77,z:1.91},
 {x:.18,z:1.94,hold:2.4,home:true},{x:.55,z:1.93},{x:-.35,z:1.93},
 {x:-1.30,z:1.91},{x:-2.29,z:1.61},{x:-2.47,z:.68},
 {x:-2.40,z:-.22},{x:-2.33,z:-.78,hold:1.5},{x:-2.47,z:.68},
 {x:-2.36,z:1.53}
]
export const TREEHOUSE_ROUTE:readonly MiroWaypoint[]=[
 {x:-2.38,z:1.48,hold:1.0},{x:-1.83,z:1.92},{x:-.93,z:1.94},
 {x:.08,z:1.96},{x:1.20,z:1.96,hold:2.3,home:true},
 {x:1.91,z:1.91},{x:2.44,z:1.48},{x:2.48,z:.55},
 {x:2.37,z:-.48},{x:1.91,z:-1.42},{x:.93,z:-1.84},
 {x:-.11,z:-1.90},{x:-1.19,z:-1.78},{x:-2.23,z:-1.20},
 {x:-2.46,z:-.24},{x:-2.38,z:1.48}
]
export function miroRoute(worldNumber:number):readonly MiroWaypoint[]{return worldNumber===2?TREEHOUSE_ROUTE:MEADOW_ROUTE}
export function routeStones(worldNumber:number):{x:number;z:number;angle:number}[]{
 const route=miroRoute(worldNumber),tiles:{x:number;z:number;angle:number}[]=[]
 for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i]
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)
  if(len<.22)continue
  // One coherent path underneath each route segment, no randomly scattered stones.
  const count=Math.max(1,Math.floor(len/.33))
  for(let j=0;j<count;j++){
   const f=(j+.5)/count
   tiles.push({x:a.x+dx*f,z:a.z+dz*f,angle:Math.atan2(dx,dz)})
  }
 }
 return tiles
}
