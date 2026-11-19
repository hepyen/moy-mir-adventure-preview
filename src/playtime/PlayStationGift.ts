/** Existing family-store reward. Match its immutable UUID, even if a parent renames it. */
export const PLAYSTATION_30_REWARD_ID='604c860d-2121-4abc-a2ad-af3385b2c882'
export const PLAYSTATION_30_MINUTES=30
export const madridDay=(date:Date)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)
export function playStationClaimedToday(requests:ReadonlyArray<{reward_id?:string;requested_at?:string}>,now=new Date()){
 const day=madridDay(now)
 return requests.some(r=>{
  if(r.reward_id!==PLAYSTATION_30_REWARD_ID||!r.requested_at)return false
  const created=new Date(r.requested_at)
  return Number.isFinite(created.getTime())&&madridDay(created)===day
 })
}
export function formatAccumulatedTime(minutes:number){
 const amount=Math.max(0,Math.trunc(minutes))
 if(amount<60)return `${amount} мин`
 const hours=Math.floor(amount/60),rem=amount%60
 return rem?`${hours} ч ${rem} мин`:`${hours} ч`
}
