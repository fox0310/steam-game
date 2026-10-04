export const course = Object.freeze({ left:270, right:730, cy:347, radius:224, width:1000, height:618.8 });
const quarter = Math.PI * course.radius / 2;
const straight = course.right - course.left;
const halfLength = 2 * quarter + straight;
export const paths = {
  upper: 'M46 347 A224 224 0 0 1 270 123 H730 A224 224 0 0 1 954 347',
  lower: 'M46 347 A224 224 0 0 0 270 571 H730 A224 224 0 0 0 954 347',
  full: 'M46 347 A224 224 0 0 1 270 123 H730 A224 224 0 0 1 954 347 A224 224 0 0 1 730 571 H270 A224 224 0 0 1 46 347'
};
function halfPoint(distance, lower) {
  const sign = lower ? -1 : 1;
  let angle, cx;
  if (distance <= quarter) { cx=course.left; angle=Math.PI + sign*distance/course.radius; }
  else if (distance <= quarter+straight) return {x:course.left+distance-quarter,y:course.cy-sign*course.radius};
  else { cx=course.right; angle=(lower ? Math.PI/2 : Math.PI*1.5) + sign*(distance-quarter-straight)/course.radius; }
  return {x:cx+course.radius*Math.cos(angle), y:course.cy+course.radius*Math.sin(angle)};
}
export function trackPoint(mode, progress, reverse=false) {
  if (!Object.hasOwn(paths,mode)) throw new Error('Unknown track mode');
  if (!Number.isFinite(progress)) throw new Error('Progress must be finite');
  let p=Math.max(0,Math.min(1,progress));
  if(reverse) p=1-p;
  if(mode==='upper') return halfPoint(p*halfLength,false);
  if(mode==='lower') return halfPoint(p*halfLength,true);
  const distance=p*halfLength*2;
  return distance<=halfLength ? halfPoint(distance,false) : halfPoint(halfLength*2-distance,true);
}
