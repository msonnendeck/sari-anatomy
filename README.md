# SARI

**Spatial Anatomy Research Interface**  
_Anatomy in context._

A web-based research workbench linking image slices, editable annotations, computed mask comparisons, and 3D spatial context.

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

SARI opens on an interactive **BodyParts3D reference human body**. Click the head or choose **Head & brain** to load the **MNI ICBM152 2009c symmetric T1 MRI template** and its supplied whole-brain extraction mask. This template is an average derived from real MRI scans, not an individual patient scan. The bundled 2 mm derivatives retain the RAS-aligned grid and source copyright notice. The proposal starts empty; no model accuracy score is fabricated.

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

- **Muse Spark** receives the current question, voxel dimensions, slice position, and computed annotation metrics. It does not receive scan pixels in assistant requests. It can select one bounded navigation tool per request. Conversation history is not currently sent.
- **SAM 3.1** receives only the selected rendered grayscale slice and a selected foreground point, after the user confirms sharing rights. Its returned mask replaces the proposal on that slice only. This is not volumetric segmentation or medical validation.
- API keys stay on the server; never use a `VITE_` prefix for secrets. No `.env` file belongs in Git.
- Free-credit / Contributor terms may allow content to be used for product improvement or training. Dataset permission must cover the intended processing; public availability alone does not establish permission.

Initial offline implementation used no Meta key. Subsequently, account authentication, Muse Spark availability, SAM availability in the model catalog, and a live Muse navigation-tool response were verified. Live SAM segmentation, medical-image performance, and billing deductions remain unverified. No additional model requests were needed to integrate the bundled MRI and body assets.

## Try the workflow

1. On the body overview, click the head to open the real MNI template. Use **Show full-body context** to view its contextual head placement.
2. For the prepared disagreement demonstration, choose **Try synthetic study** from the overview, then select **Review largest difference**.
3. Inspect the mint proposal and amber reference outline.
4. Choose **Paint proposal mask** or **Erase proposal mask**, then draw on a slice.
5. Observe the updated numeric overlap and 3D mask. Undo and redo the edit.
6. Ask **Compare annotation overlap** or **Show the reference outline**.
7. Export the research record. Reload to verify the current study is retained locally.

## Local data and limitations

Imported data stays in the browser unless the user explicitly requests a SAM slice upload. Session data is retained in this browser's IndexedDB; use browser site-data controls to remove it or restore the synthetic study to replace the current saved volume. Export before clearing browser data.

- Scalar 3D NIfTI only; no DICOM, 4D series, PACS, or video import yet.
- Imported volumes retain native voxel axes. They are **not** anatomically reoriented, atlas-registered, or aligned with a body. The UI labels these as I/J/K rather than asserting anatomical orientation.
- The 3D surface is a threshold-derived contextual preview, not a validated anatomical reconstruction. Spacing is used for relative 3D proportions; full oblique affine placement is not implemented.
- Reference import requires matching dimensions and spatial transforms. All nonzero labels are combined into one binary mask.
- At most ten in-session undo states are retained; undo history is not persisted.
- AI generation, slice upload, and large imports can take time. Local file parsing is currently on the main thread.
- The assistant is a bounded single-step tool caller, not yet a multi-turn autonomous research agent.
- Expert annotation review, additional reference cases, clinical evaluation, patient-specific registration, and live SAM feasibility testing remain outstanding. The supplied whole-brain mask is not ventricular ground truth; comparisons are meaningful only when proposal and reference target the same structure.

## Broader vision

Brain MRI is the starting point, not the limit of the concept. Future extensions may cover the **thorax, thyroid, heart, and other regions**, with modality-specific workflows, suitable licensed data, accurate spatial mapping, and independent evaluation. These are future directions, not implemented functionality. The research-only boundary applies throughout.

Proposed event entry: Indie Developer / Build for Your World. The organizer response to the separately described microscopy project provides relevant context, but is not a project-specific ruling for SARI.

## Verification

```sh
npm test
npm run build
```

Browser checks verified both themes, disagreement navigation, painting, exact undo/redo results, JSON export contents, saved-mask restoration after reload, and an error-free browser console. Full browser file-import verification was blocked by the Chrome extension’s disabled file-URL access; the NIfTI parser was verified with generated fixtures instead. Live Meta calls were not tested.

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
