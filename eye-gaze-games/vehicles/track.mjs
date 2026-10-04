export const course=Object.freeze({cx:500,cy:310,rx:370,ry:210,width:1000,height:620});
export const paths={
 upper:'M130 310 A370 210 0 0 1 870 310',
 lower:'M130 310 A370 210 0 0 0 870 310',
 full:'M130 310 A370 210 0 0 1 870 310 A370 210 0 0 1 130 310'
};
// Arc-length lookup keeps the vehicle at an even speed through the bends.
const samples=1024,lengths=[0];
for(let i=1;i<=samples;i++){
 const a=(i-1)*Math.PI/samples,b=i*Math.PI/samples;
 lengths.push(lengths[i-1]+Math.hypot(course.rx*(Math.cos(b)-Math.cos(a)),course.ry*(Math.sin(b)-Math.sin(a))));
}
function halfPoint(progress,lower){
 const distance=progress*lengths[samples];let lo=0,hi=samples;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(lengths[mid]<distance)lo=mid;else hi=mid;}
 const theta=(lo+(distance-lengths[lo])/(lengths[hi]-lengths[lo]))*Math.PI/samples;
 return{x:course.cx-course.rx*Math.cos(theta),y:course.cy+(lower?1:-1)*course.ry*Math.sin(theta)};
}
export function trackPoint(mode,progress,reverse=false){
 if(!Object.hasOwn(paths,mode))throw new Error('Unknown track mode');
 if(!Number.isFinite(progress))throw new Error('Progress must be finite');
 let p=Math.max(0,Math.min(1,progress));if(reverse)p=1-p;
 if(mode==='upper')return halfPoint(p,false);
 if(mode==='lower')return halfPoint(p,true);
 return p<=.5?halfPoint(p*2,false):halfPoint((1-p)*2,true);
}
