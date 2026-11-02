import test from 'node:test';import assert from 'node:assert/strict';
import {questionViews} from '../src/question-views.mjs';
const volume={dims:[20,30,40]},spatial={pitch:0,yaw:0},media={anchor:[3,7,11]};
test('reviewed image question retains original view and exact shared crosshair slices',()=>{
 const calls=[];const result=questionViews(overrides=>{calls.push(overrides);return `view-${calls.length}`;},volume,'axial',spatial,media);
 assert.equal(result.error,null);assert.equal(result.questionSnapshotId,'view-1');assert.equal(result.imageSnapshotId,'view-2');
 assert.deepEqual(calls[1].position,{sagittal:3,coronal:7,axial:11});assert.deepEqual(calls[1].point,{axis:'axial',x:3,y:22,slice:11});
});
test('snapshot failure is returned without interrupting the reviewed-question send path',()=>{
 const result=questionViews(()=>{throw new Error('Snapshot unavailable');},volume,'axial',spatial,media);
 assert.equal(result.questionSnapshotId,null);assert.equal(result.imageSnapshotId,null);assert.equal(result.error.message,'Snapshot unavailable');
 let n=0;const partial=questionViews(()=>{if(n++)throw new Error('Image snapshot unavailable');return 'question-view';},volume,'axial',spatial,media);
 assert.equal(partial.questionSnapshotId,'question-view');assert.equal(partial.imageSnapshotId,null);assert.ok(partial.error);
});
