# SARI

**Spatial Anatomy Research Interface**  
_Anatomy in context._

A web-based research workbench for medical imaging professionals, researchers, and medical students. SARI assists exploration and analysis of medical visual data by linking image slices, editable research annotations, computed mask comparisons, and 3D spatial context.

AI-generated regions are draft research proposals for expert review. SARI is not a patient-facing diagnostic or medical-advice service; professional use does not imply clinical validation.

**Research use only. Not clinically validated. Not for diagnosis, treatment, or medical advice.**

## Run locally

Requires Node.js 22.9+ (tested with Node 24).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5187. For a production build:

```sh
npm run build
npm start
```

The server binds to loopback only. Set `PORT` if 5187 is occupied. This is a single-user local prototype, not a hardened multi-user hosting service.

## What works

- Axial, coronal, and sagittal slice views linked to a movable plane in an orbitable 3D view.
- Clicking a slice positions the other slice views at that voxel.
- Light and dark themes; image canvases remain dark in both.
- Window/level, zoom, overlay visibility/opacity, and anatomy opacity controls.
- Proposal-mask paint and erase with undo/redo.
- Deterministic 3D Dice overlap, differing-voxel counts, and navigation to the axial slice with the largest disagreement.
- Browser-local NIfTI import (`.nii` / `.nii.gz`) and matching binary reference-mask import.
- Browser-local session persistence in IndexedDB (current volume, masks, position, and activity trail).
- JSON research-record export with masks, voxel geometry, provenance, metrics, and activity.
- Explicit offline workspace commands when Meta is disconnected. These are deterministic commands, not simulated model replies.
- Server-side Muse Spark navigation tool calling and SAM 3.1 point-prompt segmentation endpoints, disabled by default.

## Included research data and body-first workflow

SARI opens on an interactive **BodyParts3D reference human body**. Click the head or choose **Head & brain** to open the **SPL/NAC brain atlas**, with 0.75 mm MRI and 90 named anatomical surfaces. These are source annotations, not AI findings. MNI population-average templates and the Slicer teaching case are additional studies. Proposals start empty; no model accuracy score is fabricated.

The workspace's **Show full-body context** control places the study at the head of the generic body. This placement is illustrative, not patient-specific registration: the body and MRI come from different reference sources. Imported volumes remain in native voxel axes and must not be assumed to be anatomically aligned.

The body mesh retains its original anatomical geometry; an optional screen-space pixelation filter covers the pelvis for recording. Thorax/heart and neck/thyroid are shown only as future regions, not available studies. BodyParts3D attribution and the MRI source details are available through **Data & attribution** and the bundled notices.

The original procedural 96³ T1-like brain phantom remains available as **Try synthetic study**. Its reference and deliberately perturbed proposal are synthetic, not expert annotations or model output.

Source records and permissions:

- [MNI template and transformation details](public/data/mni152/README.md), including the original [COPYING](public/data/mni152/COPYING).
- [BodyParts3D attribution and adaptations](public/models/ATTRIBUTION.md).
- Reproducible preparation scripts: `scripts/prepare-mni.mjs` and `scripts/prepare-body.mjs`.

## Connect Meta

Copy `.env.example` to `.env` and privately add your key:

```dotenv
MODEL_API_KEY=your_key_here
META_MODEL=muse-spark-1.3-contributor
META_ENABLED=true
PORT=5187
```

Restart the server. The UI should show **Muse Spark connected** when the server is configured. This status checks configuration, not API validity, model entitlement, or credit balance. Live calls still require appropriate Meta account access. Verify the model variant and credit coverage in your own account before enabling calls.

