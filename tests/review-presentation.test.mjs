import test from 'node:test';import assert from 'node:assert/strict';import {eventPresentation,studyHelp} from '../src/review-presentation.mjs';import {evidenceSections} from '../src/evidence-sections.mjs';
test('ROI timeline is concise while retaining the original technical record verbatim',()=>{
 const text='Reviewed ROI applied: '+JSON.stringify({target:'right hippocampus',frames:Array(5).fill({slice:131}),museModel:'muse-spark-1.3'});
 const e=eventPresentation(text);assert.equal(e.title,'Applied draft ROI · right hippocampus · 5 sampled planes');assert.equal(e.details,text);
 assert.match(eventPresentation('Muse action: [{"action":"select_region","regionId":53}]',[{id:53,name:'right hippocampus'}]).title,/right hippocampus/);
});
test('help describes the active source and does not describe real or imported data as procedural',()=>{
 assert.match(studyHelp({synthetic:true}),/procedural brain phantom/);
 const atlas=studyHelp({name:'SPL',atlas:{regions:Array(90)},source:'BWH'});assert.match(atlas,/90 named/);assert.doesNotMatch(atlas,/procedural/);
 assert.match(studyHelp({name:'Local scan'}),/Native voxel axes/);
 assert.match(studyHelp({bundled:true,name:'MNI',source:'ICBM'}),/ICBM/);
});
test('literature sections preserve source spans after headings are removed for display',()=>{
 const text='## Findings\nA published finding.\n## Checklist\nInspect boundaries.\n## Limitations\nSmall study.';
 const start=text.indexOf('Inspect'),end=start+'Inspect boundaries.'.length;
 const parts=evidenceSections({text,citations:[{start,end,url:'https://example.com',title:'Study'}]});
 assert.deepEqual(parts.map(s=>s.title),['Findings','Checklist','Limitations']);const b=parts[1];assert.equal(b.text.slice(b.citations[0].start,b.citations[0].end),'Inspect boundaries.');
});
