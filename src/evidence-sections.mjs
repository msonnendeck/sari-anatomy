// Split display sections without losing citation offsets or changing the saved answer.
export function evidenceSections(block){
 const heading=/(?:^#{1,3}[ \t]+(Findings|Research findings|Checklist|Limitations)[ \t]*$|^\*\*(Findings|Research findings|Primary studies[^*\n]*|Research features[^*\n]*|Checklist|Limitations[^*\n]*)\*\*)/gmi;
 const matches=[...block.text.matchAll(heading)],ranges=[];
 if(!matches.length)return [{title:'Research findings',...block}];
 if(matches[0].index>0)ranges.push({title:'Context',start:0,end:matches[0].index});
 matches.forEach((m,i)=>ranges.push({title:/checklist|features/i.test((m[1]||m[2]))?'Checklist':/limitation/i.test((m[1]||m[2]))?'Limitations':'Findings',start:m.index+m[0].length,end:matches[i+1]?.index??block.text.length}));
 return ranges.filter(r=>block.text.slice(r.start,r.end).trim()).map(r=>({title:r.title,text:block.text.slice(r.start,r.end),citations:block.citations.filter(c=>c.start<r.end&&c.end>r.start).map(c=>({...c,start:Math.max(c.start,r.start)-r.start,end:Math.min(c.end,r.end)-r.start}))}));
}
