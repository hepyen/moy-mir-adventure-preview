import {createContext} from 'react'
export const RoomCloudContext=createContext<{family:string;child:string;parent:boolean;balance:number;refresh:()=>void}|null>(null)
