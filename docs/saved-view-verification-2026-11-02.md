# Saved view verification — 2 November 2026

## Behavior

Questions retain the original workspace. Answers that navigate retain the resulting workspace after the camera settles. Activity titles restore their saved view. Camera pose, target, zoom, slice indices, point, cut settings, selected atlas region, rendering/display settings, workspace layout and mask contents are restored together. A backup Activity entry preserves the workspace before each restore. Restoring is entirely local and does not contact Meta.

Snapshots validate the study grid before applying either mask. Historical masks use run-length or bit-packed encoding and share identical content. Review exports include the snapshot archive and messages. Existing older entries remain readable but cannot acquire historical views retroactively.

## Verification

- 42 automated tests pass; production build and whitespace check pass.
- Chrome: isolate right hippocampus, ask Muse to show the left hippocampus in coronal anatomy view. Question view restores right; answer view restores left. Repeated after page reload, with all six test messages retained.
- Found and fixed a capture timing issue: navigation state could precede the camera update. Capture now waits for the camera's study/rendering context to match the saved view; pending answers cannot be restored prematurely.
- Restored left hippocampus camera position and target exactly matched the settled answer camera (maximum position difference zero).
- Changed to Solid/Four views and painted the proposal. Restoring the answer recovered the preceding Anatomy view and original masks; the pre-restore Activity backup retained the changed layout and marking.
- Export comparison: proposal and reference SHA-256 hashes match the preceding baseline exactly. Historical masks contain 5,743 original proposal voxels, 10,349 reference voxels and 5,772 edited proposal voxels. Six current-format saved views share three masks; archive size 106,608 bytes.

Research-only boundaries and image-sharing consent remain unchanged. A saved view is visual provenance, not evidence of model accuracy or clinical validation.
