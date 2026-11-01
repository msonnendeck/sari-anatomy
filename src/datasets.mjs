import { readVolume } from "./nifti.mjs";
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
