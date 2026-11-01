import test from 'node:test';import assert from 'node:assert/strict';
import {encodeMask,decodeMask,emptyArchive,addView,restoreView,prunedArchive} from '../src/view-snapshots.mjs';
const volume=()=>({id:'test',dims:[16,8,8],spacing:[1,1,1],data:new Uint8Array(1024),proposal:new Uint8Array(1024),reference:new Uint8Array(1024)});
const state=()=>({position:{sagittal:2,coronal:3,axial:4},axis:'axial',spatial:{mode:'solid',region:53,cut:true,pitch:25,yaw:35},settings:{colorMap:'gray'},camera:{position:[2,1,3],target:[.2,0,.1]},layout:'anatomy'});
test('sparse and dense masks survive compact encoding byte for byte',()=>{
 for(const mask of [new Uint8Array(1024),new Uint8Array(1024).fill(1),Uint8Array.from({length:1024},(_,i)=>i%2),Uint8Array.from({length:1024},(_,i)=>i===501?1:0)])assert.deepEqual(decodeMask(encodeMask(mask),mask.length),mask);
 assert.equal(encodeMask(Uint8Array.from({length:1024},(_,i)=>i%2)).encoding,'bits');assert.equal(encodeMask(new Uint8Array(1024)).encoding,'runs');
 assert.throws(()=>decodeMask({encoding:'runs',length:1024,data:[1000,40]},1024));
});
test('snapshot is independent of later camera, slice and mask edits and safely rejects another study',()=>{
 const v=volume(),a=emptyArchive(),s=state();v.proposal[400]=1;v.reference[401]=1;v.roiProvenance={target:'original'};
 const id=addView(a,v,s);s.position.axial=7;s.camera.position[0]=99;v.proposal.fill(0);v.reference.fill(0);v.roiProvenance.target='changed';
 const r=restoreView(a,id,v);assert.equal(r.state.position.axial,4);assert.equal(r.state.camera.position[0],2);assert.equal(r.proposal[400],1);assert.equal(r.reference[401],1);assert.equal(r.metadata.roiProvenance.target,'original');
 assert.throws(()=>restoreView(a,id,{...v,id:'other'}));assert.throws(()=>restoreView(a,id,{...v,spacing:[2,1,1]}));
});
test('shared mask content is deduplicated and only referenced views are persisted',()=>{
 const v=volume(),a=emptyArchive(),first=addView(a,v,state()),second=addView(a,v,state());assert.equal(Object.keys(a.masks).length,1);
 const trimmed=prunedArchive(a,[{snapshotId:first}],[]);assert.deepEqual(Object.keys(trimmed.views),[first]);assert.equal(Object.keys(trimmed.masks).length,1);assert.ok(!trimmed.views[second]);
 const serialized=JSON.parse(JSON.stringify(trimmed));assert.deepEqual(restoreView(serialized,first,v).proposal,v.proposal);
});

test('a camera from another rendering context cannot silently restore into a saved view',()=>{
 const v=volume(),a=emptyArchive(),s=state();s.camera.viewKey='wrong renderer context';const id=addView(a,v,s);assert.throws(()=>restoreView(a,id,v),/camera context/);
});
