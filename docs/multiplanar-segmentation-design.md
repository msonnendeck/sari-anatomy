# Multiplanar research segmentation: proposed next step

## Intended audience

SARI supports medical imaging professionals, researchers, and medical students in exploring and analyzing medical visual data. Generated annotations are draft research proposals requiring expert review. The prototype is not clinically validated and does not provide patient-facing diagnosis, treatment recommendations, or medical advice. Professional audience and draft status describe intended use; they do not establish clinical validity or blanket eligibility for additional medical features.

## Verified API boundary

Meta SAM 3.1 documentation describes image/video segmentation with concept prompts or box/point prompts. It does not document a medical-volume endpoint or a JSON contract for joint orthogonal-view reasoning. Mask tokens cannot be used as prompts. SVG contours can represent outputs in SARI; user-drawn splines can be converted into boxes and sampled positive/negative points for API input.

Sources checked November 1, 2026:
- https://dev.meta.ai/docs/sam/segmenting
- https://github.com/meta-models/meta-sam/blob/main/protocol/sam3.md

## Proposed first implementation (not implemented yet)

1. Keep one shared seed in voxel coordinates (i,j,k), with spacing and affine retained for physical coordinates.
2. Capture axial k, coronal j, and sagittal i images. Convert the seed with SARI's existing slicePoint projection, including pixel-axis flips. Never reuse the same raw (x,y) in all views.
3. Use a SARI JSON job manifest to associate each plane, image size, source slice, seed, target, and returned mask. Translate each entry into a separate supported SAM image request. Bound concurrency and disclose the three-image upload before sending.
4. Retain the three masks independently, checking agreement along their intersecting lines. Overlap disagreements are review cues, not calibrated confidence scores. Failures preserve the existing proposal; avoid partially applying a three-view job without explicit review.
5. Show contours in all three views and place the masks in their real voxel planes in 3D. This is a sparse multiplanar annotation, not a full 3D segmented structure.
6. For a volumetric proposal, segment additional neighboring parallel slices within a user-selected range. Propagate prompts/crops cautiously, inspect discontinuities, and retain per-slice provenance. Compare reconstruction against a held-out source atlas label rather than simply filling space between three contours.
7. Render the resulting voxel label mask as a colored volume or derived mesh; isolation already works with proposal masks. SVG paths are a presentation/export form, not the underlying 3D geometry.

## Avoiding circular evaluation

If source atlas labels supply boxes or masks, record that assistance. Do not claim an independent automatic discovery or an unbiased segmentation benchmark. A user seed and manually drawn box also belong in the provenance.

## Why three views alone are insufficient

Three perpendicular cross-sections constrain only a sparse part of a volume. Multiple different 3D shapes can have those same sections. Extrusion, intersection of extrusions, or contour interpolation adds geometric assumptions, not new image evidence. Such reconstructions must be labeled provisional and inspected against additional slices.

## Alternative worth exploring later

Muse can potentially inspect a multi-image bundle and propose region prompts, while SAM supplies pixel masks and SARI handles geometry. This is a separate multimodal integration from the current metadata-only Muse assistant. Rotating between axial/coronal/sagittal images is not equivalent to neighboring frames in a video; video tracking should not be assumed to solve cross-plane registration.

## Implementation update — November 1, 2026

The Guided ROI workflow now implements human boxes, three-image Muse prompt review, 3–9 separate SAM slice requests, cross-plane conflict checks, sampled-mask reconstruction, isolation, and exported generation provenance. A five-plane public-atlas run was applied live. No interpolation fills missing volume. A separate text-only literature explorer uses Meta search grounding with returned citation annotations. See [verification](guided-roi-verification-2026-11-01.md).
