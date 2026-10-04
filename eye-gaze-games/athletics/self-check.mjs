import assert from 'node:assert/strict';
import { trackPoint, course } from './track.mjs';
const near = (a,b) => assert.ok(Math.hypot(a.x-b.x,a.y-b.y)<0.001);
for (const mode of ['full','upper','lower']) {
  if(mode==='full') near(trackPoint(mode,0),trackPoint(mode,1));
  for (let i=0;i<=1000;i++) {
    const p=trackPoint(mode,i/1000);
    assert.ok(p.x>=40 && p.x<=960 && p.y>=120 && p.y<=580);
    if(mode==='upper') assert.ok(p.y<=course.cy+0.001);
    if(mode==='lower') assert.ok(p.y>=course.cy-0.001);
    const next=trackPoint(mode,Math.min(1,(i+1)/1000));
    assert.ok(Math.hypot(next.x-p.x,next.y-p.y)<9,'No jump between frames');
    near(trackPoint(mode,i/1000,true),trackPoint(mode,1-i/1000));
  }
}
assert.ok(trackPoint('full',0.25).y<course.cy);
assert.ok(trackPoint('full',0.75).y>course.cy);
near(trackPoint('upper',1),{x:course.right+course.radius,y:course.cy});
near(trackPoint('lower',1),{x:course.right+course.radius,y:course.cy});
assert.throws(()=>trackPoint('invalid',0),/Unknown/);
assert.throws(()=>trackPoint('full',NaN),/finite/);
console.log('Track checks passed: bounds, half routes, continuity, direction and invalid inputs.');
