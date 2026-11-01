export const displayDefaults={gain:1,contrast:1,colorMap:"gray",volumeOpacity:.15,quality:"balanced",jitter:0,background:"theme"};
const clamp=(v)=>Math.max(0,Math.min(1,v));
export function colorSample(t,map="gray") {
  t=clamp(t);
  const stops=map==="ice"?[[0,0,0],[0,60,220],[0,220,255],[255,255,255]]:map==="amber"?[[0,0,0],[140,30,0],[255,180,25],[255,255,235]]:[[0,0,0],[255,255,255]];
  const q=t*(stops.length-1),i=Math.min(stops.length-2,Math.floor(q)),f=q-i;
  return stops[i].map((n,j)=>n*(1-f)+stops[i+1][j]*f);
}
export function intensityColor(value,settings={}) {
  const t=clamp((value-((settings.level??105)-(settings.window??210)/2))/(settings.window??210));
  return colorSample(clamp(((t-.5)*(settings.contrast??1)+.5)*(settings.gain??1)),settings.colorMap);
}
