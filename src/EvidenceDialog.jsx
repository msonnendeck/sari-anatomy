import {evidenceSections} from './evidence-sections.mjs';
import React,{useState,useRef} from 'react';import {X,Loader2} from 'lucide-react';
function formatted(text){return text.split(/(\*\*[^*]+\*\*)/g).map((part,i)=>part.startsWith('**')?<strong key={i}>{part.slice(2,-2)}</strong>:part.replace(/^\* /gm,'• '));}
function CitedText({block}){
 const points=[0,block.text.length,...block.citations.flatMap(c=>[c.start,c.end])].sort((a,b)=>a-b).filter((n,i,a)=>i===0||n!==a[i-1]);
 return <p className="evidence-text">{points.slice(0,-1).map((start,i)=>{
  const end=points[i+1],sources=block.citations.filter(c=>c.start<=start&&c.end>=end),text=block.text.slice(start,end);
  return <React.Fragment key={start}>{formatted(text)}{sources.map(c=><a key={`${c.url}:${c.end}`} href={c.url} target="_blank" rel="noreferrer" aria-label={`Source: ${c.title}`} title={c.title}> ↗</a>)}</React.Fragment>;
 })}</p>;
}
export default function EvidenceDialog({region,onClose,onSave,initialResult}){
 const [query,setQuery]=useState(initialResult?.query || (region?`What published MRI research describes ${region}? Summarize imaging features, research associations and limitations.`:'')),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[result,setResult]=useState(initialResult || null),[error,setError]=useState('');
 const live=useRef(true);React.useEffect(()=>()=>{live.current=false;},[]);
 async function search(){setBusy(true);setError('');setResult(null);try{
  const r=await fetch('/api/evidence',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query})});const data=await r.json();if(!r.ok)throw new Error(data.error);if(live.current){setResult(data);onSave(data);}
 }catch(e){if(live.current)setError(e.message);}finally{if(live.current)setBusy(false);}}
 const sources=result?[...new Map(result.blocks.flatMap(b=>b.citations).map(c=>[c.url,c])).values()]:[];
 return <div className="modal-backdrop"><section className="modal roi-dialog" role="dialog" aria-modal="true" aria-labelledby="evidence-title"><button className="icon-button modal-close" aria-label="Close literature explorer" onClick={onClose}><X size={18}/></button>
 <span className="panel-eyebrow">MUSE · LITERATURE EXPLORER</span><h2 id="evidence-title">Follow the evidence.</h2>
 <label className="roi-label">Research question<textarea aria-label="Literature research question" rows={3} maxLength={800} disabled={busy} value={query} onChange={e=>{setQuery(e.target.value);setResult(null);}}/></label>
 <p className="fine-print">Only this question is shared with Meta and its search service. No scan images or workspace measurements are sent. Keep patient identifiers out of the query.</p>
 <label className="consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>Share this research question for a sourced literature search.</label>
 <button className="button primary" disabled={!consent||busy||query.trim().length<8} onClick={search}>{busy?<><Loader2 size={14} className="spin"/> Searching literature…</>:'Search with Muse'}</button>
 {error&&<p role="alert">{error}</p>}
 {result&&<><p className="fine-print">Retrieved {new Date(result.retrievedAt).toLocaleString()} · {result.model}</p>{result.blocks.flatMap(evidenceSections).map((section,i)=><section key={i} className="evidence-section"><h3>{section.title}</h3><CitedText block={section}/></section>)}<div className="roi-rationale"><strong>Open the original sources</strong><ol>{sources.map(c=><li key={c.url}><a href={c.url} target="_blank" rel="noreferrer">{c.title}</a></li>)}</ol><small>{result.scope}</small></div></>}
 <p className="fine-print">Literature context for professional research and education. Not an interpretation of the selected scan or a patient-specific diagnosis.</p>
 </section></div>;
}
