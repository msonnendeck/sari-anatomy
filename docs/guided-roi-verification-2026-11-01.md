# Guided ROI and literature: November 1, 2026

## Implemented and checked

- Shared voxel seed projected into axial, coronal and sagittal images using the existing coordinate transforms.
- Human box drawing verified in the browser (SVG-to-image transforms include letterboxing).
- Three public atlas views sent to Muse Spark Contributor. Valid reviewed box suggestions, summary and limitations returned. In this test Muse retained the provided boxes; do not claim an independently discovered anatomical boundary.
- Reviewed box+point prompts sent separately to SAM 3.1 for axial slice 132, coronal 136, sagittal 134 and two adjacent axial slices (UI numbering).
- Five-plane result: 5,743 consensus-positive voxels; 183 conflicting voxels among 1,802 voxels observed in intersecting planes. Conflicts excluded; unobserved space left empty. Applied through the browser review control.
- Active axial slice agreement displayed 75.4% against the right hippocampus source annotation after application. This single example is not a model accuracy benchmark. Prior proposal bounds were part of the initial prompt, and the source atlas was used to position the seed, so the example is assisted rather than an unbiased independent evaluation.
- Separate literature endpoint made a live completed search with source annotations and returned PubMed-linked research context. Test query concerned hippocampal volume variability in healthy adults. The model returned PMID 8413958 and 15193947 source links. Search grounding is not independent full-text verification or a systematic review.

- Browser literature brief returned four unique linked sources and a research checklist, with retrieval time. Export was parsed: 5-plane ROI, 5,743 proposal voxels, 183 conflicts, and one literature search with seven citation annotations were retained.

## Data flow and provenance

Navigation chat remains metadata-only. Guided ROI explicitly shares three grayscale views with Muse, then 3–9 approved sampled images with SAM. Researcher seed, input boxes, Muse suggestions/rationale, reviewed prompts, models, sampling coverage, conflict counts and timestamps are recorded. Last-generation details are history: later manual edits/undo can change the current proposal. Literature sends only the reviewed query text, never images.

## Limits

No native point-cloud input is exposed by the documented hosted SAM 3.1 API. Meta SAM 3D is a different image-to-3D reconstruction family, not an established medical voxel/point-cloud segmentation service. No complete volume, diagnostic interpretation, disease likelihood, case matching or clinical performance is claimed.

Literature exploration can surface published disease associations and methodological features for research; it must not infer that an association applies to the selected image. Keep original source links, study context, limitations, and retrieval time. Do not describe generic literature search as a validated clinical decision-support system.

## Verification

30 automated tests passed and production build passed. Tests cover cross-plane seed projection, source-free sparse reconstruction, disagreement exclusion, invalid prompts/masks, valid box+point serialization, and required search/citation evidence. Browser screenshots are kept locally under the task's work/sari-qa directory rather than bundled as source data.
