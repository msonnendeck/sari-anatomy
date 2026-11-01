import 'dotenv/config';
import express from 'express';
import OpenAI from 'openai';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=express();app.disable('x-powered-by');app.use(express.json({limit:'5mb'}));
const ready=()=>process.env.META_ENABLED==='true'&&!!process.env.MODEL_API_KEY;
app.use('/api',(req,res,next)=>{const origin=req.get('origin');if(origin&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))return res.status(403).json({error:'Only local requests are accepted.'});next();});
app.get('/api/status',(req,res)=>res.json({enabled:ready(),model:process.env.META_MODEL||'muse-spark-1.3-contributor',sam:'sam-3.1',reason:!process.env.MODEL_API_KEY?'No server API key configured':process.env.META_ENABLED!=='true'?'Model calls are disabled':'Ready'}));
let active=0;app.use('/api',(req,res,next)=>{if(req.method!=='POST')return next();if(!ready())return res.status(503).json({error:'Meta is not connected. Add a server API key and enable model calls.'});if(active>=2)return res.status(429).json({error:'Two requests are already running. Please wait.'});active++;res.on('finish',()=>active--);next();});
const client=()=>new OpenAI({apiKey:process.env.MODEL_API_KEY,baseURL:'https://api.meta.ai/v1',timeout:60000,maxRetries:1});
app.post('/api/assistant',async(req,res)=>{
 try{
 const {message,context}=req.body;if(typeof message!=='string'||message.length>2000)return res.status(400).json({error:'Ask a question under 2,000 characters.'});
 const r=await client().chat.completions.create({model:process.env.META_MODEL||'muse-spark-1.3-contributor',max_completion_tokens:700,messages:[{role:'system',content:'You are SARI, a concise research workspace assistant. Never diagnose, detect disease, recommend care, or interpret patient health. Only navigate and explain provided annotation metrics. The volume may be synthetic. Do not claim you saw images: you receive metadata and computed metrics only. You may choose one navigation tool. Never invent measurements. If asked about clinical meaning, state the research boundary. Keep replies under 70 words.'},{role:'user',content:JSON.stringify({message,context})}],tools:[{type:'function',function:{name:'navigate',description:'Navigate the research workspace.',parameters:{type:'object',properties:{action:{type:'string',enum:['worst_difference','set_slice','set_axis','show_reference','show_proposal']},axis:{type:'string',enum:['axial','coronal','sagittal']},slice:{type:'integer',minimum:0,maximum:511}},required:['action'],additionalProperties:false}}}],tool_choice:'auto'});
 const m=r.choices[0]?.message;const calls=(m?.tool_calls||[]).filter(c=>c.type==='function'&&c.function.name==='navigate').slice(0,1).map(c=>{try{return JSON.parse(c.function.arguments);}catch{return null;}}).filter(Boolean);
 res.json({text:m?.content||'I’ve updated the workspace. Inspect the highlighted view.',actions:calls,model:process.env.META_MODEL||'muse-spark-1.3-contributor',usage:r.usage});
 }catch(e){res.status(e.status===429?429:502).json({error:e.status===401?'Meta rejected the API key. Check the server configuration.':e.status===429?'Meta rate limit reached. Try again shortly.':'Meta request failed. No workspace changes were applied.'});}
});
app.post('/api/segment',async(req,res)=>{
 try{
 const {image,point,width,height}=req.body;if(typeof image!=='string'||!image.startsWith('data:image/png;base64,')||!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width>512||height>512||!point||!Number.isFinite(point.x)||!Number.isFinite(point.y)||point.x<0||point.x>=width||point.y<0||point.y>=height)return res.status(400).json({error:'A valid slice and foreground point are required.'});
 const {buildObjectPrompt,parseImageStream,recordsOfKind,decodeMaskToRaster}=await import('@meta-sam/parser');
 const prompt=buildObjectPrompt({size:{width,height},objects:[{id:1,prompts:[{points:[{x:Math.round(point.x),y:Math.round(point.y)}]}]}]});
 const events=await client().responses.create({model:'sam-3.1',input:[{type:'message',role:'user',content:[{type:'input_text',text:prompt},{type:'input_image',image_url:image}]}],stream:true});
 const result=await parseImageStream(events).finalResult;if(result.outcome.status!=='completed')throw new Error('Incomplete SAM response');
 const mask=recordsOfKind(result.records,'mask')[0];if(!mask)return res.status(422).json({error:'SAM returned no mask. Try another foreground point.'});
 const raster=decodeMaskToRaster(mask.mask);if(raster.length!==width*height)throw new Error('Mask dimensions do not match');
 res.json({mask:Array.from(raster),width,height,model:'sam-3.1'});
 }catch(e){res.status(502).json({error:'SAM segmentation failed. The existing mask was preserved.'});}
});
app.use((err,req,res,next)=>res.status(400).json({error:'Invalid request body.'}));
if(process.env.NODE_ENV==='production'){
 app.use(express.static(path.join(root,'dist')));app.get('/{*path}',(req,res)=>res.sendFile(path.join(root,'dist/index.html')));
}else{const {createServer}=await import('vite');const vite=await createServer({root,server:{middlewareMode:true,hmr:{port:24787}},appType:'spa'});app.use(vite.middlewares);}
const port=Number(process.env.PORT)||5187;const server=app.listen(port,'127.0.0.1',()=>console.log(`SARI: http://127.0.0.1:${port} · Meta ${ready()?'enabled':'disabled'}`));server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${port} is in use. Choose another PORT.`:'Unable to start local server.');process.exit(1);});
