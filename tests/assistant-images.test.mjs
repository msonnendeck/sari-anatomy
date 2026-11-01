import test from 'node:test';import assert from 'node:assert/strict';
import {assistantImageContent} from '../server/assistant-images.mjs';import {proposalAnchor} from '../src/region-images.mjs';
const context={dims:[8,9,10]},png='data:image/png;base64,AA==';
const media=()=>({selectionBasis:'proposal',anchor:[2,3,4],frames:[{axis:'axial',slice:4,width:8,height:9},{axis:'coronal',slice:3,width:8,height:10},{axis:'sagittal',slice:2,width:9,height:10}].map(f=>({...f,clean:png,marked:png}))});
test('questions without opt-in media contain no image blocks',()=>{
 const c=assistantImageContent('What is this?',context,null);assert.equal(c.length,1);assert.equal(JSON.parse(c[0].text).imagesAttached,false);
});
test('reviewed question carries six paired clean/marked images and matching plane metadata',()=>{
 const c=assistantImageContent('Explain the marked region',context,media());assert.equal(c.filter(p=>p.type==='image_url').length,6);const m=JSON.parse(c[0].text);assert.deepEqual(m.imageContext.anchor,[2,3,4]);assert.equal(m.imagesAttached,true);
 const bad=media();bad.frames[0].slice=6;assert.throws(()=>assistantImageContent('x',context,bad));
 const remote=media();remote.frames[0].clean='https://example.com/private';assert.throws(()=>assistantImageContent('x',context,remote));
});
test('proposal focus lies inside the marked volume even for disconnected regions',()=>{
 const v={dims:[5,5,5],proposal:new Uint8Array(125)};v.proposal[0]=1;v.proposal[124]=1;
 const a=proposalAnchor(v);assert.equal(v.proposal[a[0]+5*(a[1]+5*a[2])],1);assert.throws(()=>proposalAnchor({...v,proposal:new Uint8Array(125)}));
});
