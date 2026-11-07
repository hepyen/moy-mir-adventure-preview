export type RewardScene='game'|'movie'|'mystery'|'money'|'walk'|'dessert'|'board'|'music'|'family'|'time'|'gift'
export function sceneForReward(id:number,title:string):RewardScene {
 const known:Record<number,RewardScene>={1:'game',2:'movie',3:'mystery',4:'money',5:'walk',6:'dessert',7:'board',8:'music',9:'family',10:'time'}
 if(known[id]) return known[id]
 const t=title.toLowerCase()
 if(/playstation|игр|геймпад/.test(t))return 'game'
 if(/фильм|кино/.test(t))return 'movie'
 if(/деньг|€|евро/.test(t))return 'money'
 if(/прогул|парк/.test(t))return 'walk'
 return 'gift'
}
