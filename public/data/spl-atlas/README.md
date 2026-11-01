# SPL/NAC anatomical atlas — SARI derivative

Research and educational visualization only. Not clinically validated. No diagnosis,
treatment, surgical planning or medical advice. Source labels describe an atlas,
not findings inferred by SARI or Meta. The atlas is not registered to a user's scan.

All or portions of this licensed product (such portions are the "Software") have
been obtained under license from The Brigham and Women's Hospital, Inc. and are
subject to the following terms and conditions: see the full `LICENSE.txt` alongside
these files (3D Slicer License, including Part B).

## Source and credit

SPL/NAC/SPL-PNL Brain Atlas, Surgical Planning Laboratory and collaborating groups,
Brigham and Women's Hospital; MRI acquired at the Athinoula A. Martinos Center for
Biomedical Imaging, courtesy Lawrence Wald. Authors include Michael Halle,
I-Fang Talos, Andras Jakab, Nikos Makris, George Papadimitriou, Maria Naeem,
Ibraheem Naeem, and the wider atlas contributor community. For the complete
contributors and grants, consult the source project and publication.

- Official catalog: https://nac.spl.harvard.edu/downloads
- Dataset description: https://nac.spl.harvard.edu/nac/infra/infrastructure-core-publications
- Source repository: https://github.com/mhalle/spl-brain-atlas
- Pinned revision: bec24db25aad5f7600e2df3becfb1f883e61ff56
- Source license declaration: https://github.com/mhalle/spl-brain-atlas/blob/bec24db25aad5f7600e2df3becfb1f883e61ff56/LICENSE.md
- Viewer/publication: Halle, Demeusy, Kikinis (2017), The Open Anatomy Browser,
  Frontiers in Neuroinformatics 11:22, doi:10.3389/fninf.2017.00022.

## Transformations and limits

- `t1.nii.gz`: source `slicer/volumes/imaging/A1_grayT1.nrrd`, preserving its
  **0.75 mm grid**. Signed axis permutation from LPS to canonical RAS; no spatial
  interpolation or downsampling. Intensity normalized to uint8 for display;
  original floating-point intensity precision is not retained.
- Canonical image dimensions: 208 × 288 × 320; RAS origin
  (-77.625, -107.625, -119.625) mm. Voxel spacing (0.75,0.75,0.75) mm.
- `labels.u16.gz`: unsigned 16-bit IDs from `hncma-atlas.nrrd`. The **source
  labels have 1 mm spacing**, with a different origin from the MRI. Labels are
  resampled with nearest-neighbor in physical coordinates onto the 0.75 mm MRI
  grid. This does not create 0.75 mm annotation accuracy. No ID normalization.
- `surfaces.bin.gz`: 90 selected source VTK surfaces: cortical parcels, ventricles,
  hippocampi, amygdalae, caudate/putamen, corpus callosum, brainstem and white-matter
  surfaces. Source triangle strips triangulated with alternating winding;
  degenerate triangles removed. No invented anatomy or geometric smoothing added.
  RAS coordinates normalized to the exact image viewer's coordinate frame.
- `atlas.json`: source names and RGB colors from `hncma-atlas-lut.ctbl`, surface
  ranges, label voxel counts and centroids. UI groups are SARI navigation aids.
  Centroids identify a navigation location and can lie outside concave structures.
- Some source structures have no selected surface; only 90 are interactive in 3D.
  Source parcellations are atlas annotations, not independent validation data for
  the assistant. Hemisphere filtering uses source names, retaining midline regions.
- Whole-body placement remains illustrative and uses a separate reference source.

Source SHA256 values are retained in `source-checksums.json`. Conversion is
reproducible using `scripts/prepare-spl-atlas.mjs` and the pinned original files.
No private user data or identifying scan metadata was added.
