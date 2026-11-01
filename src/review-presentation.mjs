export function eventPresentation(text,regions=[]){
 const result=(title)=>({title,details:text});
 if(text.startsWith('Reviewed ROI applied: ')){
  try{const r=JSON.parse(text.slice('Reviewed ROI applied: '.length));return result(`Applied draft ROI · ${r.target || 'selected region'} · ${r.frames?.length || 0} sampled planes`);}catch{}
 }
 if(text.startsWith('Muse action: ')){
  try{const actions=JSON.parse(text.slice('Muse action: '.length)),r=actions.findLast(a=>a.action==='select_region');return result(`Updated workspace${r?' · '+(regions.find(v=>v.id===r.regionId)?.name || 'atlas structure'):''} · ${actions.length} navigation actions`);}catch{}
 }
 if(text.startsWith('SAM slice comparison:'))return result('Compared SAM proposal with the source reference');
 if(text.startsWith('SAM 3.1 proposal on '))return result('Applied SAM proposal · '+text.slice(20).split(';')[0]);
 if(text.startsWith('Comparison target set to source atlas label '))return result('Set source reference · '+text.split(': ').slice(1).join(': '));
 if(text.startsWith('Literature search saved:'))return result('Saved sourced literature search');
 if(text.includes('{')||text.length>220)return result('Recorded research workspace action');
 return {title:text,details:null};
}
export function studyHelp(v){
 if(v.synthetic)return 'This study is a procedural brain phantom. Its starting reference and proposal masks are synthetic, not patient data or AI output. Subsequent manual and model edits are recorded in Activity.';
 if(v.atlas)return `${v.name}: ${v.atlas.regions.length} named source anatomical structures with MRI. Atlas surfaces and labels come from the supplied research source; they are not AI findings. ${v.source}. The generic body placement is illustrative, not patient-specific registration.`;
 if(v.bundled)return `${v.name}. Source: ${v.source}. ${v.caseContext || 'Bundled research imaging.'} Source annotations and AI proposals are separate. Consult Data & attribution for dataset details.`;
 return `${v.name || 'Imported volume'} is a local research volume. Native voxel axes and spacing are retained; anatomical orientation and patient-specific body registration have not been verified. Any imported reference and subsequent edits require researcher review.`;
}
