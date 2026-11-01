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
