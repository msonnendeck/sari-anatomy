import React,{useRef,useState} from 'react';
import {validBox,mergeRoi} from './roi.mjs';
import {slicePixels} from './volume.mjs';
import {Loader2,X} from 'lucide-react';
const encode=(v,frame)=>{
 const {rgba,width,height}=slicePixels(v,frame.axis,frame.slice,{overlay:false,reference:false});
 const c=document.createElement('canvas');c.width=width;c.height=height;c.getContext('2d').putImageData(new ImageData(rgba,width,height),0,0);
 return {...frame,image:c.toDataURL('image/png')};
};
export {encode as captureRoiFrame};
export default function RoiDialog({job,onClose,onApply}) {
 const [frames,setFrames]=useState(job.frames),[target,setTarget]=useState(job.target),[consent,setConsent]=useState(false),[plan,setPlan]=useState(null),[busy,setBusy]=useState(''),[error,setError]=useState(''),[radius,setRadius]=useState(0),[result,setResult]=useState(null),[edited,setEdited]=useState(false);
 const drag=useRef(null),live=useRef(true);
 React.useEffect(()=>()=>{live.current=false;},[]);
 function draw(e,f,start){
  const cursor=e.currentTarget.createSVGPoint();cursor.x=e.clientX;cursor.y=e.clientY;const local=cursor.matrixTransform(e.currentTarget.getScreenCTM().inverse());
  const p={x:Math.max(0,Math.min(f.width-1,Math.floor(local.x))),y:Math.max(0,Math.min(f.height-1,Math.floor(local.y)))};
  if(start){drag.current={axis:f.axis,p};e.currentTarget.setPointerCapture(e.pointerId);return;}
  if(drag.current?.axis!==f.axis)return;
  const a=drag.current.p;
  const box={left:Math.min(a.x,p.x,f.point.x),top:Math.min(a.y,p.y,f.point.y),right:Math.min(f.width,Math.max(a.x,p.x,f.point.x)+1),bottom:Math.min(f.height,Math.max(a.y,p.y,f.point.y)+1)};
  setFrames(old=>old.map(v=>v.axis===f.axis?{...v,box}:v));setEdited(true);setResult(null);
 }
 async function suggest(){
  setBusy('Muse is inspecting three views…');setError('');
  try{
   const r=await fetch('/api/roi-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({frames,target,geometry:{dims:job.volume.dims,spacing:job.volume.spacing,orientation:job.volume.orientation,anatomicalAxes:!!job.volume.anatomicalAxes,seed:job.seed}})});const data=await r.json();if(!r.ok)throw new Error(data.error);
   if(!live.current)return;
   setPlan({...data.plan,model:data.model,inputPrompts:frames.map(({image,...f})=>f)});setEdited(false);
   setFrames(old=>old.map(f=>({...f,box:data.plan.views.find(v=>v.axis===f.axis).box})));setResult(null);
  }catch(e){if(live.current)setError(e.message);}finally{if(live.current)setBusy('');}
 }
 async function segment(){
  setBusy('SAM is processing the selected planes…');setError('');
  try{
   const inputs=[...frames];
   const base=frames.find(f=>f.axis==='axial');
   for(let offset=-radius;offset<=radius;offset++)if(offset&&base.slice+offset>=0&&base.slice+offset<job.volume.dims[2])inputs.push(encode(job.volume,{...base,slice:base.slice+offset}));
   const r=await fetch('/api/roi-segment',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({frames:inputs})});const data=await r.json();if(!r.ok)throw new Error(data.error);
   if(!live.current)return;
   if(data.frames?.length!==inputs.length||data.frames.some((f,i)=>f.axis!==inputs[i].axis||f.slice!==inputs[i].slice))throw new Error('ROI response did not match the requested planes.');
   const merged=mergeRoi(job.volume,data.frames);
   if(!merged.voxels)throw new Error('No ROI voxels returned. Adjust prompts and retry.');
   setResult({...merged,provenance:{target,seed:job.seed,summary:plan.summary,limitations:plan.limitations,museModel:plan.model,samModel:'sam-3.1',humanEditedPrompts:edited,humanInput:plan.inputPrompts,museSuggestions:plan.views,source:'Human-selected seed/boxes; Muse image-grounded suggestions; SAM masks; cross-plane consensus at intersections',coverage:'Sampled planes only; no interpolation or inferred full organ',frames:inputs.map(({image,...f})=>({...f,reason:plan.views.find(v=>v.axis===f.axis)?.reason,propagated:f.axis==='axial'&&f.slice!==base.slice})),conflicts:merged.conflicts,compared:merged.compared,createdAt:new Date().toISOString()}});
  }catch(e){if(live.current)setError(e.message);}finally{if(live.current)setBusy('');}
 }
 const valid=frames.every(f=>validBox(f.box,f.width,f.height,f.point));
 return <div className="modal-backdrop"><section className="modal roi-dialog" role="dialog" aria-modal="true" aria-labelledby="roi-title">
  <button className="icon-button modal-close" aria-label="Close ROI review" onClick={onClose}><X size={18}/></button>
  <span className="panel-eyebrow">HUMAN → MUSE → SAM</span><h2 id="roi-title">Shape a research region.</h2>
  <label className="roi-label">Research target<input aria-label="Research target" maxLength={300} value={target} disabled={!!busy||!!plan} onChange={e=>setTarget(e.target.value)}/></label>
  {!job.volume.anatomicalAxes && !job.volume.synthetic && <p className="fine-print">Native voxel planes: anatomical orientation has not been verified.</p>}
  <p className="fine-print">Draw a box in each view. The shared seed stays inside. Boxes guide a proposal; they do not establish anatomical identity.</p>
  <div className="roi-views">{frames.map(f=><div key={f.axis}><strong>{f.axis} · {f.slice+1}</strong><svg aria-label={`${f.axis} ROI prompt preview`} viewBox={`0 0 ${f.width} ${f.height}`} onPointerDown={e=>!busy&&draw(e,f,true)} onPointerMove={e=>!busy&&draw(e,f,false)} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
   <image href={f.image} width={f.width} height={f.height}/><rect {...{x:f.box.left,y:f.box.top,width:f.box.right-f.box.left,height:f.box.bottom-f.box.top}} fill="#90ddca22" stroke="#90ddca" strokeWidth="2"/><circle cx={f.point.x} cy={f.point.y} r="3" fill="#ffce82"/>
  </svg><input aria-label={`${f.axis} prompt box`} value={[f.box.left,f.box.top,f.box.right,f.box.bottom].join(',')} disabled={!!busy} onChange={e=>{const a=e.target.value.split(',').map(Number);if(a.length===4&&a.every(Number.isInteger)){setFrames(old=>old.map(v=>v.axis===f.axis?{...v,box:{left:a[0],top:a[1],right:a[2],bottom:a[3]}}:v));setEdited(true);setResult(null);}}}/>{plan&&<small>{plan.views.find(v=>v.axis===f.axis)?.reason}</small>}</div>)}</div>
  {!plan?<><label className="consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>I have permission to share these three grayscale views, prompts and target with Meta. Free-credit terms may allow product improvement use.</label><button className="button primary" disabled={!consent||!target.trim()||!valid||!!busy} onClick={suggest}>Ask Muse for ROI prompts</button></>:<>
   <div className="roi-rationale"><strong>Prompt rationale · review before SAM</strong><p>{plan.summary}</p><small>{plan.limitations}</small></div>
   <label className="roi-label">Sampling<select aria-label="ROI sampling range" disabled={!!busy} value={radius} onChange={e=>{setRadius(Number(e.target.value));setResult(null);}}><option value={0}>Three intersecting planes</option><option value={1}>Three planes + 2 neighboring axial slices</option><option value={2}>Three planes + 4 neighboring axial slices</option><option value={3}>Three planes + 6 neighboring axial slices</option></select></label>
   <p className="fine-print">SAM receives each sampled grayscale slice, box and seed. Neighboring prompts are propagated drafts. Applying replaces the proposal. Unobserved voxels remain empty.</p>
   <button className="button primary" disabled={!valid||!!busy} onClick={segment}>Approve prompts & run SAM</button>
  </>}
  {busy&&<p role="status"><Loader2 size={15} className="spin"/> {busy}</p>}{error&&<p role="alert">{error}</p>}
  {result&&<div className="roi-rationale"><strong>Draft ROI · {result.planeCount} sampled planes</strong><p>{result.voxels.toLocaleString()} voxels · {result.conflicts} conflicting intersecting voxels out of {result.compared} compared. Conflicts are excluded.</p><p className="fine-print">This is sparse image evidence, not a complete anatomical reconstruction or a confidence score.</p><button className="button primary" onClick={()=>onApply(result)}>Apply draft ROI</button></div>}
  <p className="fine-print">For professional research and education. Not clinically validated.</p>
 </section></div>;
}
