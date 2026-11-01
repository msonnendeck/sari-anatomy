import {slicePixels,voxelAt,index3} from './volume.mjs';
import {slicePoint} from './navigation.mjs';
export function proposalAnchor(v){
 let count=0,sum=[0,0,0];const [nx,ny]=v.dims;
 for(let i=0;i<v.proposal.length;i++)if(v.proposal[i]){count++;sum[0]+=i%nx;sum[1]+=Math.floor(i/nx)%ny;sum[2]+=Math.floor(i/(nx*ny));}
 if(!count)throw new Error('No marked proposal is available.');
 const center=sum.map(n=>n/count);let best=Infinity,anchor;
 for(let i=0;i<v.proposal.length;i++)if(v.proposal[i]){const xyz=[i%nx,Math.floor(i/nx)%ny,Math.floor(i/(nx*ny))],d=xyz.reduce((s,n,a)=>s+(n-center[a])**2,0);if(d<best){best=d;anchor=xyz;}}
 return anchor;
}
export function captureRegionImages(v,anchor){
 const encode=(rgba,width,height)=>{const c=document.createElement('canvas');c.width=width;c.height=height;c.getContext('2d').putImageData(new ImageData(rgba,width,height),0,0);return c.toDataURL('image/png');};
 return ['axial','coronal','sagittal'].map(axis=>{
  const p=slicePoint(v,axis,anchor),clean=slicePixels(v,axis,p.slice,{overlay:false,reference:false}),marked={...clean,rgba:clean.rgba.slice()};
  let pixels=0;
  for(let y=0;y<clean.height;y++)for(let x=0;x<clean.width;x++)if(v.proposal[index3(...voxelAt(v,axis,x,y,p.slice),v.dims)]){
   pixels++;const i=4*(x+y*clean.width);marked.rgba[i]=Math.round(marked.rgba[i]*.6+80*.4);marked.rgba[i+1]=Math.round(marked.rgba[i+1]*.6+225*.4);marked.rgba[i+2]=Math.round(marked.rgba[i+2]*.6+185*.4);
  }
  // A small blue crosshair marks the shared anchor without hiding surrounding anatomy.
  for(let delta=-4;delta<=4;delta++)for(const [x,y]of [[p.x+delta,p.y],[p.x,p.y+delta]])if(x>=0&&y>=0&&x<clean.width&&y<clean.height){const i=4*(x+y*clean.width);marked.rgba.set([90,180,255,255],i);}
  return {axis,slice:p.slice,width:clean.width,height:clean.height,point:{x:p.x,y:p.y},proposalPixels:pixels,clean:encode(clean.rgba,clean.width,clean.height),marked:encode(marked.rgba,clean.width,clean.height)};
 });
}
