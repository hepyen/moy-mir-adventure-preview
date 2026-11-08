/** Ephemeral, per-account context for Miro's zero-cost local answers. */
export type MiroDayContext={userId:string;date:string;lessons:string[];nextDay:string;nextLessons:string[];backpack:string[];homework:{subject:string;description:string;due_date:string}[];pendingChores:number;coins:number;spiritualPoints:number;nextReward:{title:string;missing:number}|null};
let context:MiroDayContext|null=null;
export function updateMiroDayContext(value:MiroDayContext|null){context=value}
export function getMiroDayContext(userId:string,date:string){return context?.userId===userId&&context.date===date?context:null}
