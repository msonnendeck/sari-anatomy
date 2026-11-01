const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export function cutNormal(spatial) {
  const p = spatial.pitch * Math.PI / 180, y = spatial.yaw * Math.PI / 180;
  return [Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)];
}
export const dot = (a, b) => a.reduce((sum, n, i) => sum + n * b[i], 0);
export function voxelToUnit(v, xyz) {
  return [(xyz[0]+.5)/v.dims[0]-.5, (xyz[2]+.5)/v.dims[2]-.5, .5-(xyz[1]+.5)/v.dims[1]];
}
export function unitToVoxel(v, p) {
  return [p[0]+.5, .5-p[2], p[1]+.5].map((n,i) => clamp(Math.round(n*v.dims[i]-.5),0,v.dims[i]-1));
}
export function slicePoint(v, axis, xyz) {
  const [x,y,z]=xyz;
  return axis === "axial" ? {axis,x,y:v.dims[1]-1-y,slice:z} : axis === "coronal" ? {axis,x,y:v.dims[2]-1-z,slice:y} : {axis,x:y,y:v.dims[2]-1-z,slice:x};
}
export function planeOffset(v, xyz, spatial) { return dot(cutNormal(spatial),voxelToUnit(v,xyz)); }
export function voxelToScene(v, xyz) {
  const extent=v.dims.map((n,i)=>n*v.spacing[i]),max=Math.max(...extent), p=voxelToUnit(v,xyz);
  return [p[0]*extent[0],p[1]*extent[2],p[2]*extent[1]].map(n=>n/max*3);
}
export function sceneToVoxel(v,p) {
  const extent=v.dims.map((n,i)=>n*v.spacing[i]),max=Math.max(...extent);
  return unitToVoxel(v,[p[0]*max/3/extent[0],p[1]*max/3/extent[2],p[2]*max/3/extent[1]]);
}
export function pickVolumeVoxel(v,origin,direction,spatial) {
  let start=0,end=Infinity;
  for(let a=0;a<3;a++){
    if(Math.abs(direction[a])<1e-10){if(Math.abs(origin[a])>.5)return null;continue;}
    const a0=(-.5-origin[a])/direction[a],a1=(.5-origin[a])/direction[a];
    start=Math.max(start,Math.min(a0,a1));end=Math.min(end,Math.max(a0,a1));
  }
  if(end<start)return null;
  const normal=cutNormal(spatial),step=.5/Math.max(...v.dims);
  for(let t=start;t<=end;t+=step){
    const p=origin.map((n,i)=>n+t*direction[i]);
    if(spatial.cut&&dot(normal,p)>spatial.offset)continue;
    const xyz=unitToVoxel(v,p),i=xyz[0]+v.dims[0]*(xyz[1]+v.dims[1]*xyz[2]);
    if(spatial.isolate==="reference"&&!v.reference[i]||spatial.isolate==="proposal"&&!v.proposal[i])continue;
    if(spatial.isolate?.startsWith("tissue-")&&v.tissues?.[i]!==Number(spatial.isolate.slice(-1)))continue;
    if(v.data[i]>(spatial.threshold??30)||(spatial.isolate??"all")!=="all")return xyz;
  }
  return null;
}
export function cutRange(v, spatial) {
  const n=cutNormal(spatial), d=[v.dims[0],v.dims[2],v.dims[1]];
  return n.reduce((sum,x,i)=>sum+Math.abs(x)*(.5-.5/d[i]),0);
}
// Closest point to the navigation anchor on the plane within voxel-center bounds.
// The clamped Lagrange-multiplier solution also works near box corners.
export function anchorOnPlane(v, xyz, spatial) {
  const n=cutNormal(spatial), a=voxelToUnit(v,xyz), dims=[v.dims[0],v.dims[2],v.dims[1]], range=cutRange(v,spatial);
  const offset=clamp(spatial.offset,-range,range);
  const at=(lambda)=>a.map((x,i)=>clamp(x+lambda*n[i],-.5+.5/dims[i],.5-.5/dims[i]));
  let lo=-4,hi=4;
  for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(dot(n,at(mid))<offset)lo=mid;else hi=mid;}
  return unitToVoxel(v,at((lo+hi)/2));
}
export function cutIntersection(v, axis, slice, spatial) {
  const n=cutNormal(spatial), d=v.dims;
  const point=(u,t)=>voxelToUnit(v,axis==="axial"?[u*d[0]-.5,d[1]-.5-t*d[1],slice]:axis==="coronal"?[u*d[0]-.5,slice,d[2]-.5-t*d[2]]:[slice,u*d[1]-.5,d[2]-.5-t*d[2]]);
  const p=point(0,0), q=point(1,0), r=point(0,1), a=dot(n,q)-dot(n,p), b=dot(n,r)-dot(n,p), c=dot(n,p)-spatial.offset;
  const epsilon=1e-7;
  if(Math.abs(a)+Math.abs(b)<epsilon)return Math.abs(c)<epsilon?{coplanar:true}:null;
  const hits=[];
  const add=(x,y)=>{if(x>=-epsilon&&x<=1+epsilon&&y>=-epsilon&&y<=1+epsilon&&!hits.some(([u,t])=>Math.hypot(u-x,t-y)<epsilon))hits.push([clamp(x,0,1),clamp(y,0,1)]);};
  if(Math.abs(b)>epsilon){add(0,-c/b);add(1,-(a+c)/b);}
  if(Math.abs(a)>epsilon){add(-c/a,0);add(-(b+c)/a,1);}
  return hits.length>=2?{points:hits.slice(0,2)}:null;
}
