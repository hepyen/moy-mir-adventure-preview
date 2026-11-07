type Coord=[number,number,number]
const GROUND:Coord[]=[
 [2.25,0,.37],[2.04,0,.83],[1.85,0,.89],
 [1.68,0,.65],[2.2,0,-.35],[1.95,0,-.85],
 [1.22,0,-1.02],[.65,0,-.82],[.85,0,.38],
 [.45,0,1.15],[-.32,0,1.73],[-1.0,0,1.53],
 [-1.48,0,1.36],[-1.05,0,1.63],[-.3,0,1.74],
 [.56,0,1.19],[1.34,0,.91],[2.25,0,.37]
]
const BENCH:Coord[]=[
 ...GROUND.slice(0,12),[-1.37,0,1.32],[-1.64,.20,1.18],
 [-1.9,.57,1.09],[-1.9,.57,1.09],
 [-1.54,.57,1.06],[-1.9,.57,1.09],
 [-1.64,.2,1.18],[-1.37,0,1.32],
 ...GROUND.slice(13)
]
export function dogPathPosition(progress:number,points:number):Coord{
 const route=points>=1100?BENCH:GROUND
 const phase=((progress%1)+1)%1*(route.length-1)
 const index=Math.min(route.length-2,Math.floor(phase))
 const a=route[index],b=route[index+1],t=phase-index
 return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]
}
