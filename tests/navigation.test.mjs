import test from 'node:test';
import assert from 'node:assert/strict';
import {cutNormal,dot,voxelToUnit,unitToVoxel,planeOffset,anchorOnPlane,cutIntersection,voxelToScene,sceneToVoxel,pickVolumeVoxel} from '../src/navigation.mjs';
import {intensityColor} from '../src/display.mjs';
const v={dims:[97,115,81],spacing:[.75,1,1.4]};
test('navigation round trips preserve voxel locations in anisotropic 3D and all slice projections',()=>{
 for(const xyz of [[0,0,0],[96,114,80],[12,70,53]]){
  assert.deepEqual(unitToVoxel(v,voxelToUnit(v,xyz)),xyz);
  assert.deepEqual(sceneToVoxel(v,voxelToScene(v,xyz)),xyz);
 }
});
test('oblique cut anchor lies within one voxel of the true plane, including near volume edges',()=>{
 for(const [pitch,yaw,offset] of [[0,0,.2],[25,70,-.15],[-65,120,.3],[40,-45,.65]]){
  const s={pitch,yaw,offset},xyz=anchorOnPlane(v,[20,65,70],s),error=Math.abs(planeOffset(v,xyz,s)-offset);
  assert.ok(error<.015,`${pitch}/${yaw}: ${error}`);assert.ok(xyz.every((x,i)=>x>=0&&x<v.dims[i]));
 }
});
test('intersection traces reproduce the same plane and handle parallel/coplanar scans',()=>{
 const s={pitch:25,yaw:35,offset:.1};
 const result=cutIntersection(v,'axial',40,s);assert.equal(result.points.length,2);
 for(const[u,t]of result.points){const xyz=[u*v.dims[0]-.5,v.dims[1]-.5-t*v.dims[1],40];assert.ok(Math.abs(dot(cutNormal(s),voxelToUnit(v,xyz))-.1)<1e-9);}
 const offset=planeOffset(v,[0,42,0],{pitch:0,yaw:0});
 assert.equal(cutIntersection(v,'coronal',42,{pitch:0,yaw:0,offset}).coplanar,true);
 assert.equal(cutIntersection(v,'coronal',41,{pitch:0,yaw:0,offset}),null);
});
test('volume point picking ignores background, clipping and mask-excluded voxels',()=>{
 const v={dims:[4,4,4],spacing:[1,1,1],data:new Uint8Array(64),reference:new Uint8Array(64),proposal:new Uint8Array(64)};
 v.data[2+4*(1+4*2)]=120;
 const s={pitch:0,yaw:0,offset:0,cut:false,isolate:'all',threshold:30};
 assert.deepEqual(pickVolumeVoxel(v,[.125,.125,2],[0,0,-1],s),[2,1,2]);
 assert.equal(pickVolumeVoxel(v,[.125,.125,2],[0,0,-1],{...s,isolate:'reference'}),null);
 assert.equal(pickVolumeVoxel(v,[.125,.125,2],[0,0,-1],{...s,cut:true,offset:-.2}),null);
});
test('display controls change color and contrast while clamping valid output',()=>{
 assert.deepEqual(intensityColor(105,{window:210,level:105}),[127.5,127.5,127.5]);
 assert.notDeepEqual(intensityColor(105,{colorMap:'ice'}),intensityColor(105));
 const c=intensityColor(200,{contrast:3,gain:4});assert.ok(c.every(n=>n>=0&&n<=255));
});
