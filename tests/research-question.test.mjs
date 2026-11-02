import test from 'node:test';import assert from 'node:assert/strict';
import {installResearchQuestionRoute} from '../server/research-question.mjs';
function route(output='What published research describes hippocampal spatial-memory functions and MRI correlates?'){
 let handler,request;installResearchQuestionRoute({post:(path,fn)=>{assert.equal(path,'/api/research-question');handler=fn;}},()=>({chat:{completions:{create:async body=>{request=body;return {choices:[{message:{content:output}}]};}}}}),()=> 'test-muse');
 return {run:async body=>{let status=200,result;await handler({body},{status(n){status=n;return this;},json(data){result=data;}});return {status,result,request};}};
}
test('Muse drafts from the original question and answer without claiming absent images',async()=>{
 const {status,result,request}=await route().run({question:'What functions does this have?',answer:'Tentatively hippocampal; identity requires review.',context:{dims:[2,2,2]}});
 assert.equal(status,200);assert.ok(result.query);const content=JSON.parse(request.messages[1].content[0].text);assert.equal(content.context.priorAnswer,'Tentatively hippocampal; identity requires review.');assert.equal(content.imagesAttached,false);assert.match(request.messages[0].content,/hypotheses/);
});
test('drafting retains all six approved images and their shared focus',async()=>{
 const media={selectionBasis:'crosshair',anchor:[1,1,1],frames:['axial','coronal','sagittal'].map(axis=>({axis,slice:1,width:2,height:2,point:{x:1,y:0},clean:'data:image/png;base64,AA==',marked:'data:image/png;base64,AQ=='}))};
 const {status,request}=await route().run({question:'What is this region?',answer:'Uncertain anatomical identity.',context:{dims:[2,2,2]},media});assert.equal(status,200);assert.equal(request.messages[1].content.filter(b=>b.type==='image_url').length,6);assert.equal(JSON.parse(request.messages[1].content[0].text).imagesAttached,true);
});
test('invalid attachments and unusable drafts cannot silently launch a search',async()=>{
 assert.equal((await route().run({question:'Q',answer:'A',media:{}})).status,400);
 assert.equal((await route('x'.repeat(801)).run({question:'Q',answer:'A',context:{}})).status,502);
});
