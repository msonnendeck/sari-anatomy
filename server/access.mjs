import {createHash,timingSafeEqual} from 'node:crypto';
import {networkInterfaces} from 'node:os';
const digest=s=>createHash('sha256').update(s).digest();
export function accessConfig(env=process.env){
 const external=env.PUBLIC_ORIGIN||env.RENDER_EXTERNAL_URL;
 const hosted=!!external||env.RENDER==='true';
 let publicOrigin=null;
 if(external){
  const url=new URL(external);
  if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw new Error('PUBLIC_ORIGIN must be an HTTPS origin without a path or credentials.');
  publicOrigin=url.origin;
 }
 if(hosted&&!publicOrigin)throw new Error('Hosted SARI requires PUBLIC_ORIGIN (or RENDER_EXTERNAL_URL).');
 const password=env.SARI_DEMO_PASSWORD||'',username=env.SARI_DEMO_USER||'sari';
 if(hosted&&password.length<16)throw new Error('Hosted SARI requires a SARI_DEMO_PASSWORD of at least 16 characters.');
 if(username.includes(':')||/[\r\n]/.test(username))throw new Error('Invalid demo username.');
 const port=Number(env.PORT)||5187,host=env.HOST||'127.0.0.1';
 const authorities=new Set(),origins=new Set();
 if(publicOrigin){const url=new URL(publicOrigin);authorities.add(url.host);origins.add(url.origin);}
 else{
  const hosts=new Set(['localhost','127.0.0.1']);
  if(host!=='127.0.0.1'&&host!=='localhost')for(const addresses of Object.values(networkInterfaces()))for(const address of addresses||[])if(address.family==='IPv4'&&!address.internal)hosts.add(address.address);
  for(const h of hosts){authorities.add(`${h}:${port}`);origins.add(`http://${h}:${port}`);}
 }
 return {hosted,publicOrigin,password,username,authorities,origins};
}
export function installAccess(app,config){
 // Health checks disclose no app, model, configuration or dataset information.
 app.get('/healthz',(req,res)=>res.type('text').send('ok'));
 const expectedUser=digest(config.username),expectedPassword=digest(config.password);
 let failures=0,windowStart=Date.now();
 app.use((req,res,next)=>{
  if(!config.authorities.has(req.get('host')))return res.status(403).send('Unrecognized application host.');
  const origin=req.get('origin');
  if(origin&&!config.origins.has(origin))return res.status(403).send('Only same-origin requests are accepted.');
  res.set('X-Robots-Tag','noindex, nofollow');
  res.set('X-Content-Type-Options','nosniff');
  if(!config.password)return next();
  res.set('Cache-Control','private, no-store');
  const header=req.get('authorization')||'';
  let user='',password='';
  if(header.startsWith('Basic ')&&header.length<8192){const decoded=Buffer.from(header.slice(6),'base64').toString('utf8'),colon=decoded.indexOf(':');if(colon>=0){user=decoded.slice(0,colon);password=decoded.slice(colon+1);}}
  const validUser=timingSafeEqual(digest(user),expectedUser),validPassword=timingSafeEqual(digest(password),expectedPassword);
  if(validUser&&validPassword)return next();
  if(Date.now()-windowStart>60000){failures=0;windowStart=Date.now();}
  // Single-process shared demo limiter, bounded in memory. Known credentials
  // remain usable if invalid attempts hit the limit.
  if(header&&++failures>20)return res.status(429).set('Retry-After','60').send('Too many login attempts. Wait a minute and retry.');
  res.set('WWW-Authenticate','Basic realm="SARI research demo", charset="UTF-8"');
  res.status(401).send('SARI demo credentials required.');
 });
}
