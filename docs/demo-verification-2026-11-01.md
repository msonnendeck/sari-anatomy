# SARI: live AI workflow verification — November 1, 2026

Research only. Not clinically validated. No diagnosis, treatment, or medical advice.

## Observed in Chrome

1. From the body overview, opened the SPL/NAC head study.
2. Requested: “Show the left hippocampus, isolate it in anatomy view, and select the coronal view.” Muse selected source label 17, anatomy rendering, isolation, and coronal navigation. Verified actual controls and slice position, not just model wording.
3. Follow-up: “Now show its right-side counterpart, keep it isolated, and switch to axial.” Muse selected source label 53, retained isolation, and selected axial navigation. This verified bounded conversation context.
4. Used **Use structure as reference**. The reference was derived from source label 53 and a foreground seed was placed inside that label.
5. Shared only the selected public atlas grayscale slice and foreground point with Meta SAM 3.1, through the explicit sharing notice.
6. Received and applied a real SAM proposal. The cropped output raster was mapped back into the original slice coordinates.
7. Reloaded; reference, proposal, position, and audit trail remained available in browser storage.
8. Requested solid rendering, both hemispheres, no isolation, and a 25° tilt / 35° yaw cut. Verified solid rendering, enabled linked cut, and the requested angles in actual controls.
9. Exported the research record through the UI. Parsed the downloaded JSON and checked dimensions, both mask lengths, proposal voxel count, source provenance, slice metrics, Muse cut action, and SAM event.

## One measured SAM example

- Dataset: pinned SPL/NAC 0.75 mm brain atlas, right hippocampus (source label 53).
- Plane: axial; zero-based slice 131 / UI slice 132.
- Foreground point: image pixel (133, 152).
- Source annotation on that slice: 581 pixels.
- SAM proposal: 572 pixels.
- Intersection: 432 pixels.
- 2D Dice: 864 / 1153 = 0.7493495229835212 (74.9%).

This is one successful API example, not an accuracy benchmark or evidence of clinical suitability. Source atlas labels are resampled reference annotations, not AI discoveries. Whole-volume Dice is much lower because the proposal covers one slice while the source target spans the volume. The UI reports both separately.

## Rehearsal path

Use the README’s **Try the workflow** steps. Budget live model latency; rehearse before recording. If a call fails, preserve the masks and report the error honestly. Do not represent an existing saved proposal as a fresh live response. Manual review/correction and export remain part of the research workflow.

## Scope and limits

- Muse receives metadata, source structure names/IDs, computed metrics, and bounded conversation text. No scan pixels go to Muse.
- Muse plans reversible navigation actions; the client validates them. It does not invoke SAM autonomously.
- SAM receives one grayscale slice and a point, not the entire 3D MRI.
- No reference-case search, diagnosis, clinical validation, automatic 3D segmentation, or measured time-saving study is claimed.
- This pass verified navigation, one successful SAM result, persistence, and export. Painting/undo have unit coverage and previous browser verification; they were not remeasured here.
- Configuration status is not a credit-balance or model-health check. Costs were not measured.

## Checks

23 automated tests passed; production build passed. Coverage includes rejected navigation actions, bounded history, atlas reference identity, in-label seed selection, mask agreement, and cropped SAM raster placement in addition to existing geometry/data tests.
