import { readVolume } from "./nifti.mjs";
export const researchSamples = [
  { id: "spl-atlas", title: "SPL/NAC · anatomical atlas", detail: "0.75 mm MRI · 90 named surfaces · Brigham and Women’s", path: "spl-atlas/t1" },
  { id: "mni-t1", title: "MNI152 · T1", detail: "2 mm · population average · tissue colors", path: "mni152/t1", mask: true, tissues: true },
  { id: "mni-hires", title: "MNI152 · T1 high resolution", detail: "1 mm · original spatial grid · population average", path: "research/mni-t1-1mm" },
  { id: "mni-t2", title: "MNI152 · T2", detail: "2 mm · complementary contrast · tissue colors", path: "research/mni-t2-2mm", mask: true, tissues: true },
  { id: "slicer-tumor", title: "Brain tumor · teaching case", detail: "0.94 × 0.94 × 1.4 mm · 3D Slicer · source-labeled tumor", path: "research/slicer-tumor", case: true },
];
export async function loadResearchSample(id = "mni-t1") {
  if (id === "spl-atlas") return loadSplAtlas();
  const sample = researchSamples.find((s) => s.id === id);
  if (!sample) throw new Error("Unknown research sample");
  async function read(path) {
    const r = await fetch(`/data/${path}.nii.gz`);
    if (!r.ok) throw new Error("Research sample unavailable");
    return readVolume(new File([await r.arrayBuffer()], `${id}.nii.gz`));
  }
  const v = await read(sample.path);
  const reference = sample.mask ? (await read("mni152/brain-mask")).binaryMask : new Uint8Array(v.data.length);
  const tissues = sample.tissues ? Uint8Array.from((await read("research/mni-tissues")).data, (n) => Math.round(n / 85)) : undefined;
  return { ...v, id, name: sample.title, series: sample.detail, reference, tissues,
    bundled: true, anatomicalAxes: true, synthetic: false,
    source: sample.case ? "3D Slicer MRBrainTumor1 · source-labeled tumor teaching case; subtype and lesion mask not supplied" : "MNI ICBM152 2009c symmetric · McGill",
    sourceLabel: sample.case ? "3D Slicer · sample data" : "McGill · MNI152",
    referenceLabel: sample.mask ? "Brain mask · MNI supplied" : "No reference mask",
    referenceKind: sample.mask ? "brain extraction mask" : "none supplied",
    caseContext: sample.case ? "Source-labeled brain tumor teaching case. Tumor subtype and lesion annotations are not supplied. This is dataset context, not an AI diagnosis." : "Population average; no individual diagnosis.",
    orientation: "RAS-aligned research derivative", placement: "Generic head context; not patient-specific registration",
  };
}
export async function loadMniTemplate() {
  const fetchFile = async (name) => {
    const r = await fetch(`/data/mni152/${name}.nii.gz`);
    if (!r.ok) throw new Error("The bundled MRI template could not be loaded.");
    return new File([await r.arrayBuffer()], `${name}.nii.gz`);
  };
  const [image, mask] = await Promise.all([
    fetchFile("t1"),
    fetchFile("brain-mask"),
  ]);
  const [v, m] = await Promise.all([readVolume(image), readVolume(mask)]);
  return {
    ...v,
    id: "mni152-2009c-sym-2mm",
    name: "MNI152 · T1",
    series: "ICBM 2009c symmetric · population template",
    reference: m.binaryMask,
    proposal: new Uint8Array(v.data.length),
    synthetic: false,
    bundled: true,
    anatomicalAxes: true,
    orientation: "RAS-aligned MNI template · 2 mm",
    source: "MNI ICBM152 2009c symmetric · McGill",
    sourceLabel: "McGill · MNI152",
    referenceLabel: "Brain mask · MNI supplied",
    proposalLabel: "No proposal yet",
    referenceKind: "brain extraction mask",
    placement: "Generic head context; not patient-specific body registration",
  };
}

async function loadSplAtlas() {
  const [image, labelResponse, infoResponse] = await Promise.all([fetch("/data/spl-atlas/t1.nii.gz"), fetch("/data/spl-atlas/labels.u16.gz"), fetch("/data/spl-atlas/atlas.json")]);
  if (![image,labelResponse,infoResponse].every((r) => r.ok)) throw new Error("SPL atlas files unavailable");
  const [v, buffer, atlas] = await Promise.all([readVolume(new File([await image.arrayBuffer()], "spl-t1.nii.gz")), new Response(labelResponse.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer(), infoResponse.json()]);
  if (buffer.byteLength !== v.data.length * 2 || v.dims.some((n,i) => n !== atlas.dims[i])) throw new Error("Atlas image and labels do not share a grid");
  const view = new DataView(buffer), atlasLabels = new Uint16Array(v.data.length);
  for (let i=0;i<atlasLabels.length;i++) atlasLabels[i]=view.getUint16(i*2,true);
  return {...v,id:"spl-atlas",name:"SPL/NAC · brain atlas",series:"0.75 mm T1 · source-labeled anatomy",atlas,atlasLabels,
    bundled:true,synthetic:false,anatomicalAxes:true,source:"SPL/NAC brain atlas · Brigham and Women’s Hospital / Martinos Center · pinned source bec24db",sourceLabel:"SPL/NAC · BWH",referenceLabel:"No comparison reference",referenceKind:"none; anatomical atlas labels are a separate layer",caseContext:"Healthy volunteer atlas; anatomical labels, not clinical findings.",orientation:"RAS-aligned 0.75mm MRI; source 1mm labels resampled by physical coordinates",placement:"Generic body context, not patient registration"};
}
