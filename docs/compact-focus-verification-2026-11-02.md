# Compact workspace focus — November 2, 2026

Added a distinct Focus workspace action for Anatomy and Four views. It hides the large top navigation, study heading, context strip, side panels and default editing toolbar. The mounted viewer remains in place. A 40 px bar retains target name, research-only status, layout switch, tools toggle, export and exit. The cut inspector remains collapsible and outside the canvas. Expand 3D also receives the compact header.

Chrome verification on the saved SPL/NAC right hippocampus workspace:
- Canvas top moved from 325 px to 114 px; height increased from 325.98 px to 537 px on the test window.
- Camera position and orbit target remained identical on entry and exit.
- Both Anatomy and Four views worked in compact mode.
- Tools toggle revealed the original editing toolbar; Guided ROI remained accessible.
- Exit restored the full workspace and previous side-panel settings.
- Escape worked while the rendering select had focus.
- Annotation state is not modified by the focus actions; canvas and slice components are not unmounted.

35 tests passed; production build passed. Screenshot saved locally in work/sari-qa/compact-workspace.png.
