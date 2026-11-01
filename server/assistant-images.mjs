export function assistantImageContent(message,context,media){
 if(!media)return [{type:'text',text:JSON.stringify({message,context,imagesAttached:false})}];
 if(!['proposal','crosshair'].includes(media.selectionBasis)||!Array.isArray(media.anchor)||media.anchor.length!==3||!media.anchor.every((n,i)=>Number.isInteger(n)&&n>=0&&n<context.dims?.[i])||!Array.isArray(media.frames)||media.frames.length!==3||new Set(media.frames.map(f=>f.axis)).size!==3)throw new Error('Invalid image context.');
 const axes=['axial','coronal','sagittal'];
 for(const f of media.frames){
  const a={sagittal:0,coronal:1,axial:2}[f.axis];
  const expected={axial:[context.dims[0],context.dims[1]],coronal:[context.dims[0],context.dims[2]],sagittal:[context.dims[1],context.dims[2]]}[f.axis];
  if(!axes.includes(f.axis)||f.width!==expected?.[0]||f.height!==expected?.[1]||!Number.isInteger(f.slice)||f.slice!==media.anchor[a]||!Number.isInteger(f.width)||!Number.isInteger(f.height)||f.width<1||f.height<1||f.width>512||f.height>512||![f.clean,f.marked].every(s=>typeof s==='string'&&s.startsWith('data:image/png;base64,')&&s.length<1600000))throw new Error('Invalid image frame.');
 }
 return [{type:'text',text:JSON.stringify({message,context,imagesAttached:true,imageContext:{selectionBasis:media.selectionBasis,anchor:media.anchor,views:media.frames.map(({clean,marked,...f})=>({...f,uiSlice:f.slice+1}))},annotationLegend:'Mint = draft proposal, blue = shared focus point; colors are added annotations. Clean and marked images show the same source slices. No registration or anatomical identity is established by an unlabeled proposal.'})},...media.frames.flatMap(f=>[{type:'text',text:`${f.axis}, UI slice ${f.slice+1} (zero-based index ${f.slice}): clean grayscale then annotated copy.`},{type:'image_url',image_url:{url:f.clean}},{type:'image_url',image_url:{url:f.marked}}])];
}