- **Muse Spark** receives the current question, voxel dimensions, slice position, and computed annotation metrics. Questions use metadata by default; the optional **Include region images** workflow shares reviewed clean and marked cross-sections with Muse. The separate **Guided ROI** workflow shares three selected images with Muse only after explicit review and consent. It proposes an ordered plan of up to six validated, reversible navigation actions: select a source atlas region, isolate it, change rendering mode or hemisphere, position an oblique cut, select an axis/slice, or reveal masks. The last eight conversational messages are supplied for follow-up context. This is bounded navigation, not an autonomous diagnostic agent.
- **SAM 3.1** receives only the selected rendered grayscale slice and a selected foreground point, after the user confirms sharing rights. Its returned mask replaces the proposal on that slice only. This is not volumetric segmentation or medical validation.
- API keys stay on the server; never use a `VITE_` prefix for secrets. No `.env` file belongs in Git.
- Free-credit / Contributor terms may allow content to be used for product improvement or training. Dataset permission must cover the intended processing; public availability alone does not establish permission.

Initial offline implementation used no Meta key. Subsequently, account authentication, Muse Spark availability, SAM availability in the model catalog, and a live Muse navigation-tool response were verified. Live SAM segmentation was verified on November 1, 2026: right hippocampus, SPL/NAC axial slice 132 (one-based), point (133,152), 572 proposed pixels versus 581 source-label pixels, 432 intersecting pixels, 74.9% 2D Dice. This single example is not a medical-image performance benchmark. Billing deductions remain unverified. No additional model requests were needed to integrate the bundled MRI and body assets.

## Try the workflow

1. Open **Explore head study** from the body overview.
2. Ask **Explore the left hippocampus**. Muse selects source label 17, isolates it in anatomy view, and selects coronal slices.
3. Ask “Now show its right-side counterpart, keep it isolated, and switch to axial.” Muse should select source label 53. Inspect the actual controls and views; model responses can vary.
4. Click **Use structure as reference**. This derives a binary mask from the selected source atlas label and places a seed inside it.
5. Click **SAM proposal**, review the slice-sharing notice, and confirm only if permitted. A live Meta key and model access are required. Inspect the proposal against the amber source outline; current-slice 2D Dice is separate from whole-volume 3D Dice.
6. Ask “Show it in solid view with both hemispheres, no isolation, and an oblique cut through the selected point, tilt 25 degrees and rotate 35 degrees.”
7. Review/correct the proposal with paint and erase, then **Export review**. The export includes masks, source target, geometry, computed metrics, and action provenance.

SAM is not guaranteed to reproduce source atlas boundaries. The demo should show human review rather than imply automatic correctness. A single-slice proposal compared to a complete 3D structure naturally has low whole-volume Dice.

## Guided ROI and literature exploration

Select a point in a slice or 3D, then choose **Guided ROI**. Draw/edit a box in each preview and enter a research target. After consent, Muse receives three grayscale images plus the shared seed and boxes, and suggests prompts with a rationale. Review and edit those boxes, choose three planes or add 2–6 neighboring axial slices, and approve SAM processing. A second review shows returned voxel counts and cross-plane disagreements before **Apply draft ROI** replaces the proposal.

Reconstruction uses observed sampled masks only; disagreements at intersecting planes are excluded and unsampled voxels remain empty. The isolated proposal is tinted mint. This is a sparse 3D research annotation, not a complete organ reconstruction. Neighboring slices reuse the reviewed axial box/seed as a provisional prompt, not validated tracking. The pipeline uses 1 Muse request plus 3–9 SAM requests; live latency and cost vary. If any request fails, no partial masks are applied.

**Explore literature** opens a separate researcher-reviewed text search. Muse uses Meta search grounding and returns source annotations; SARI requires an actual completed search and source-linked text, otherwise displays an error. Results are literature context, not scan interpretation or a diagnosis. Open original papers to verify applicability, study quality, and limitations; search coverage is not systematic. Only the query is shared. The last ten searches, links, timestamps and ROI generation provenance are retained in the local research record and export. A citation annotation confirms a linked source was returned, not that its claims have been independently clinically validated.

See [guided workflow verification](docs/guided-roi-verification-2026-11-01.md).

## Local data and limitations

Imported data stays in the browser unless the user explicitly approves a SAM slice upload or the Guided ROI workflow (three images to Muse and the reviewed sampled images to SAM). Literature search sends only the reviewed text query to Meta/search services, never scan images. Session data is retained in this browser's IndexedDB; use browser site-data controls to remove it or restore the synthetic study to replace the current saved volume. Export before clearing browser data.

