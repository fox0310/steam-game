import assert from 'node:assert/strict';
import {arcPoint,course} from './track.mjs';
const near=(a,b)=>assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.001);
near(arcPoint(0),{x:150,y:460});near(arcPoint(.5),{x:500,y:110});near(arcPoint(1),{x:850,y:460});
const distances=[];
for(let i=0;i<=1000;i++){
 const p=arcPoint(i/1000);assert.ok(p.y<=course.cy+.001);assert.ok(Math.abs(Math.hypot(p.x-course.cx,p.y-course.cy)-course.radius)<.001);
 if(i<1000){const q=arcPoint((i+1)/1000);assert.ok(q.x>=p.x);distances.push(Math.hypot(q.x-p.x,q.y-p.y));}
}
assert.ok(Math.max(...distances)/Math.min(...distances)<1.0001);
assert.throws(()=>arcPoint(NaN),/finite/);
console.log('Sun/moon arc passed: true upper semicircle, left-to-right, bounds and even speed.');
