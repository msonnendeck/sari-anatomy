import test from 'node:test';import assert from 'node:assert/strict';import {groundedBlocks} from '../server/evidence.mjs';
const response=()=>({status:'completed',output:[{type:'web_search_call',status:'completed'},{type:'message',content:[{type:'output_text',text:'A research finding.',annotations:[{type:'url_citation',url:'https://pubmed.ncbi.nlm.nih.gov/123/',title:'Example paper',start_index:0,end_index:18}]}]}]});
test('literature requires actual completed search and valid annotated source spans',()=>{
 const r=response();assert.equal(groundedBlocks(r)[0].citations.length,1);
 assert.throws(()=>groundedBlocks({...r,output:r.output.slice(1)}));
 r.output[1].content[0].annotations[0].end_index=900;assert.throws(()=>groundedBlocks(r));
});
test('literature refuses javascript and private links rather than rendering model-invented sources',()=>{
 for(const url of ['javascript:alert(1)','http://example.com','https://127.0.0.1/file','https://user:secret@example.com']){
  const r=response();r.output[1].content[0].annotations[0].url=url;assert.throws(()=>groundedBlocks(r));
 }
});

test('literature retries a missing-citation response once, preserving the exact query',async()=>{
 const {installEvidenceRoute}=await import('../server/evidence.mjs');let handler,calls=[];
 const unlinked=response();unlinked.output[1].content[0].annotations=[];
 installEvidenceRoute({post:(p,h)=>handler=h},()=>({responses:{create:async request=>{calls.push(request);return calls.length===1?unlinked:response();}}}),()=> 'test-model');
 let result;await handler({body:{query:'What published evidence validates MRI anatomical localization?'}},{status(){return this;},json(x){result=x;}});
 assert.equal(calls.length,2);assert.equal(calls[0].input[1].content,calls[1].input[1].content);assert.equal(result.retried,true);assert.equal(result.blocks.length,1);assert.ok(calls[0].max_output_tokens>=5000);
});
test('a second uncited brief is rejected, without an unbounded retry or invented sources',async()=>{
 const {installEvidenceRoute}=await import('../server/evidence.mjs');let handler,calls=0,status,result;
 const unlinked=response();unlinked.output[1].content[0].annotations=[];
 installEvidenceRoute({post:(p,h)=>handler=h},()=>({responses:{create:async()=>{calls++;return unlinked;}}}),()=> 'test');
 await handler({body:{query:'What published MRI evidence is available?'}},{status(n){status=n;return this;},json(x){result=x;}});
 assert.equal(calls,2);assert.equal(status,502);assert.match(result.error,/source-linked/);assert.equal(result.blocks,undefined);
});
