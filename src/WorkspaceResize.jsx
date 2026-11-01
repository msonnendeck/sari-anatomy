import React from 'react';
export default function WorkspaceResize({label,value,min,max,onChange,axis='x',ratio=false,reverse=false,className='',style}){
 function move(e){if(!e.currentTarget.hasPointerCapture(e.pointerId))return;const r=e.currentTarget.parentElement.getBoundingClientRect();let n=ratio?(axis==='x'?(e.clientX-r.left)/r.width:(e.clientY-r.top)/r.height)*100:Number(e.currentTarget.dataset.startValue)+(reverse?-1:1)*((axis==='x'?e.clientX:e.clientY)-Number(e.currentTarget.dataset.start));
 onChange(Math.max(min,Math.min(max,n)));}
 return <div role="separator" tabIndex={0} aria-label={label} aria-orientation={axis==='x'?'vertical':'horizontal'} aria-valuenow={Math.round(value)} aria-valuemin={min} aria-valuemax={max} title={`${label} · drag or use arrow keys`} className={`workspace-resize ${className}`} style={style}
 onPointerDown={e=>{e.currentTarget.dataset.start=axis==='x'?e.clientX:e.clientY;e.currentTarget.dataset.startValue=value;e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();}}
 onPointerMove={move} onPointerUp={e=>e.currentTarget.releasePointerCapture(e.pointerId)}
 onKeyDown={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();const delta=ratio?2:16;onChange(e.key==='Home'?min:e.key==='End'?max:Math.max(min,Math.min(max,value+(['ArrowLeft','ArrowUp'].includes(e.key)?-delta:delta))));}}}/>;
}
