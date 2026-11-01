import test from 'node:test';import assert from 'node:assert/strict';
import {visibleBounds,fitDistance} from '../src/camera-framing.mjs';
const v={dims:[8,10,12],spacing:[1,2,3],data:new Uint8Array(960).fill(150),proposal:new Uint8Array(960),reference:new Uint8Array(960),atlasLabels:new Uint16Array(960)};
v.proposal[3+8*(4+10*5)]=1;v.atlasLabels[3+8*(4+10*5)]=53;
test('camera frames the selected mask and recovers whole-volume extent when isolation changes',()=>{
 const roi=visibleBounds(v,{mode:'solid',isolate:'proposal'}),whole=visibleBounds(v,{mode:'solid',isolate:'all'}),atlas=visibleBounds(v,{mode:'atlas',atlasIsolate:true,region:53});
 assert.deepEqual(roi,atlas);assert.ok(fitDistance(whole,40,1)>fitDistance(roi,40,1)*3);
 assert.ok(roi.min.every((n,i)=>Number.isFinite(n)&&n<roi.max[i]));
});
test('fitting accounts for portrait aspect and remains finite for empty masks and body context',()=>{
 const box=visibleBounds(v,{isolate:'reference'});
 assert.ok(fitDistance(box,40,.5)>fitDistance(box,40,2));
 assert.ok(Number.isFinite(fitDistance(visibleBounds(v,{},true),40,1)));
});
