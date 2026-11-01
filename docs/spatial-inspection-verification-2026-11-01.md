# Spatial inspection backlog: implementation and verification

## Implemented

- Cut and isolation controls moved from the rendered anatomy to a collapsible **3D inspector** above the viewer.
- **Expand 3D view** enlarges the existing canvas; **Return to layout** or Escape restores the layout without unmounting the canvas or slice components.
- Draggable, keyboard-operable separators resize the library, assistant, 3D/slice columns, and Four views rows. Both side panels can collapse. On narrow desktop widths the assistant remains adjacent; the library collapses automatically when crossing the breakpoint.
- Central camera fitting handles atlas isolation, proposal/reference masks, whole volume, Solid, Volume, and body context. **Fit to visible content** retains viewing direction; **Reset camera** restores a useful default direction and fits content. Layout changes do not trigger camera fitting.
- Activity shows concise event labels and preserves the complete original record in expandable details.
- Help is generated from the active atlas, bundled, synthetic or imported study.
- Selected anatomy, reference and proposal labels are separate. Source-reference overlap and intersecting-prediction conflicts are separately described; sampled coverage and non-confidence wording accompany measurements.
- Toolbar actions have stable names; local storage and approved external image processing are explicitly distinguished.
- Literature results split into findings, checklist and limitations with citation offsets retained. A previous saved search can be reviewed without issuing another model call.

## Chrome checks

Verified on the existing local SPL/NAC workspace with its saved five-plane ROI:

1. Anatomy and Four views layouts; inspector controls are outside the canvas. DOM bounds showed no overlap between the open inspector and canvas.
2. Isolated right hippocampus; expand, return and layout switch retained identical camera position and orbit target. Focus increased the canvas footprint while retaining the selected structure and rendering state.
3. Switched from isolated anatomy to whole-volume Solid, proposal-only Solid and whole-volume Volume. Camera framing recovered useful scale for each.
4. Repeated zoom inputs substantially reduced camera distance; Fit and Reset both restored usable framing.
5. Dragged the 3D/slice divider and assistant divider; widths changed. Keyboard divider resizing no longer changes slice coordinates (a propagation conflict found during testing was fixed).
6. At 1000 × 800, the assistant composer and images were visible together; assistant remained adjacent rather than below the workspace. Temporary viewport override was reset.
7. Collapsed/restored the assistant without losing the study; library collapse and focus behavior also checked.
8. Activity showed “Applied draft ROI · right hippocampus · 5 sampled planes”; expanding Technical record retained model/provenance text.
9. Atlas help described 90 source structures, source attribution and illustrative body registration; no phantom description was shown. Other study-source variants are unit-tested.
10. Saved literature displayed Context, Findings, Checklist and Limitations, retaining all seven citation annotations and four original source links. No new model calls were needed for these presentation tests.
11. Exported the final research record. SHA-256 comparisons against the pre-change export confirmed identical proposal and reference masks: 5,743 proposal voxels, 10,349 reference voxels, five ROI planes and one saved literature search.

## Checks and limits

35 automated tests passed; production build passed. Camera geometry tests cover anisotropic voxels, mask isolation, empty masks, body framing and narrow aspect ratios. Presentation tests cover truthful study help, retained technical records and citation span relocation.

These are desktop Chrome checks, not a mobile-device or full assistive-technology certification. Native small-screen drawers remain available below desktop widths. Camera state is preserved across in-session layouts and panel changes; reloading still opens the overview and fits the restored study as before.
