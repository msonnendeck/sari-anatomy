import test from 'node:test';
import assert from 'node:assert/strict';
import {expandMask} from '../server/sam-mask.mjs';
test('SAM cropped raster is placed at its bounds rather than stretched across the MRI slice',()=>{
 assert.deepEqual([...expandMask([1,0,1,1],{left:1,top:1,right:3,bottom:3},4,4)],[0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0]);
 assert.throws(()=>expandMask([1],{left:3,top:0,right:5,bottom:1},4,4));
 assert.throws(()=>expandMask([1],{left:0,top:0,right:2,bottom:2},4,4));
});
