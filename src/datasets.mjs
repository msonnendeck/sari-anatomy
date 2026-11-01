import { readVolume } from "./nifti.mjs";
export const researchSamples = [
  { id: "mni-t1", title: "MNI152 · T1", detail: "2 mm · population average · tissue colors", path: "mni152/t1", mask: true, tissues: true },
  { id: "mni-hires", title: "MNI152 · T1 high resolution", detail: "1 mm · original spatial grid · population average", path: "research/mni-t1-1mm" },
  { id: "mni-t2", title: "MNI152 · T2", detail: "2 mm · complementary contrast · tissue colors", path: "research/mni-t2-2mm", mask: true, tissues: true },
  { id: "slicer-tumor", title: "Brain tumor · teaching case", detail: "0.94 × 0.94 × 1.4 mm · 3D Slicer · source-labeled tumor", path: "research/slicer-tumor", case: true },
];
export async function loadResearchSample(id = "mni-t1") {
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
