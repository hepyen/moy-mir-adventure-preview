export type Tab = 'world' | 'tasks' | 'shop' | 'family' | 'spiritual' | 'settings' | 'school' | 'health';
export type ReviewKind = 'daily' | 'task' | 'proposal' | 'reward' | 'spiritual' | 'playtime' | 'meal';
export type NotificationPayload = {kind?:string; source_id?:string; section?:string};
export type Destination = {tab:Tab; anchor?:string; fallback?:string; kitchen?:boolean};

const reviewSections:Record<ReviewKind,Destination>={
 daily:{tab:'tasks',fallback:'review-tasks'},
 task:{tab:'tasks',fallback:'review-tasks'},
 proposal:{tab:'tasks',fallback:'review-proposals'},
 reward:{tab:'shop',fallback:'review-rewards'},
 spiritual:{tab:'spiritual',fallback:'review-spiritual'},
 playtime:{tab:'shop',fallback:'review-playtime'},
 meal:{tab:'health',fallback:'review-meals',kitchen:true},
};
const reviewEvents:Partial<Record<string,ReviewKind>>={
 daily_submitted:'daily',daily_review:'daily',
 task_submitted:'task',task_review:'task',
 proposal_sent:'proposal',proposal_review:'proposal',
 reward_requested:'reward',reward_review:'reward',
 spiritual_requested:'spiritual',spiritual_review:'spiritual',
 playtime_requested:'playtime',playtime_review:'playtime',
 meal_requested:'meal',meal_review:'meal',
};
const otherEvents:Partial<Record<string,Destination>>={
 chat_message:{tab:'family'},child_app_open:{tab:'world'},
 app_update:{tab:'settings',anchor:'app-updates'},update_available:{tab:'settings',anchor:'app-updates'},
 task_created:{tab:'tasks',fallback:'review-tasks'},
 points_deducted:{tab:'tasks',anchor:'behavior-history'},points_returned:{tab:'tasks',anchor:'behavior-history'},
};

export function reviewAnchor(kind:ReviewKind,id:string){return 'review-'+kind+'-'+id}

export function reviewDestination(kind:ReviewKind,id?:string):Destination{
 const section=reviewSections[kind];
 return id?{...section,anchor:reviewAnchor(kind,id)}:{...section,anchor:section.fallback};
}

export function notificationDestination({kind,source_id,section}:NotificationPayload):Destination|null{
 const review=kind&&Object.hasOwn(reviewEvents,kind)?reviewEvents[kind]:undefined;
 if(review)return reviewDestination(review,typeof source_id==='string'?source_id:undefined);
 if(kind&&Object.hasOwn(otherEvents,kind))return otherEvents[kind]??null;
 if(section==='health'||section==='school'||section==='spiritual'||section==='shop')return {tab:section};
 if(section==='updates')return {tab:'settings',anchor:'app-updates'};
 return null;
}
