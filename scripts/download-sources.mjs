// Download original research inputs, never private uploads. Run from repo root.
import {mkdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {Readable} from 'node:stream';import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';import path from 'node:path';
const args=process.argv.slice(2),dataset=args[0]||'all';
if(!['all','spl','mni','slicer'].includes(dataset)||args.length>1){console.error('Usage: node scripts/download-sources.mjs [all|spl|mni|slicer]');process.exit(1);}
const root=path.resolve('workspace/source-data'),records=[];
const sha=b=>createHash('sha256').update(b).digest('hex');
async function download(url,destination,expected){
 await mkdir(path.dirname(destination),{recursive:true});
 let existing;try{existing=await readFile(destination);}catch(e){if(e.code!=='ENOENT')throw e;}
 if(existing&&(!expected||sha(existing)===expected)){records.push({url,file:path.relative(root,destination),sha256:sha(existing),sourceChecksumVerified:!!expected});return;}
 const temp=destination+'.part';
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(600000)});if(!response.ok||!response.body)throw new Error(`Download failed: HTTP ${response.status}: ${url}`);
  await pipeline(Readable.fromWeb(response.body),createWriteStream(temp));
  const digest=sha(await readFile(temp));if(expected&&digest!==expected)throw new Error(`Source checksum mismatch: ${path.basename(destination)}`);
  await rename(temp,destination);records.push({url,file:path.relative(root,destination),sha256:digest,sourceChecksumVerified:!!expected});
 }catch(e){await rm(temp,{force:true});throw new Error(`Could not download ${path.basename(destination)}: ${e.message}. Rerun the same dataset command to retry.`,{cause:e});}
}
try{
await mkdir(root,{recursive:true});
if(dataset==='all'||dataset==='spl'){
 const commit='bec24db25aad5f7600e2df3becfb1f883e61ff56',base=`https://raw.githubusercontent.com/mhalle/spl-brain-atlas/${commit}/`;
 const hashes=JSON.parse(await readFile('public/data/spl-atlas/source-checksums.json','utf8'));
 const files=Object.entries(hashes);let next=0;
 await Promise.all(Array.from({length:4},async()=>{while(next<files.length){const [name,hash]=files[next++];if(path.basename(name)!==name)throw new Error('Invalid source filename');const source=name==='A1_grayT1.nrrd'?'slicer/volumes/imaging/':name==='hncma-atlas.nrrd'?'slicer/volumes/labels/':name.endsWith('.ctbl')?'slicer/colortables/':'slicer/models/';await download(base+source+name,path.join(root,'spl',name),hash);}}));
 await download(base+'LICENSE.md',path.join(root,'spl','LICENSE.md'));
 console.log(`SPL/NAC: ${files.length} pinned original inputs verified against bundled SHA-256 records.`);
}
if(dataset==='all'||dataset==='mni'){
 const archive=path.join(root,'mni-original.zip');
 await download('https://www.bic.mni.mcgill.ca/~vfonov/icbm/2009/mni_icbm152_nlin_sym_09c_nifti.zip',archive);
 await mkdir(path.join(root,'mni'),{recursive:true});
 try{execFileSync('unzip',['-q','-o',archive,'-d',path.join(root,'mni')],{stdio:'pipe'});}catch{throw new Error('MNI extraction failed. Install unzip or manually extract mni-original.zip into workspace/source-data/mni.');}
 console.log('MNI: original archive downloaded and extracted. Its SHA-256 is recorded locally; no upstream checksum is asserted.');
}
if(dataset==='all'||dataset==='slicer'){
 const hash='998cb522173839c78657f4bc0ea907cea09fd04e44601f17c82ea27927937b95';
 await download('https://github.com/Slicer/SlicerTestingData/releases/download/SHA256/'+hash,path.join(root,'MRBrainTumor1.nrrd'),hash);
 console.log('Slicer MRBrainTumor1: original NRRD checksum verified.');
}
await writeFile(path.join(root,`downloads-${dataset}.json`),JSON.stringify({downloadedAt:new Date().toISOString(),dataset,files:records},null,2));
console.log('Original inputs: workspace/source-data (Git-ignored). See docs/data-sources.md for conversion commands and licences.');

}catch(e){console.error(e.message);process.exitCode=1;}
