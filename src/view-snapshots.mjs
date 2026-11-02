import {recordId} from "./ids.mjs";
import {cameraViewKey} from "./camera-framing.mjs";
// Binary masks are stored once and shared by immutable view snapshots.
export function encodeMask(mask){
 const runs=[];let start=-1,preferBits=false;
 for(let i=0;i<=mask.length;i++){
  const on=i<mask.length&&!!mask[i];
  if(on&&start<0)start=i;
  if(!on&&start>=0){runs.push(start,i-start);start=-1;if(runs.length*8>=Math.ceil(mask.length/8)){preferBits=true;break;}}
 }
 if(!preferBits&&runs.length*8<Math.ceil(mask.length/8))return {encoding:'runs',length:mask.length,data:runs};
 const bits=new Uint8Array(Math.ceil(mask.length/8));for(let i=0;i<mask.length;i++)if(mask[i])bits[i>>3]|=1<<(i%8);
 let binary='';for(let i=0;i<bits.length;i+=8192)binary+=String.fromCharCode(...bits.subarray(i,i+8192));
 return {encoding:'bits',length:mask.length,data:btoa(binary)};
}
export function decodeMask(encoded,length){
 if(!encoded||encoded.length!==length||!Number.isSafeInteger(length)||length<1)throw new Error('Saved mask does not match this study.');
 const mask=new Uint8Array(length);
 if(encoded.encoding==='runs'){
  if(!Array.isArray(encoded.data)||encoded.data.length%2)throw new Error('Invalid saved mask.');
  let end=0;
  for(let i=0;i<encoded.data.length;i+=2){const [start,count]=encoded.data.slice(i,i+2);if(!Number.isInteger(start)||!Number.isInteger(count)||count<1||start<end||start+count>length)throw new Error('Invalid saved mask range.');mask.fill(1,start,start+count);end=start+count;}
 }else if(encoded.encoding==='bits'){
  const raw=atob(encoded.data);if(raw.length!==Math.ceil(length/8))throw new Error('Invalid saved mask length.');
  for(let i=0;i<length;i++)mask[i]=(raw.charCodeAt(i>>3)>>(i%8))&1;
 }else throw new Error('Unknown saved mask encoding.');
 return mask;
}
export const emptyArchive=()=>({version:1,views:{},masks:{}});
function intern(archive,mask){
 const encoded=encodeMask(mask),text=JSON.stringify(encoded);let hash=2166136261;
 for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
 const root=`mask-${mask.length}-${hash>>>0}`;let key=root,n=0;
 // A hash collision must never select the wrong annotation.
 while(archive.masks[key]&&JSON.stringify(archive.masks[key])!==text)key=`${root}-${++n}`;
 archive.masks[key] ||= encoded;return key;
}
export function studySignature(v){return JSON.stringify({id:v.id,dims:v.dims,spacing:v.spacing,affine:v.affine||null});}
export function captureMasks(archive,v){return {proposal:intern(archive,v.proposal),reference:intern(archive,v.reference),metadata:structuredClone({referenceLabel:v.referenceLabel,referenceKind:v.referenceKind,roiProvenance:v.roiProvenance||null})};}
export function addView(archive,v,state,masks=captureMasks(archive,v)){
 const id=recordId();archive.views[id]={id,version:2,createdAt:new Date().toISOString(),study:studySignature(v),state:structuredClone(state),masks};return id;
}
export function restoreView(archive,id,v){
 const snap=archive.views[id];if(snap?.version!==2)throw new Error('This older entry has no complete saved view.');if(!snap||snap.study!==studySignature(v))throw new Error('This saved view belongs to another study or grid. Open the matching study first.');
 const state=structuredClone(snap.state),axes=['sagittal','coronal','axial'];
 if(!state.position||!axes.includes(state.axis)||axes.some((a,i)=>!Number.isInteger(state.position[a])||state.position[a]<0||state.position[a]>=v.dims[i]))throw new Error('Saved slice position is invalid.');
 if(state.camera&&(!['position','target'].every(k=>Array.isArray(state.camera[k])&&state.camera[k].length===3&&state.camera[k].every(Number.isFinite))))throw new Error('Saved camera is invalid.');
 if(state.camera?.viewKey&&state.camera.viewKey!==cameraViewKey(v,state.spatial,state.bodyContext))throw new Error('Saved camera context does not match the saved view.');
 return {state,proposal:decodeMask(archive.masks[snap.masks.proposal],v.proposal.length),reference:decodeMask(archive.masks[snap.masks.reference],v.reference.length),metadata:structuredClone(snap.masks.metadata)};
}
export function prunedArchive(archive,messages,events){
 const ids=new Set([...messages,...events].flatMap(e=>[e.snapshotId,e.questionSnapshotId,e.imageSnapshotId]).filter(Boolean)),views={},masks={};
 for(const id of ids)if(archive.views[id]){const view=archive.views[id];views[id]=view;for(const key of [view.masks.proposal,view.masks.reference])masks[key]=archive.masks[key];}
 return {version:1,views,masks};
}
