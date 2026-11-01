> Follow-up implementation: see [live demo verification](demo-verification-2026-11-01.md). Muse atlas navigation, conversational follow-up, one successful SAM example, and export are now verified. The assessment below records the earlier review.

# SARI — hackathon readiness review

Reviewed 1 November 2026. Evidence: current repository at c53ece4; live official
Meta event page, signed-in Cerebral Valley rules and submission form; 18 passing
local tests. No submission fields were edited and no project was submitted.

## Official event and submission facts

- Track: Indie Developer Track. Theme: Build for Your World. Both are already
  selected in the inspected submission form.
- Deadline: 4 November 2026, 21:00 America/New_York = **5 November, 03:00 Europe/Berlin**.
- Official scoring: Impact 30%; Use of Meta AI Tooling 25%; Technical Depth &
  Execution 20%; Demo 25%. These are project-judging weights, not application weights.
- The signed-in form includes team name/members, track/theme, project description,
  Public GitHub Repository, 3-Minute Demo Video, use of Meta products, why Meta's
  models matter, partner feedback, participant surveys, and a promotional-use
  checkbox. Personal opinions and permissions need the participant's own answers.
- GitHub CLI confirms msonnendeck/sari-anatomy is PUBLIC.
- A hosted-product URL is not a separate field in the currently inspected form.
  Working judge access or reproducible setup is still valuable; don't invent a
  hosting requirement or a different video duration.
- The form does not demand an unsupported claim that other providers cannot build
  similar capabilities. Explain the demonstrated benefit of the selected Meta
  stack. No head-to-head superiority claim has been established.

Sources:
https://dev.meta.ai/events/global-hackathon
https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver
https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit

The Devpost connector required reauthentication; official rules and form were
instead verified directly in authenticated Chrome. No Devpost workflow state or
rules-review acknowledgment was created. Organizer pages prevail if requirements
change.

## Readiness by judging area (qualitative assessment, not predicted scores)

| Area | Current strength | Gap |
| --- | --- | --- |
| Impact, 30% | Founder knows the domain; clear spatial-context problem | A specific researcher workflow and observed benefit have not been demonstrated with users |
| Meta AI tooling, 25% | Server-side Muse tool-calling integration; SAM endpoint and consent flow | AI is not central to most visible capabilities; live SAM feasibility unverified; Muse has no scan pixels and only one limited navigation action |
| Technical execution, 20% | Real .75mm MRI, 90 named source surfaces, verified label alignment, linked oblique cuts, volume rendering, editing/export, public repo, 18 tests | No measured M1 performance baseline or complete AI workflow regression; readme has older MNI-entry instructions |
| Demo, 25% | Strong visuals and interactive flow | No final 3-minute video, narration, rehearsal, judge-oriented setup or submission write-up |

## What is implemented and evidenced

- Body overview, named anatomy selection and isolation, hemisphere context.
- High-resolution SPL/NAC atlas; additional MNI T1/T2 and source-labeled tumor case.
- Three orthogonal views, shared point markers, cut-plane linking and intersection
  traces; independent-cut toggle; atlas/solid/translucent/context views.
- Light/dark, display palettes, window/level, intensity/contrast, opacity, quality,
  jitter, recording pixelation, local NIfTI import, session save and JSON export.
- Manual and intensity-grown proposal masks; undo/redo; deterministic mask metrics.
- Source attribution, research-only boundary and documented data transformations.
- Previous live Muse tool response is documented; current model configuration is
  muse-spark-1.3-contributor. A connection badge proves configuration, not model
  health, credit balance, scientific accuracy or successful segmentation.

## Most important gaps

1. **Make the AI do the central research task.** Extend Muse from choosing a slice
   to source-grounded atlas region selection, synchronized camera/cut navigation,
   and the relevant annotation tools. Preserve multi-turn context. If adding
   vision, explicitly share only permitted research slices and distinguish
   observations, source annotations, model proposals and uncertainty.
2. **Verify SAM on a permitted research image.** Preserve original mask on errors,
   record model/prompt/sample provenance, and show human review and correction.
   A 2D mask does not establish 3D or medically validated segmentation.
3. **Use matching annotation targets.** A hippocampus proposal must be compared
   against a hippocampus reference, not a whole-brain extraction mask. Synthetic
   Dice is a software demonstration, not evidence of model accuracy.
4. **Demonstrate the benefit honestly.** Run 3–5 research navigation/annotation
   tasks, record steps/time and outcomes, and get domain feedback if available.
   Do not claim measured time savings or clinical improvement without evidence.
5. **Prepare the submission.** Three-minute video, concise project/Meta rationale,
   screenshots, clean reproducible instructions and exact model/data provenance.
   Decide judge access; keep private API credentials out of all demo materials.

## Scope discipline

Keep head/brain as the working prototype. Thorax, thyroid and heart remain the
extension story. DICOM/PACS, patient-specific registration, clinical diagnosis,
large-scale retrieval and more cosmetic controls should not displace the core AI
workflow before the deadline. Colin27 has been researched, not integrated. Current
SPL NRRD/VTK assets were converted offline; direct import remains NIfTI.

## Recommended remaining sequence

- **2 November:** validate Meta calls and SAM; implement source-grounded atlas
  navigation and a small coherent assistant workflow.
- **3 November:** test/rehearse that workflow on permitted examples; fix failures,
  evaluate a few representative tasks, finalize judge setup and documentation.
- **4 November:** record and verify the 3-minute video; prepare form answers and
  submit with a buffer ahead of 5 November 03:00 Berlin. Final submission and
  permission checkboxes require the participant's review.

Suggested demonstration: identify a known atlas structure → ask Muse to locate it
and arrange the views → inspect the synchronized cut → request a SAM proposal →
review/correct against a matching source annotation → export a provenance-bearing
research record. All AI steps in this sequence still need end-to-end verification.
