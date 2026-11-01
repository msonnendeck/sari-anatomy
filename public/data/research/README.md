# Public research derivatives

Research-only visualization; no diagnosis, treatment or medical advice. Intensity
volumes are scalar MRI, not natural-color images. Tissue colors are display labels.

## McGill / MNI

MNI ICBM152 nonlinear 2009c symmetric, Montreal Neurological Institute, McGill University.
Source: https://nist.mni.mcgill.ca/icbm-152-nonlinear-atlases-2009/
Archive: https://www.bic.mni.mcgill.ca/~vfonov/icbm/2009/mni_icbm152_nlin_sym_09c_nifti.zip
Permission and copyright: ../mni152/COPYING (retained alongside the original derivative).
Citations: Fonov et al. 2011, doi:10.1016/j.neuroimage.2010.07.033;
Fonov et al. 2009, doi:10.1016/S1053-8119(09)70884-5.

- `mni-t1-1mm.nii.gz`: original 193 × 229 × 193, 1 mm spatial grid;
  scaled and quantized to uint8 for browser use. This preserves spatial resolution,
  not the original intensity precision. Population average, not an individual case.
- `mni-t2-2mm.nii.gz`: T2 image, nearest-neighbor downsampling to 2 mm, uint8.
- `mni-tissues.nii.gz`: maximum-probability tissue class at each voxel where maximum
  probability exceeds 0.1. 1=CSF (purple), 2=gray matter (amber), 3=white matter (blue).
  Derived from the supplied CSF/GM/WM probability maps at 2 mm. These are atlas tissue
  classes, not lesion annotations or new model output.

## 3D Slicer MRBrainTumor1

Official source registry:
https://github.com/Slicer/Slicer/blob/main/Modules/Scripted/SampleData/SampleData.py
Source file RegLib_C01_1.nrrd:
https://github.com/Slicer/SlicerTestingData/releases/download/SHA256/998cb522173839c78657f4bc0ea907cea09fd04e44601f17c82ea27927937b95
Original SHA256: 998cb522173839c78657f4bc0ea907cea09fd04e44601f17c82ea27927937b95

This is distributed by 3D Slicer as **MRBrainTumor1**. We retain that source case
label only. Tumor subtype, pathology confirmation, lesion mask and clinical report
are not supplied with this sample; SARI does not infer them. No assertion of a
specific histological diagnosis or treatment is made.

Slicer maintainers confirm contributed/distributed sample data is covered by the
Slicer license, with dataset-specific exceptions listed in the sample module:
https://discourse.slicer.org/t/using-3d-slicer-sample-cts-for-a-publication/33260
https://discourse.slicer.org/t/license-question-about-the-use-of-the-sample-data/30258
No exception is listed for this sample. The full Slicer license is included as
Slicer-LICENSE.txt. Attribution: 3D Slicer community and contributing institutions.

SARI derivative: original 256 × 256 × 112 grid, 0.9375 × 0.9375 × 1.4 mm,
flipped X/Y from LPS to RAS, original origin transformed accordingly, intensity
scaled to uint8. No personal metadata is retained in the derivative header.

Reproducible preparation: `scripts/prepare-research-samples.mjs` with the original
source archive and checksum-verified Slicer sample available locally.
