import assert from 'node:assert/strict';
import {trackPoint,course} from './track.mjs';
const near=(a,b)=>assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<.001);
for(const mode of ['full','upper','lower']){
 const distances=[];
 for(let i=0;i<=1000;i++){
  const p=trackPoint(mode,i/1000);
  assert.ok(Math.abs(((p.x-course.cx)/course.rx)**2+((p.y-course.cy)/course.ry)**2-1)<.0001,'Target stays on the ellipse');
  assert.ok(p.x>=130-.001&&p.x<=870+.001&&p.y>=100-.001&&p.y<=520+.001,'Target remains inside road');
  if(mode==='upper')assert.ok(p.y<=course.cy+.001);
  if(mode==='lower')assert.ok(p.y>=course.cy-.001);
  near(trackPoint(mode,i/1000,true),trackPoint(mode,1-i/1000));
  if(i<1000){const n=trackPoint(mode,(i+1)/1000);distances.push(Math.hypot(n.x-p.x,n.y-p.y));}
 }
 assert.ok(Math.max(...distances)/Math.min(...distances)<1.01,'Speed remains even around the oval');
}
near(trackPoint('full',0),trackPoint('full',1));
near(trackPoint('upper',0),{x:130,y:310});near(trackPoint('upper',1),{x:870,y:310});
near(trackPoint('lower',0),{x:130,y:310});near(trackPoint('lower',1),{x:870,y:310});
assert.equal(trackPoint('full',.25).y,100);assert.equal(trackPoint('full',.75).y,520);
assert.throws(()=>trackPoint('__proto__',.5),/Unknown/);assert.throws(()=>trackPoint('full',NaN),/finite/);
console.log('Oval checks passed: true ellipse, half routes, endpoints, even speed, continuity, reverse and validation.');
