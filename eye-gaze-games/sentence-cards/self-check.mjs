import assert from 'node:assert/strict';
import {SCENARIOS,WORDS,start,act,isCorrect} from './model.mjs';
let state=start('water');
for(const word of ['drink','self','want'])state=act(state,{type:'choose',word});
assert.equal(isCorrect(state),false,'Wrong order must not pass');
state=act(state,{type:'reset'});
for(const word of ['self','want','drink'])state=act(state,{type:'choose',word});
assert.equal(isCorrect(state),true,'I want water must pass in correct order');
assert.equal(act(state,{type:'submit'}).phase,'complete');
assert.deepEqual(act(state,{type:'choose',word:'drink'}).chosen,state.chosen,'No duplicate card');
assert.deepEqual(act(state,{type:'choose',word:'toilet'}).chosen,state.chosen,'Only current scenario words');
state=act(state,{type:'remove',index:1});assert.deepEqual(state.chosen,['self','drink']);assert.equal(state.phase,'practice');
state=act(state,{type:'undo'});assert.deepEqual(state.chosen,['self']);
for(const scenario of SCENARIOS){let s=start(scenario.id);assert.equal(isCorrect(s),false);s=act(s,{type:'demo'});assert.deepEqual(s.chosen,scenario.words);assert.equal(s.phase,'demo');assert.equal(isCorrect(s),true);s=act(s,{type:'reset'});for(const word of scenario.words)s=act(s,{type:'choose',word});assert.equal(act(s,{type:'submit'}).phase,'complete');for(const word of scenario.words)assert(WORDS[word]);}
assert.equal(start('bad').scenario,'water');assert.equal(act(start('water'),{type:'submit'}).phase,'practice');
assert.deepEqual(act(start('water'),{type:'remove',index:-1}).chosen,[]);
console.log('Sentence checks passed: four contexts, order, correction, no duplicates, demonstration and reset.');
