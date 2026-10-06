import assert from 'node:assert/strict';
import {CATEGORIES,ITEMS,INTERVAL,begin,tick,respond,pause,resume,deck} from './model.mjs';
assert.equal(INTERVAL,5000);
assert.equal(ITEMS.length,9);
for(const category of Object.keys(CATEGORIES)){
 assert.equal(ITEMS.filter(x=>x.category===category).length,3);
 const order=ITEMS.map(x=>x.id),state=begin(category,order,100);
 assert.equal(state.deadline,5100);
 assert.equal(tick(state,5099),state,'No change before five seconds');
 const changed=tick(state,5100);assert.equal(changed.index,1);assert.equal(changed.deadline,10100);
 for(const item of ITEMS){
  const s=begin(category,[item.id],0),result=respond(s);
  assert.equal(result.feedback.correct,item.category===category);
  assert.equal(result.feedback.item,item.id);
  assert.equal(respond(result),result,'One response per image');
  assert.equal(tick(result,5000).answered,false,'Next image accepts a fresh response');
  assert.equal(tick(result,5000).feedback,null,'Old feedback clears when the picture changes');
 }
 const stopped=pause(state);assert.equal(tick(stopped,9000),stopped);assert.equal(respond(stopped),stopped);
 assert.equal(resume(stopped,20000).deadline,25000,'Resume grants a full five seconds');
}
const d=deck(()=>.5);assert.deepEqual([...d].sort(),ITEMS.map(x=>x.id).sort());assert.equal(new Set(d).size,9);
assert.equal(begin('bad',[],0).target,'animal');assert.equal(begin('bad',[],0).order.length,9);
let s=begin('animal',['cat','flower'],0);s=tick(s,5000);assert.equal(s.index,1);s=tick(s,10000);assert.equal(s.index,0);
s=tick(s,90000);assert.equal(s.index,1,'Long delay advances once instead of flashing missed images');
console.log('Classification checks: three categories, five seconds, correct/wrong, one response, pause/resume and balanced deck.');