- Scalar 3D NIfTI only; no DICOM, 4D series, PACS, or video import yet.
- Imported volumes retain native voxel axes. They are **not** anatomically reoriented, atlas-registered, or aligned with a body. The UI labels these as I/J/K rather than asserting anatomical orientation.
- The 3D surface is a threshold-derived contextual preview, not a validated anatomical reconstruction. Spacing is used for relative 3D proportions; full oblique affine placement is not implemented.
- Reference import requires matching dimensions and spatial transforms. All nonzero labels are combined into one binary mask.
- At most ten in-session undo states are retained; undo history is not persisted.
- AI generation, slice upload, and large imports can take time. Local file parsing is currently on the main thread.
- The navigation assistant plans bounded workspace actions. Guided ROI provides separately reviewed multi-image Muse prompts and sampled SAM masks. Literature search retrieves source-linked research context, not matched patient cases or clinical judgments.
- Expert annotation review, additional reference cases, clinical evaluation, patient-specific registration, remain outstanding. The supplied whole-brain mask is not ventricular ground truth; comparisons are meaningful only when proposal and reference target the same structure.

## Broader vision

Brain MRI is the starting point, not the limit of the concept. Future extensions may cover the **thorax, thyroid, heart, and other regions**, with modality-specific workflows, suitable licensed data, accurate spatial mapping, and independent evaluation. These are future directions, not implemented functionality. The research-only boundary applies throughout.

Proposed event entry: Indie Developer / Build for Your World. The organizer response to the separately described microscopy project provides relevant context, but is not a project-specific ruling for SARI.

## Verification

```sh
npm test
npm run build
```

Browser checks verified both themes, disagreement navigation, painting, exact undo/redo results, JSON export contents, saved-mask restoration after reload, and an error-free browser console. Full browser file-import verification was blocked by the Chrome extension’s disabled file-URL access; the NIfTI parser was verified with generated fixtures instead. Live Muse region selection, conversational counterpart selection, and SAM mask application were verified on November 1, 2026. See the workflow above for the single-slice result and its limitations.

The tests check known overlap values, worst-slice selection, deterministic phantom generation, coordinate-correct mask edits in every plane, rendered slice dimensions, valid NIfTI decoding, and invalid-file rejection.

## Dependencies and design references

