import http from "node:http";
import test from 'node:test';import assert from 'node:assert/strict';import express from 'express';
import {accessConfig,installAccess} from '../server/access.mjs';
const fetch=(url,options={})=>new Promise((resolve,reject)=>{const req=http.request(url,{method:options.method||'GET',headers:options.headers},res=>{res.resume();res.on('end',()=>resolve({status:res.statusCode}));});req.on('error',reject);req.end();});
const env={PUBLIC_ORIGIN:'https://sari.example.com',SARI_DEMO_PASSWORD:'test-only-password-123',PORT:'5187'};
test('public hosting fails closed and local development remains available',()=>{
 for(const config of [{RENDER:'true'},{PUBLIC_ORIGIN:'https://sari.example.com'},{...env,PUBLIC_ORIGIN:'http://sari.example.com'},{...env,PUBLIC_ORIGIN:'https://sari.example.com/path'}])assert.throws(()=>accessConfig(config));
 const local=accessConfig({});assert.equal(local.password,'');assert.ok(local.authorities.has('127.0.0.1:5187'));
 const render=accessConfig({...env,PUBLIC_ORIGIN:'',RENDER_EXTERNAL_URL:env.PUBLIC_ORIGIN});assert.equal(render.publicOrigin,env.PUBLIC_ORIGIN);
});
test('app, datasets and APIs require a password; cross-origin and forged hosts are rejected',async()=>{
 const app=express();installAccess(app,accessConfig(env));app.use((req,res)=>res.json({protected:true}));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base=`http://127.0.0.1:${server.address().port}`;
 const headers={host:'sari.example.com'},auth='Basic '+Buffer.from('sari:'+env.SARI_DEMO_PASSWORD).toString('base64');
 try{
  assert.equal((await fetch(base+'/healthz')).status,200);
  for(const path of ['/','/assets/main.js','/data/atlas.nii.gz','/api/status','/api/assistant'])assert.equal((await fetch(base+path,{headers})).status,401);
  assert.equal((await fetch(base+'/api/assistant',{method:'POST',headers:{...headers,authorization:auth,origin:env.PUBLIC_ORIGIN}})).status,200);
  assert.equal((await fetch(base+'/',{headers:{...headers,authorization:auth,origin:'https://evil.example'}})).status,403);
  assert.equal((await fetch(base+'/',{headers:{authorization:auth}})).status,403);
  assert.equal((await fetch(base+'/',{headers:{...headers,authorization:'Basic '+Buffer.from('sari:wrong').toString('base64')}})).status,401);
  for(let i=0;i<21;i++)await fetch(base+'/',{headers:{...headers,authorization:'Basic bad'}});
  assert.equal((await fetch(base+'/',{headers:{...headers,authorization:'Basic bad'}})).status,429);
  assert.equal((await fetch(base+'/',{headers:{...headers,authorization:auth}})).status,200);
 }finally{await new Promise(r=>server.close(r));}
});
