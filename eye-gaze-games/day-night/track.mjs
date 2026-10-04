export const course=Object.freeze({cx:500,cy:460,radius:350,width:1000,height:720});
export const arcPath='M150 460 A350 350 0 0 1 850 460';
export function arcPoint(progress){
 if(!Number.isFinite(progress))throw new Error('Progress must be finite');
 const angle=Math.PI*(1-Math.max(0,Math.min(1,progress)));
 return{x:course.cx+course.radius*Math.cos(angle),y:course.cy-course.radius*Math.sin(angle)};
}
