export function atlasReference(volume, regionId) {
  const region=volume.atlas?.regions.find(r=>r.id===regionId);
  if(!region || !volume.atlasLabels) throw new Error('Select a source atlas structure first.');
  const mask=new Uint8Array(volume.atlasLabels.length);
  let nearest=null,best=Infinity;
  const [nx,ny]=volume.dims;
  for(let i=0;i<mask.length;i++) if(volume.atlasLabels[i]===regionId){
    mask[i]=1;const xyz=[i%nx,Math.floor(i/nx)%ny,Math.floor(i/(nx*ny))];
    const d=xyz.reduce((sum,n,a)=>sum+(n-region.centroid[a])**2,0);
    if(d<best){best=d;nearest=xyz;}
  }
  if(!nearest) throw new Error('No source voxels exist for this structure.');
  return {mask,seed:nearest,region};
}
export function binaryOverlap(a,b) {
  if(a.length!==b.length) throw new Error('Mask sizes must match.');
  let reference=0,proposal=0,intersection=0;
  for(let i=0;i<a.length;i++){if(a[i])reference++;if(b[i])proposal++;if(a[i]&&b[i])intersection++;}
  return {reference,proposal,intersection,dice:reference+proposal?2*intersection/(reference+proposal):null};
}
