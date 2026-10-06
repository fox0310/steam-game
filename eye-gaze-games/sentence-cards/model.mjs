export const WORDS=Object.freeze({self:{text:'我'},want:{text:'想'},go:{text:'去'},drink:{text:'飲水'},toilet:{text:'廁所'},need:{text:'需要'},help:{text:'幫忙'},rest:{text:'休息'}});
export const SCENARIOS=Object.freeze([
 {id:'water',label:'飲水',cue:'口渴了，想飲水。',words:['self','want','drink'],icon:'drink'},
 {id:'toilet',label:'如廁',cue:'想去廁所，怎樣告訴老師？',words:['self','want','go','toilet'],icon:'toilet'},
 {id:'rest',label:'休息',cue:'有點累了，想休息。',words:['self','want','rest'],icon:'rest'},
 {id:'help',label:'求助',cue:'遇到困難，需要成人幫忙。',words:['self','need','help'],icon:'help'}
]);
export const scenarioFor=id=>SCENARIOS.find(s=>s.id===id)||SCENARIOS[0];
export const start=id=>({scenario:scenarioFor(id).id,chosen:[],phase:'practice'});
export function isCorrect(state){const target=scenarioFor(state.scenario).words;return state.chosen.length===target.length&&target.every((word,i)=>word===state.chosen[i]);}
export function act(state,action){
 if(action.type==='reset')return start(state.scenario);
 if(action.type==='demo')return{...state,chosen:[...scenarioFor(state.scenario).words],phase:'demo'};
 if(action.type==='submit')return{...state,phase:isCorrect(state)?'complete':'practice'};
 if(action.type==='choose'){
  if(state.phase==='demo'||!scenarioFor(state.scenario).words.includes(action.word)||state.chosen.includes(action.word))return state;
  return{...state,chosen:[...state.chosen,action.word],phase:'practice'};
 }
 if(action.type==='remove'&&Number.isInteger(action.index)&&action.index>=0&&action.index<state.chosen.length)return{...state,chosen:state.chosen.filter((_,i)=>i!==action.index),phase:'practice'};
 if(action.type==='undo')return{...state,chosen:state.chosen.slice(0,-1),phase:'practice'};
 return state;
}
