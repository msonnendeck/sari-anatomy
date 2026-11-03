# SARI — submission copy

Draft prepared 3 November 2026 against the signed-in Cerebral Valley submission form. Nothing has been entered or sent. Sections 1–7 contain copy for the actual form. Section 8 contains suggested personal survey answers for the entrant to confirm. Sections 9–11 are optional supporting copy and preparation notes, not additional official fields.

## 1. Team Name

SARI

Track: Indie Developer Track

Problem statement: Build for Your World

Project name: SARI — Anatomy in Context

Expanded name: Spatial Anatomy Research Interface

## 2. Project Description

Medical images contain extraordinary detail, but understanding them requires more than looking at a slice. A researcher must connect a point in a two-dimensional image to three-dimensional anatomy, find the right viewing angle, keep an annotation in context, and relate a question to published evidence. That often means moving between an image viewer, an anatomy reference, notes and a literature search—and mentally holding the connections together.

SARI brings those connections into one research workspace. Starting from a human-body overview, users enter a brain study and explore linked axial, coronal and sagittal images alongside interactive 3D anatomy. A crosshair, cut plane or marked region stays connected across views. Researchers can isolate structures, adjust rendering, and choose a clean light or dark workspace.

The human leads; Muse and SAM assist. Researchers can ask Muse Spark to arrange the views, explain the general functions of an atlas-labeled structure, or discuss reviewed image cross-sections with appropriate uncertainty. In Guided ROI, the researcher chooses a target and seed, Muse suggests image-based segmentation prompts for review, and SAM 3.1 produces draft masks. SARI combines the sampled masks into a sparse research proposal that the human can inspect, correct and isolate. It preserves which planes were sampled rather than pretending to have segmented an entire organ.

From an answer, researchers can ask Muse to formulate an editable literature question using the original question, answer and reviewed image context. A separate sourced search helps them follow the evidence. Questions and answers also retain restorable views, linking the conversation to the exact slices, camera and markings that prompted it.

My medical background made this a personal project. I wish I had a tool like SARI while studying medicine: something that made anatomy easier to explore spatially and let me follow a question without losing my place. I built the starting point I would want to use myself, with room to extend beyond the brain to regions such as the thorax, heart and thyroid.

SARI is for professional research and medical education. Research use only; not clinically validated and not for diagnosis, treatment or medical advice.

## 3. Public GitHub Repository

https://github.com/msonnendeck/sari-anatomy

## 4. 3-Minute Demo Video

[ADD FINAL VIDEO URL — verify that judges can open it without requesting access]

## 5. Describe your use of Meta products to build the submitted project

I used Muse Code during app creation, directing and iterating on SARI’s spatial visualization and research workflow. I was particularly impressed by the visual fidelity I could achieve when I gave the coding agent clear direction and reviewed the results. Codex also supported implementation, debugging and verification; this was an iterative, human-directed build.

Two Meta models are integrated into the app through the server-side Meta Model API:

- Muse Spark (`muse-spark-1.3-contributor`) powers the research assistant, validated navigation actions, reviewed image questions, draft ROI prompts, literature-question formulation and source-linked literature exploration.
- SAM 3.1 creates prompted segmentation proposals from selected research cross-sections. In Guided ROI, it works from human-reviewed prompts suggested by Muse across sampled planes. Users inspect and correct the resulting draft masks.

I designed the cooperation around visible handoffs: the human selects and approves; Muse helps frame and navigate the task; SAM proposes masks; the human reviews the result. Image-sharing steps require explicit review. API keys remain on the server, and saved views and provenance preserve the context of each research action.

## 6. Why are Meta’s models important to your solution?

Meta’s models contribute at three different stages: building the experience, guiding exploration, and proposing image regions for review.

Muse Code helped me turn a medically motivated idea into an interactive spatial workspace. What impressed me was the fidelity of the result and the unusual visualization I could achieve through clear direction and iteration. It made an ambitious solo prototype feel achievable.

Inside SARI, Muse Spark connects a researcher’s language to the workspace: selecting a known structure, changing the viewing angle, explaining general anatomy, and helping formulate the next research question. SAM 3.1 adds a complementary capability: prompted image segmentation. Together, they support a workflow in which the human remains in control of the target, prompts and interpretation.

The value is in connecting the steps. A question can lead to a better view, a reviewed region, and a literature search while retaining its original spatial context. I see considerable potential for research and education. SARI demonstrates the practical value of combining these Meta tools in a single, human-led research workflow.

## 7. Provide feedback from your experience using partner technologies

I did not use Fireworks, Modal or Baseten in this prototype, so I cannot offer a firsthand evaluation of those partner services. SARI’s model integrations use Meta Model API directly.

Optional Meta feedback, if an appropriate free-text feedback field is available elsewhere:

Muse Code’s visual output and the combination of Muse Spark with SAM were the most exciting parts of this experience. Clear human direction and iterative review were essential. More consistent source annotations in literature responses and clearer diagnostics for model-access differences between local and hosted environments would make the workflow more dependable. The prototype works locally, but the Render deployment currently encounters model-access failures; I have not established the underlying cause.

## 8. Personal survey answers — suggestions to confirm, not selections made

The form asks for opinions; these should reflect the entrant’s own experience. No survey answer or promotional permission has been selected by this draft.