- React / React DOM (MIT): interface.
- Three.js, React Three Fiber, Drei (MIT): 3D rendering and orbit controls.
- Lucide (ISC): interface icons.
- nifti-reader-js (MIT): local volume decoding.
- Express (MIT), OpenAI JavaScript SDK (Apache-2.0): local server and Meta-compatible transport. No OpenAI model is called.
- Meta SAM parser: decode official SAM mask streams; see installed package license.
- DM Sans and IBM Plex Mono (SIL Open Font License): loaded through Google Fonts, with system fallbacks.
- Visual workflow reference: [OHIF viewport documentation](https://docs.ohif.org/user-guide/viewer/viewport/). No OHIF code or images are included.
- Meta integration references: [models](https://dev.meta.ai/docs/models), [media segmentation](https://dev.meta.ai/docs/media-segmentation), [SAM client libraries](https://dev.meta.ai/docs/sam/client-libraries).

The attributed MNI template derivatives and adapted BodyParts3D reference skin mesh are bundled under the source permissions documented above. The separately downloaded legal-agent workshop is not incorporated into this repository. All SARI application code in this repository was created during the hackathon.

### Workspace layouts

Choose **Anatomy** for a large spatial view beside the three scan planes, or **Four views** for the original balanced grid. The choice is remembered locally. The bottom filmstrip shows sampled intensity previews of the active plane; click a thumbnail or use the continuous slider to navigate every slice. The current slice is always included and highlighted. Window and level settings also update the previews. Both layouts support light and dark themes.

### Solid volume and regions

**Solid** is an opaque first-hit voxel volume renderer with a freely oriented
cutaway. Tilt/Rotate/Depth controls set the clipping plane independently of the
three orthogonal slices; turn Cut plane off for the whole volume. Black/low-intensity
background is excluded using the adjustable Solid background threshold in Display.
This is an intensity rendering, not a validated tissue segmentation. **Context**
retains the orthogonal slice plane and approximate intensity surface; alpha-hashed
coverage and depth-tested cutout slices avoid alpha-blend sorting reversals.

Isolate the reference or proposal mask, or CSF/gray matter/white matter on the
2 mm McGill samples. **Tissue colors** uses the supplied atlas probability maps,
not natural color or a lesion prediction. Purple=CSF, amber=gray matter, blue=white
matter. Select a scan seed and **Grow region** to replace the proposal with a
six-connected intensity selection (±12 on normalized uint8 intensities). This is
undoable, not an anatomical classifier, and is capped at 400,000 voxels with an
explicit partial-region notice. These operations run locally without model calls.

The study chooser also offers original-grid 1 mm MNI T1, 2 mm T2 and the
3D Slicer MRBrainTumor1 teaching case. See [research sample provenance](public/data/research/README.md)
for transformations, source checksums and licensing. The tumor name is supplied
by the source; no subtype, pathology confirmation or lesion ground truth is included.

### Viewing on a tablet over Wi-Fi

The server defaults to loopback access. Set `HOST=0.0.0.0` in the ignored local
`.env` and restart to allow devices on your trusted network. Open
`http://<Mac Wi-Fi IP>:5187` on the tablet while the Mac and server remain running.
API requests accept only this machine's local addresses and matching local origins;
unrelated website origins and host names are rejected. The API key remains server-side.
This does not configure router port forwarding or public hosting.

### SPL/NAC anatomy atlas

The body entry now opens the SPL/NAC atlas: source **0.75 mm T1 MRI** plus 90
interactive source surfaces (about 1.64 million triangles). Choose Anatomy in the
3D rendering menu, click a surface or choose a named structure in the sidebar.
The three scans navigate to its label centroid and highlight the source label.
Isolate selected structure hides the other surfaces and frames the selected model;
turn it off to return to the wider view. Context hemisphere opens one side while
retaining the selected structure. Atlas colors shows source region colors.
Solid and Context remain available for the same image volume.

The source MRI grid is retained without spatial downsampling. The source label map
is **1 mm**, resampled by physical coordinates onto the MRI grid; it does not gain
0.75 mm annotation accuracy. All labels and models come from the atlas, not Meta
predictions. This atlas is a separate healthy-volunteer reference, not registered
to imported scans or the generic whole body. See [atlas provenance and license](public/data/spl-atlas/README.md).

The current demo targets the M1 MacBook. A mobile-optimized atlas is not claimed.
The atlas files were converted offline from NRRD/VTK; direct local-file import
continues to accept scalar NIfTI only.

### Linked navigation and image appearance

The blue cursor is one voxel location shared by all three orthogonal scans and
3D. Clicking a scan or a 3D source surface/volume navigates to that location;
selecting an atlas region navigates to its source label centroid. All three scans
show crosshairs, and the 3D marker is deliberately drawn through occluding anatomy
as a navigation overlay. It is not an additional anatomical structure.

With **Link views** enabled, moving or rotating the cut plane moves the shared
anchor to the nearest point on that plane within the volume; orthogonal scans
show the nearest voxel-center slices through that anchor. Amber dashed traces
show the actual oblique plane's intersection with each orthogonal view. An angled
plane is not itself an axial/coronal/sagittal slice. Presets align it to one of the
three axes. Moving a slice or selecting a point/region also moves the linked plane
through the shared location. Uncheck Link views to explore the cut independently.

Display adds intensity gain, contrast, grayscale/Ice/Amber color maps, 3D background,
ray quality and a **Translucent volume** rendering mode. This mode composites
samples front-to-back within each ray, with adjustable volume opacity and optional
stable pixel-based jitter; it does not use mesh alpha sorting to reveal internal
voxels. Intensity maps are display palettes, not natural color, tissue classification
or diagnostic evidence. MRI values are normalized intensities, not Hounsfield units.
Fine quality uses more ray samples and can reduce frame rate. No new model calls
or patient uploads are required by these controls. Local display settings persist.

A click in a translucent volume picks the first threshold-passing foreground voxel
along the viewing ray (subject to the current cut and isolation mask); it does not
infer which deeper structure the user intends. Orthogonal slice clicks specify a
voxel directly. Point markers remain visible through surfaces for orientation.

## Spatial inspection workspace

Use **Expand 3D view** in the spatial viewer header to inspect anatomy at workspace size. Return restores the existing Anatomy or Four views layout with the same camera and annotations. **Fit to visible content** and **Reset camera** recover framing after zoom or rendering-mode changes. Cut-plane and isolation settings are in the collapsible **3D inspector** above the canvases.

Drag the workspace dividers or focus one and use arrow keys to resize panels. The rail toggles the study library and assistant. On narrow desktop widths the assistant stays alongside the images; below mobile widths it becomes a drawer. See [Chrome verification](docs/spatial-inspection-verification-2026-11-01.md).

**Focus workspace** also removes the large page header and editing chrome while retaining all linked views. A compact 40 px bar keeps the active target, layout switch, tools toggle, export and **Exit focus**. Escape returns to the full workspace. Expanding just the 3D view uses the same compact header. Camera, annotations and side-panel preferences are retained in session.

The Muse assistant also answers educational anatomy questions about a named atlas selection: identity, general location and commonly described functions. This uses the supplied atlas label, not visual recognition of the scan. Unlabeled points or draft regions are not assigned invented anatomical identities. General educational questions do not require image sharing; patient-specific diagnosis and treatment remain outside scope. Source-backed follow-up is available in Explore literature. A live test of “Can you tell me what the currently selected part is? What functions it has?” with the right inferior temporal gyrus returned an educational explanation and no navigation actions on November 2, 2026.

## Questions about unlabeled marked regions

Enable **Include region images · review before sending** beneath the assistant. Asking opens a preview, rather than sending immediately. Choose the marked proposal (a representative point inside the mask) or current crosshair. Review three grayscale views and three corresponding marked copies, then approve sending them with the question to Meta. The full volume is not uploaded. Mint and blue are explicitly identified as annotations, not tissue colors. Each image-enabled question requires a fresh review.

Muse can describe visible spatial context, suggest a tentative anatomical identity when supported, explain general functions conditional on that identity, and identify missing evidence. It must distinguish these suggestions from source atlas labels and cannot diagnose disease or establish clinical meaning. Images are not automatically included in later conversation turns or sent to literature search. The reviewed plane metadata and sharing event appear in the conversation/activity; image bytes are not persisted in conversation history.

A live public-atlas test on November 2, 2026 returned a qualified, image-grounded explanation for an unlabeled proposal with no atlas selection. Existing reference metadata was present, so this is an integration test, not an independent anatomical recognition benchmark.

### Saved research views

New questions, answers and Activity events retain their visual context. **Restore view** returns to the saved camera, slices, cut plane, selected anatomy, rendering settings, layout and reference/proposal masks. When Muse navigates, **Question view** preserves the starting context separately from the answer's resulting view. Reviewed image questions also retain a **Shared image slices** view for the attachment anchor.

Restoring makes no AI request and first saves the current workspace in Activity. Conversation, saved views and compressed, deduplicated historical masks persist locally in IndexedDB and are included in the review JSON export. History is scoped to the active study; switching studies clears it. Older entries created before this feature have no recoverable snapshot. The latest 100 messages and 100 Activity entries are retained; unreferenced snapshots are pruned. See [verification notes](docs/saved-view-verification-2026-11-02.md).

### Research an answer

Muse answers offer **Research this answer**. The literature explorer carries the preceding question and answer, plus original six reviewed images when their saved snapshot is available. It reconstructs those images from the saved masks and slice anchor without changing the current workspace. Review the context and approve **Draft research question**; Muse then returns an editable question. Approve and use **Search with Muse** to run the existing source-linked literature search. Only the final question is passed to web search; image/question/answer context is sent to Meta only for the separately approved drafting step. Search results retain their conversation and saved-view references in the review export. Older conversations without image snapshots use text context only. AI answers and region identities remain hypotheses, not verified findings.
