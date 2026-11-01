import {voxelToScene} from './navigation.mjs';
export function visibleBounds(v,s,body=false){
 if(body)return {min:[-.9,-.8,-.6],max:[.9,2.7,.6]};
 const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],d=v.dims;
 const selected=s.mode==='atlas'&&s.atlasIsolate&&s.region;
 for(let i=0;i<v.data.length;i++){
  let show;
  if(s.mode==='atlas'&&v.atlasLabels)show=selected?v.atlasLabels[i]===s.region:v.atlasLabels[i]>0;
  else if(s.isolate==='proposal')show=!!v.proposal[i];
  else if(s.isolate==='reference')show=!!v.reference[i];
  else if(s.isolate?.startsWith('tissue-'))show=v.tissues?.[i]===Number(s.isolate.slice(-1));
  else show=v.data[i]>(s.threshold??30);
  if(!show)continue;
  const xyz=[i%d[0],Math.floor(i/d[0])%d[1],Math.floor(i/(d[0]*d[1]))];
  // Hemisphere labels use the bundled RAS frame only.
  if(s.mode==='atlas'&&!selected&&s.hemisphere==='left'&&xyz[0]>d[0]/2)continue;
  if(s.mode==='atlas'&&!selected&&s.hemisphere==='right'&&xyz[0]<d[0]/2)continue;
  for(let a=0;a<3;a++){min[a]=Math.min(min[a],xyz[a]);max[a]=Math.max(max[a],xyz[a]);}
 }
 if(!Number.isFinite(min[0]))return {min:[-1.5,-1.5,-1.5],max:[1.5,1.5,1.5]};
 const a=voxelToScene(v,min),b=voxelToScene(v,max),extent=d.map((n,i)=>n*v.spacing[i]),largest=Math.max(...extent),padding=[v.spacing[0],v.spacing[2],v.spacing[1]].map(n=>n/largest*1.5);
 return {min:a.map((n,i)=>Math.min(n,b[i])-padding[i]),max:a.map((n,i)=>Math.max(n,b[i])+padding[i])};
}
export function fitDistance(bounds,fov,aspect,direction=[2.6,1.4,3.4]){
 const unit=a=>{const n=Math.hypot(...a)||1;return a.map(x=>x/n);};
 const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 const dot=(a,b)=>a.reduce((sum,n,i)=>sum+n*b[i],0),forward=unit(direction);
 let right=cross([0,1,0],forward);right=Math.hypot(...right)<.001?[1,0,0]:unit(right);
 const up=unit(cross(forward,right)),half=bounds.max.map((n,i)=>(n-bounds.min[i])/2),tan=Math.tan(fov*Math.PI/360);
 let distance=.08;
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
   const corner=[half[0]*x,half[1]*y,half[2]*z];
   distance=Math.max(distance,dot(corner,forward)+Math.max(Math.abs(dot(corner,right))/(tan*Math.max(.05,aspect)),Math.abs(dot(corner,up))/tan));
 }
 return distance*1.12;
}

export function cameraViewKey(volume,spatial,bodyContext=false){
 return JSON.stringify([volume.id,!!bodyContext,spatial.mode,spatial.isolate||'all',!!spatial.atlasIsolate,spatial.atlasIsolate?spatial.region:null,spatial.hemisphere||'both']);
}
