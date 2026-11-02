import test from 'node:test';import assert from 'node:assert/strict';
import {recordId} from '../src/ids.mjs';
import {addView,emptyArchive} from '../src/view-snapshots.mjs';
test('record IDs work with native UUID, LAN HTTP crypto and no crypto',()=>{
 assert.equal(recordId({randomUUID:()=> 'native-id'}),'native-id');
 const cryptoWithoutUUID={getRandomValues:bytes=>{bytes.fill(19);return bytes;}};
 assert.match(recordId(cryptoWithoutUUID),/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
 const ids=Array.from({length:1000},()=>recordId(null));assert.equal(new Set(ids).size,ids.length);
});
test('saved views remain usable when the browser has no randomUUID',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'crypto');
 try{
  Object.defineProperty(globalThis,'crypto',{configurable:true,value:{getRandomValues:bytes=>{for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);return bytes;}}});
  const archive=emptyArchive(),volume={id:'test',dims:[1,1,1],spacing:[1,1,1],proposal:new Uint8Array(1),reference:new Uint8Array(1)};
  const id=addView(archive,volume,{position:{axial:0,coronal:0,sagittal:0}});assert.ok(archive.views[id]);
 }finally{if(original)Object.defineProperty(globalThis,'crypto',original);else delete globalThis.crypto;}
});
