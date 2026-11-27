import {Capacitor,registerPlugin} from '@capacitor/core'
export type TvState={pairedIp:string;exactAllowed:boolean;state:string;session:string;end:number;message:string}
export const tv=registerPlugin<{execute(args:{ip:string;command:'pair'|'off'|'source'}):Promise<{accepted:boolean}>;timerStatus():Promise<TvState>;armTimer(args:{session:string;ip:string;end:number}):Promise<TvState>;cancelTimer(args:{session:string}):Promise<TvState>}>('FamilyTv')
export async function tvState():Promise<TvState|null>{if(!Capacitor.isNativePlatform()||!Capacitor.isPluginAvailable('FamilyTv'))return null;try{return await tv.timerStatus()}catch{return null}}
