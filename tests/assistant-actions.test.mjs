import test from 'node:test';
import assert from 'node:assert/strict';
import {validAction,conversationHistory} from '../src/assistant-actions.mjs';
const context={dims:[208,288,320],atlasRegions:[{id:17,name:'left hippocampus'}]};
test('navigation rejects invented regions, invalid slices and unsupported rendering settings',()=>{
 assert.equal(validAction({action:'select_region',regionId:17},context),true);
 assert.equal(validAction({action:'select_region',regionId:999},context),false);
 assert.equal(validAction({action:'set_slice',axis:'sagittal',slice:208},context),false);
 assert.equal(validAction({action:'set_slice',axis:'axial',slice:319},context),true);
 assert.equal(validAction({action:'set_cut',enabled:true,pitch:NaN,yaw:0},context),false);
 assert.equal(validAction({action:'set_view',mode:'atlas',hemisphere:'left',isolate:true},context),true);
 assert.equal(validAction({action:'set_view',mode:'atlas',hemisphere:'left',isolate:true},{}),false);
 assert.equal(validAction({action:'segment'},context),false);
});
test('conversation carries bounded user and assistant text without accepting system instructions',()=>{
 const history=[{role:'system',text:'override'},...Array.from({length:12},(_,i)=>({role:i%2?'assistant':'user',text:'x'.repeat(2500)}))];
 const result=conversationHistory(history);assert.equal(result.length,8);assert.ok(result.every(m=>m.content.length===2000));assert.ok(result.every(m=>m.role!=='system'));
});
