import test from 'node:test';import assert from 'node:assert/strict';
import {seedViews,validBox,mergeRoi} from '../src/roi.mjs';
import {validFrame} from '../server/roi-api.mjs';
import {voxelAt,index3,sliceSize} from '../src/volume.mjs';
const volume=()=>({dims:[5,6,7],data:new Uint8Array(210),proposal:new Uint8Array(210)});
test('shared seed projects to exact original voxel across all three flipped image planes',()=>{
 const v=volume(),xyz=[1,2,3];
 for(const f of seedViews(v,xyz)){
  assert.deepEqual(voxelAt(v,f.axis,f.point.x,f.point.y,f.slice),xyz);
  assert.ok(validBox(f.box,f.width,f.height,f.point));
 }
 assert.throws(()=>seedViews(v,[9,2,3]));
});
test('existing proposal bounds are used only if they contain the selected seed',()=>{
 const v=volume();v.proposal[index3(1,2,3,v.dims)]=1;
 const f=seedViews(v,[1,2,3])[0];assert.equal(f.box.right-f.box.left,1);assert.match(f.promptSource,/existing proposal/);
});
test('ROI reconstructs exact observed voxels, excludes disagreement, and never fills unsampled space',()=>{
 const v=volume(),xyz=[1,2,3],frames=seedViews(v,xyz).map(f=>({...f,mask:Array(f.width*f.height).fill(0)}));
 for(const f of frames)f.mask[f.point.x+f.width*f.point.y]=1;
 let r=mergeRoi(v,frames);assert.equal(r.voxels,1);assert.equal(r.mask[index3(...xyz,v.dims)],1);assert.equal(r.conflicts,0);
 frames[0].mask.fill(0);r=mergeRoi(v,frames);assert.equal(r.voxels,0);assert.equal(r.conflicts,1);
 assert.throws(()=>mergeRoi(v,[frames[0],frames[0]]));assert.throws(()=>mergeRoi(v,[{...frames[0],mask:[1]}]));
});
test('server rejects out-of-image boxes, missing seed, oversized media and unsupported plane input',()=>{
 const f={...seedViews(volume(),[1,2,3])[0],image:'data:image/png;base64,AA=='};
 assert.equal(validFrame(f),true);assert.equal(validFrame({...f,axis:'cloud'}),false);
 assert.equal(validFrame({...f,box:{left:0,top:0,right:999,bottom:5}}),false);
 assert.equal(validFrame({...f,point:{x:-1,y:0}}),false);
 assert.equal(validFrame({...f,image:'https://example.com/image.png'}),false);
});
