import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import * as nifti from 'nifti-reader-js';
const info=JSON.parse(readFileSync('public/data/spl-atlas/atlas.json'));
const models=gunzipSync(readFileSync('public/data/spl-atlas/surfaces.bin.gz'));
const labels=gunzipSync(readFileSync('public/data/spl-atlas/labels.u16.gz'));
const np=models.readUInt32LE(0),ni=models.readUInt32LE(4);
const pos=new Float32Array(models.buffer,models.byteOffset+8,np);
const indices=new Uint32Array(models.buffer,models.byteOffset+8+np*4,ni);
test('SPL image, labels and surface ranges retain their declared coordinate frame',()=>{
 const b=gunzipSync(readFileSync('public/data/spl-atlas/t1.nii.gz'));const h=nifti.readHeader(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
 assert.deepEqual(h.dims.slice(1,4),[208,288,320]);assert.deepEqual(h.pixDims.slice(1,4),[.75,.75,.75]);
 assert.deepEqual(h.affine,[[.75,0,0,-77.625],[0,.75,0,-107.625],[0,0,.75,-119.625],[0,0,0,1]]);
 assert.equal(labels.length,208*288*320*2);assert.equal(info.regions.length,90);
 assert.ok(ni/3>1600000);assert.equal(models.length,8+np*4+ni*4);
 for(const r of info.regions){assert.ok(r.indexCount>0&&r.indexCount%3===0);assert.ok(r.indexStart+r.indexCount<=ni);assert.ok(r.centroid.every((n,i)=>n>=0&&n<info.dims[i]));}
 for(const i of indices)assert.ok(i<np/3);
});
test('left/right hippocampus and ventricle surfaces agree with physical-space-resampled labels',()=>{
 const d=info.dims,max=Math.max(...d);
 for(const id of[17,53,4,43]){
  const r=info.regions.find(r=>r.id===id),vertices=new Set(indices.subarray(r.indexStart,r.indexStart+r.indexCount));let matching=0;
  for(const i of vertices){
   const v=[pos[i*3]*max/3+d[0]/2,-pos[i*3+2]*max/3+d[1]/2,pos[i*3+1]*max/3+d[2]/2].map(Math.round);let ok=false;
   for(let z=-1;z<=1;z++)for(let y=-1;y<=1;y++)for(let x=-1;x<=1;x++){const q=[v[0]+x,v[1]+y,v[2]+z];if(q.every((v,a)=>v>=0&&v<d[a])&&labels.readUInt16LE(2*(q[0]+d[0]*(q[1]+d[1]*q[2])))===id)ok=true;}
   if(ok)matching++;
  }
  assert.ok(matching/vertices.size>.97,`${r.name} surface and label alignment`);
 }
 assert.ok(info.regions.find(r=>r.id===17).centroid[0]<d[0]/2);
 assert.ok(info.regions.find(r=>r.id===53).centroid[0]>d[0]/2);
});
