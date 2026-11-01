import {slicePoint} from './navigation.mjs';
import {sliceSize,voxelAt,index3} from './volume.mjs';
export const roiAxes=['axial','coronal','sagittal'];
export function validBox(box,width,height,point) {
 return box && ['left','top','right','bottom'].every(k=>Number.isInteger(box[k])) && box.left>=0 && box.top>=0 && box.right<=width && box.bottom<=height && box.left<box.right && box.top<box.bottom && (!point || point.x>=box.left&&point.x<box.right&&point.y>=box.top&&point.y<box.bottom);
}
export function seedViews(volume,xyz) {
 if(!xyz?.every((n,i)=>Number.isInteger(n)&&n>=0&&n<volume.dims[i])) throw new Error('Select a valid 3D seed first.');
 return roiAxes.map(axis=>{
  const p=slicePoint(volume,axis,xyz),[width,height]=sliceSize(volume,axis);
  let left=width,top=height,right=0,bottom=0;
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(volume.proposal[index3(...voxelAt(volume,axis,x,y,p.slice),volume.dims)]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1);}
  const painted=right>left && p.x>=left&&p.x<right&&p.y>=top&&p.y<bottom;
  const box=painted?{left,top,right,bottom}:{left:Math.max(0,p.x-24),top:Math.max(0,p.y-24),right:Math.min(width,p.x+25),bottom:Math.min(height,p.y+25)};
  return {axis,slice:p.slice,width,height,point:{x:p.x,y:p.y},box,promptSource:painted?'existing proposal bounds; may include prior manual/SAM output':'seed-centered starting box'};
 });
}
export function mergeRoi(volume,frames) {
 const mask=new Uint8Array(volume.data.length),seen=new Uint8Array(mask.length),positive=new Uint8Array(mask.length);
 let conflicts=0,compared=0;
 const keys=new Set();
 for(const f of frames){
  if(!roiAxes.includes(f.axis) || !Number.isInteger(f.slice) || keys.has(`${f.axis}:${f.slice}`)) throw new Error('Invalid or duplicate ROI plane.');
  keys.add(`${f.axis}:${f.slice}`);
  const max=volume.dims[{sagittal:0,coronal:1,axial:2}[f.axis]], [w,h]=sliceSize(volume,f.axis);
  if(f.slice<0||f.slice>=max||f.width!==w||f.height!==h||!Array.isArray(f.mask)||f.mask.length!==w*h||f.mask.some(n=>n!==0&&n!==1))throw new Error('Invalid ROI mask; existing proposal preserved.');
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=index3(...voxelAt(volume,f.axis,x,y,f.slice),volume.dims);seen[i]++;if(f.mask[x+y*w])positive[i]++;
  }
 }
 for(let i=0;i<mask.length;i++){
  if(seen[i]>1){compared++;if(positive[i]>0&&positive[i]<seen[i])conflicts++;}
  // Conservative cross-plane consensus where predictions overlap; no filling unobserved voxels.
  mask[i]=seen[i]>0&&positive[i]===seen[i]?1:0;
 }
 return {mask,conflicts,compared,planeCount:frames.length,voxels:mask.reduce((a,b)=>a+b,0)};
}
