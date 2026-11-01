# MNI ICBM152 2009c symmetric MRI template

Source: https://nist.mni.mcgill.ca/icbm-152-nonlinear-atlases-2009/
Original archive: https://www.bic.mni.mcgill.ca/~vfonov/icbm/2009/mni_icbm152_nlin_sym_09c_nifti.zip

This is a population-average research template constructed from real MRI scans, not a scan of an individual patient, synthetic image generation, or a diagnostic reference case.

Bundled files are nearest-neighbor 2 mm derivatives prepared from the original 1 mm T1 image and accompanying brain-extraction mask. The supplied mask is a whole-brain extraction mask, not ventricular ground truth. No model proposal or measured model accuracy is bundled.

Preparation: `node scripts/prepare-mni.mjs /path/to/extracted/mni_icbm152_nlin_sym_09c`.
Dimensions: 97 × 115 × 97. Affine: diag(2,2,2), origin (-96,-132,-78) mm, RAS-aligned.

Copyright (C) 1993–2004 Louis Collins, McConnell Brain Imaging Centre, Montreal Neurological Institute, McGill University. The full original permission notice is preserved in COPYING next to the data.

Citations requested by the source:
- Fonov VS et al. Unbiased average age-appropriate atlases for pediatric studies. NeuroImage 54(1), 2011. DOI: 10.1016/j.neuroimage.2010.07.033.
- Fonov VS et al. Unbiased nonlinear average age-appropriate brain templates from birth to adulthood. NeuroImage 47 Supplement 1, 2009, S102. DOI: 10.1016/S1053-8119(09)70884-5.

Generic-body placement is illustrative. It is not patient-specific registration or evidence that this template is anatomically registered to the body mesh.
