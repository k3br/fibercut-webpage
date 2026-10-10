import { sampleJourney } from './customer-scene.js';

const turns = [
  [.27,.29,.40,.42],
  [.655,.675,.755,.78],
  [.775,.80,1,1.02], // keep the stair climb at walking pace
  [.875,.90,1,1.02] // extra room for the final turn on the landing
];
function ramp(p,a,b) {
  const t=Math.max(0,Math.min(1,(p-a)/(b-a)));
  return t*t*(3-2*t);
}
export function turnWeight(p) {
  return 1+2*turns.reduce((sum,[a,b,c,d])=>sum+ramp(p,a,b)-ramp(p,c,d),0);
}

// Allocate scrolling by actual camera motion, rather than uneven keyframe
// timestamps. Rotation and zoom also consume distance, avoiding fast turns
// when the camera translates only a few centimetres around a close-up.
const count=4096;
const distances=new Float64Array(count+1);
const tangents=new Float64Array(count+1);
let previous=sampleJourney(0);
for(let i=1;i<=count;i++) {
  const p=i/count,frame=sampleJourney(p);
  const movement=Math.hypot(...frame.position.map((value,axis)=>value-previous.position[axis]));
  const rotation=Math.hypot((frame.yaw-previous.yaw)*Math.cos((frame.pitch+previous.pitch)/2),frame.pitch-previous.pitch);
  const lens=Math.abs(frame.zoom-previous.zoom);
  const motion=Math.hypot(movement,rotation*4,lens*3);
  distances[i]=distances[i-1]+Math.max(motion,1e-6)*turnWeight((i-.5)/count);
  previous=frame;
}
const total=distances[count];
for(let i=0;i<=count;i++)distances[i]/=total;
for(let i=0;i<=count;i++) {
  const left=i>0?1/count/(distances[i]-distances[i-1]):0;
  const right=i<count?1/count/(distances[i+1]-distances[i]):0;
  if(i===0)tangents[i]=right;
  else if(i===count)tangents[i]=left;
  else {
    const a=distances[i]-distances[i-1],b=distances[i+1]-distances[i];
    tangents[i]=3*(a+b)/((2*b+a)/left+(b+2*a)/right);
  }
}
export function scrollToJourney(scroll) {
  if(scroll<=0)return 0;
  if(scroll>=1)return 1;
  let low=0,high=count;
  while(high-low>1) {
    const middle=(low+high)>>1;
    if(distances[middle]<scroll)low=middle;else high=middle;
  }
  const h=distances[high]-distances[low],t=(scroll-distances[low])/h,t2=t*t,t3=t2*t;
  return (2*t3-3*t2+1)*low/count+(t3-2*t2+t)*h*tangents[low]
    +(-2*t3+3*t2)*high/count+(t3-t2)*h*tangents[high];
}
