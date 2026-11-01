import test from 'node:test';
import assert from 'node:assert/strict';
import {atlasReference,binaryOverlap} from '../src/atlas-reference.mjs';
test('atlas reference targets exactly the selected source label and puts seed inside it',()=>{
 const v={dims:[3,2,1],atlasLabels:new Uint16Array([0,17,0,53,17,0]),atlas:{regions:[{id:17,name:'left hippocampus',centroid:[0,0,0]}]}};
 const r=atlasReference(v,17);assert.deepEqual([...r.mask],[0,1,0,0,1,0]);assert.deepEqual(r.seed,[1,0,0]);assert.throws(()=>atlasReference(v,53));
});
test('slice agreement reports empty masks explicitly and never conflates 2D and 3D',()=>{
 assert.deepEqual(binaryOverlap([1,1,0],[0,1,1]),{reference:2,proposal:2,intersection:1,dice:.5});assert.equal(binaryOverlap([0],[0]).dice,null);assert.throws(()=>binaryOverlap([1],[]));
});
