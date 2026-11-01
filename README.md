# SARI

**Spatial Anatomy Research Interface**  
*Anatomy in context.*

A planned web-based research workbench linking medical image slices, editable annotations, and 3D anatomical context using Meta AI.

## Status

Project initialization for the Meta Global AI Developer Hackathon 2026. No application or model integration is implemented yet. Proposed entry: Indie Developer Track / Build for Your World. Eligibility of the specific research scope has not yet been confirmed by an organizer.

## The problem

Reviewing annotations across 2D slices requires researchers to repeatedly navigate views, compare boundaries, and document corrections while maintaining a mental model of 3D anatomy.

## Planned first workflow

Focus on one brain MRI research task and a small, appropriately licensed dataset with reference annotations:

1. Navigate synchronized scan slices and a 3D anatomical view.
2. Ask Muse to navigate to annotation disagreements using explicit comparison tools.
3. Explore SAM 3.1 proposals for researcher-selected structures.
4. Inspect and correct masks, then recompute agreement with reference annotations.
5. Export a reproducible record of sources, model settings, measurements, and corrections.

These are planned capabilities, not claims of working functionality or validated model performance. Dataset selection and feasibility evaluation remain outstanding.

## Broader vision

Brain MRI is the starting point for SARI, not the limit of the concept. The longer-term vision is a spatial research interface that can expand to other anatomical regions, including the thorax, thyroid, and heart, with region-specific imaging workflows and annotation tools.

These extensions are future directions, not implemented features. Each additional region and imaging modality will require suitable licensed data, appropriate spatial mapping, and its own evaluation. The research-only boundary applies throughout.

## Research boundary

**Research use only. Not clinically validated. Not for diagnosis, treatment, or medical advice.**

No patient-facing interpretation, abnormality detection, or recommendations for care are planned. Researchers retain responsibility for reviewing annotations. Do not upload personal medical records or identifiable patient data.

## Proposed Meta integration

- Muse Spark: tool-driven navigation and workflow coordination.
- SAM 3.1: experimental assisted segmentation.
- Deterministic comparison tools: numerical measurements, rather than model-generated estimates.

Model access, data-use permissions, credit coverage, and segmentation performance must be checked before use. No credentials belong in the browser bundle or repository.

## Development and attribution

This fresh repository starts with documentation only. Application implementation will be developed during the hackathon. Third-party libraries, datasets, and assets must be attributed with their licenses before inclusion. The separately downloaded legal-agent workshop is not included here.

## Running

No runnable application yet. Setup instructions will be added with the implementation.
