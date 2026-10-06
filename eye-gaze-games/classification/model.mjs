export const INTERVAL=5000;
export const CATEGORIES=Object.freeze({animal:'動物',plant:'植物',object:'死物'});
export const FEATURES=Object.freeze({
 animal:'會成長、活動和叫，對外界刺激有反應。',
 plant:'會成長，不會像動物自行走動或發出叫聲。',
 object:'不會成長，也不會自己活動或回應呼喚。'
});
export const ITEMS=Object.freeze([
 {id:'cat',name:'貓',category:'animal'},{id:'dog',name:'狗',category:'animal'},{id:'bird',name:'小鳥',category:'animal'},
 {id:'flower',name:'花朵',category:'plant'},{id:'tree',name:'樹木',category:'plant'},{id:'cactus',name:'仙人掌',category:'plant'},
 {id:'toy',name:'玩具車',category:'object'},{id:'ball',name:'皮球',category:'object'},{id:'chair',name:'椅子',category:'object'}
]);
export function deck(random=Math.random){
 const order=ITEMS.map(x=>x.id);
 for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 return order;
}
export function begin(target,order,now){
 const valid=Array.isArray(order)?order.filter(id=>ITEMS.some(item=>item.id===id)):[];
 return {target:Object.hasOwn(CATEGORIES,target)?target:'animal',order:valid.length?valid:deck(),index:0,deadline:now+INTERVAL,running:true,answered:false,feedback:null};
}
export function tick(state,now){
 return !state.running||now<state.deadline?state:advance(state,now);
}
export function respond(state){
 if(!state.running||state.answered)return state;
 const item=ITEMS.find(x=>x.id===state.order[state.index]);
 return {...state,answered:true,feedback:{correct:item.category===state.target,item:item.id,category:item.category,name:item.name,features:FEATURES[item.category]}};
}
export function pause(state){return {...state,running:false};}
export function resume(state,now){return {...state,running:true,deadline:now+INTERVAL};}

export function advance(state,now){return {...state,index:(state.index+1)%state.order.length,deadline:now+INTERVAL,answered:false,feedback:null,running:true};}
