// Allocate three times as much scrolling to turns as to the straight route.
// Smooth ramps avoid abrupt speed changes at the edges of either object.
const turns = [
  [.27, .29, .40, .42], // balcony: approach, turn along facade, turn away
  [.655, .675, .755, .78] // carport: roof detail and turn towards stairs
];

function integratedRamp(p, start, end) {
  if (p <= start) return 0;
  const width = end - start;
  if (p >= end) return p - end + width / 2;
  const t = (p - start) / width;
  return width * (t*t*t - t*t*t*t / 2);
}

function scrollDistance(p) {
  let distance = p;
  for (const [a,b,c,d] of turns) {
    distance += 2 * (integratedRamp(p,a,b) - integratedRamp(p,c,d));
  }
  return distance;
}

const totalDistance = scrollDistance(1);
export function scrollToJourney(scroll) {
  if (scroll <= 0) return 0;
  if (scroll >= 1) return 1;
  const distance = scroll * totalDistance;
  let low = 0, high = 1;
  for (let i=0;i<32;i++) {
    const middle = (low + high) / 2;
    if (scrollDistance(middle) < distance) low = middle;
    else high = middle;
  }
  return (low + high) / 2;
}

// Exact critically damped spring. Preserve velocity when new scroll input
// arrives, instead of restarting an exponential lerp on every wheel/touch step.
export function advanceScroll(state, target, seconds) {
  const frequency = 18;
  const offset = state.position-target;
  const impulse = state.velocity+frequency*offset;
  const decay = Math.exp(-frequency*seconds);
  state.position = target+(offset+impulse*seconds)*decay;
  state.velocity = (state.velocity-frequency*impulse*seconds)*decay;
  if (state.position < 0 || state.position > 1) {
    state.position = Math.max(0,Math.min(1,state.position));
    state.velocity = 0;
  }
  return state.position;
}