| Exact form question | Suggested answer / decision |
| --- | --- |
| How likely are you to build with Meta Model API? | Very likely — consistent with the enthusiasm expressed for continuing SARI. |
| How would you describe your overall opinion of Meta Model API? | Very favorable — confirm that this represents your view alongside the reliability issues encountered. |
| How likely are you to recommend the Meta Model API to another developer or engineering team building with LLMs? | Suggested 4/5; confirm your own rating. |
| How likely are you to recommend Muse Code to another developer or engineering team? | Suggested 5/5, based on your stated experience; confirm. |
| What was the biggest obstacle your team hit while building this project? | Errors / outages or unreliable service — a defensible choice given missing search citations and hosted model-access failures. Confirm it was the biggest obstacle for you. |
| Compared with other AI models your team has used for the same kind of work, how did Meta’s models perform on this project? | We've used other models but couldn't make a clear comparison — the project used multiple tools without a controlled comparison. Choose a different option only if you have a clear personal comparison to make. |
| When your team chooses an AI model or coding tool, what matters most? | Quality of the answers and code — suggested from your emphasis on fidelity; confirm your priority. |
| What makes it hardest for your team to switch to a different AI model or coding tool? | Integration work such as new APIs SDKs or formats — suggested; confirm rather than infer a business constraint. |
| If your team took this project to production, what would most likely stop you from using Meta’s models? | How our data and our users’ data would be stored or used — suggested for a medical research workflow. Reliability or uptime is another concrete concern. Choose the one that most accurately reflects your view. |

Most Viral Track X post: leave blank unless entering that optional competition with an actual post.

Promotional-use permission: review and decide yourself. The live form grants Meta and Cerebral Valley permission to use, publish, share and promote the materials. This draft does not grant that permission.

## 9. Optional supporting copy

### Tagline

Medical imaging, in anatomical context. Human-led exploration with Muse and SAM.

### Short description

SARI connects brain scans, interactive 3D anatomy and a conversational research assistant. Explore linked slices, review Muse-guided SAM segmentation proposals, follow questions into sourced literature, and restore the exact view behind an answer. Built with Muse Code and supported by in-app Muse Spark and SAM 3.1. For professional research and medical education only.

### Founder statement

I wish I had SARI when I was studying medicine. Understanding anatomy meant constantly translating flat images into a three-dimensional picture in my head. What excites me now is being able to explore that context directly, ask a question, and follow it into the research without losing my place. I was genuinely impressed by the fidelity I could achieve while directing Muse Code, and by the possibilities of a workflow where the human leads and Muse and SAM assist. This is a starting point, but it is one I would have wanted as a student and would be excited to put in front of colleagues in medical imaging and research.

### “With SARI, I…” workflow

- Find the anatomical context behind a slice.
- Mark the point or region I want to investigate.
- Ask Muse to help me navigate and frame my question.
- Review segmentation prompts and inspect SAM’s draft proposal.
- Follow the discussion into source-linked literature.
- Return to the exact view and markings behind a previous answer.

### Video title

SARI — Anatomy in Context | Human-led medical imaging research with Muse and SAM

### Video description

SARI is a research prototype connecting linked MRI slices, interactive 3D anatomy, Muse Spark and SAM 3.1. The researcher leads: select a region, inspect reviewed image context, evaluate draft segmentation proposals and follow questions into sourced literature. Saved views connect each answer to its original slices and markings.

Built with Muse Code, with additional implementation and verification support from Codex.

Code: https://github.com/msonnendeck/sari-anatomy

Research and educational use only. Not clinically validated. Not for diagnosis, treatment or medical advice. Brain imaging is the current scope; additional anatomical regions are future extensions.

## 10. Preparation notes — not form copy

- Live form inspected on 3 November 2026 at https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit . Its text fields had no HTML maximum lengths when inspected. Use the actual labels in sections 1–8; do not invent extra official fields.
- The official event page currently gives 4 November 2026, 9 PM ET as the project deadline: 5 November, 03:00 Europe/Berlin. Verify the final video and submit with a buffer.
- Video: final link outstanding; the form asks for a 3-minute demo.
- The public repository is present. No root software LICENSE file was found during preparation. The organizer announcement explicitly asks for open-source GitHub code. Confirm the intended software license before final submission; the bundled datasets and anatomy assets keep their own licenses and attribution. Do not imply that public visibility alone grants an open-source license.
- Muse Code use is included on the entrant’s explicit firsthand account. The development record also includes substantial Codex work; do not describe the build as exclusively Muse Code or exclusively any other agent.
- Two in-app Meta models: Muse Spark and SAM 3.1. Muse Code is the development tool, not a third selectable assistant in the app. Do not claim Muse Wonder or Muse Image was integrated.
- Hosted URL: https://sari-research-demo.onrender.com . Password protection works, but hosted Meta calls remain unresolved. Do not describe the hosted demo as a verified complete AI workflow. The local server is the verified recording path. Share any judge credentials privately through an appropriate channel, never in public form prose, repository text or video.
- There is no dedicated hosted-product URL field in the inspected form. The public code and video are required; a local reproducible setup is documented in README.md.
- Do not claim clinical accuracy, measured time savings, adoption by colleagues, a full 3D organ segmentation, exhaustive literature coverage, direct DICOM/PACS import or working thorax/thyroid/heart analysis. Those are not established by this prototype.
- Known source labels, human markings, AI proposals and literature claims must stay distinguishable. Draft ROI reconstruction represents sampled planes only, not a validated complete volume.
- General anatomy education is supported; patient-specific diagnosis or treatment advice is outside the product’s scope.

## 11. Evidence for technical statements

- Source: README.md; server/index.mjs; server/roi-api.mjs; server/evidence.mjs; server/research-question.mjs; src/main.jsx; src/view-snapshots.mjs.
- Verification: docs/demo-verification-2026-11-01.md; docs/guided-roi-verification-2026-11-01.md; docs/saved-view-verification-2026-11-02.md.
- Current automated suite: 54 passing tests in the latest full run. This tests software behavior, not clinical performance.
- Official form and event sources: https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit and https://dev.meta.ai/events/global-hackathon .
