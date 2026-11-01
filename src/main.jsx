import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUp,
  Box,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Command,
  Compass,
  Crosshair,
  Eraser,
  Expand,
  Eye,
  EyeOff,
  FileUp,
  Focus,
  Layers,
  Loader2,
  Maximize2,
  MessageSquare,
  Minus,
  Moon,
  MousePointer2,
  PanelRightClose,
  Plus,
  Redo2,
  RotateCcw,
  ScanLine,
  Settings2,
  SlidersHorizontal,
  Sun,
  Undo2,
  Waypoints,
  X,
} from "lucide-react";
const Scene = React.lazy(() => import("./Scene.jsx"));
const BodyOverview = React.lazy(() => import("./BodyOverview.jsx"));
import { loadSession, saveSession } from "./storage.mjs";
import {
  phantom,
  compareMasks,
  slicePixels,
  sliceSize,
  sliceAspect,
  sliceCount,
  voxelAt,
  index3,
  paintMask,
} from "./volume.mjs";
import { readVolume } from "./nifti.mjs";
import { loadResearchSample, researchSamples } from "./datasets.mjs";
import { displayDefaults } from "./display.mjs";
import { cutRange, anchorOnPlane, planeOffset, slicePoint, cutIntersection } from "./navigation.mjs";
import { atlasReference, binaryOverlap } from "./atlas-reference.mjs";
import { validAction } from "./assistant-actions.mjs";
import {eventPresentation,studyHelp} from "./review-presentation.mjs";
import WorkspaceResize from "./WorkspaceResize.jsx";
import EvidenceDialog from "./EvidenceDialog.jsx";
import RoiDialog,{captureRoiFrame} from "./RoiDialog.jsx";
import {seedViews} from "./roi.mjs";
import StudyPreview from "./StudyPreview.jsx";
import SliceFilmstrip from "./SliceFilmstrip.jsx";
import { growRegion } from "./regions.mjs";
import "./style.css";
const axes = ["axial", "coronal", "sagittal"];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
function IconButton({
  icon: Icon,
  label,
  onClick,
  active,
  disabled,
  ...props
}) {
  return (
    <button
      className={`icon-button ${active ? "active" : ""}`}
      aria-label={label}
      title={label}
      aria-pressed={active === undefined ? undefined : !!active}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <Icon size={17} />
    </button>
  );
}
function Logo() {
  return (
    <svg width="30" height="36" viewBox="0 0 40 44" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.6">
        <ellipse cx="20" cy="22" rx="8" ry="17" transform="rotate(36 20 22)" />
        <ellipse cx="20" cy="22" rx="8" ry="17" transform="rotate(-36 20 22)" />
      </g>
      <circle cx="20" cy="22" r="2.3" fill="currentColor" />
    </svg>
  );
}
function Slice({
  volume,
  axis,
  slice,
  onSlice,
  selected,
  onSelect,
  settings,
  tool,
  onPaint,
  onEnd,
  point,
  setPoint,
  revision,
  zoom,
  position,
  spatial,
}) {
  const canvas = useRef(),
    painting = useRef(false);
  const [w, h] = sliceSize(volume, axis);
  const physicalAspect = sliceAspect(volume, axis);
  const cursor = slicePoint(volume, axis, [position.sagittal, position.coronal, position.axial]);
  const intersection = spatial.cut && spatial.mode !== "context" ? cutIntersection(volume, axis, slice, spatial) : null;
  useEffect(() => {
    const c = canvas.current;
    const { rgba, width, height } = slicePixels(volume, axis, slice, settings);
    c.width = width;
    c.height = height;
    c.getContext("2d").putImageData(new ImageData(rgba, width, height), 0, 0);
  }, [volume, axis, slice, settings, revision]);
  function xy(e) {
    let rect = canvas.current.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(w - 1, Math.floor(((e.clientX - rect.left) / rect.width) * w)),
      ),
      y: Math.max(
        0,
        Math.min(h - 1, Math.floor(((e.clientY - rect.top) / rect.height) * h)),
      ),
    };
  }
  function down(e) {
    onSelect(axis);
    let p = xy(e);
    if (tool === "brush" || tool === "erase") {
      painting.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      onPaint(axis, slice, p, tool === "erase");
    } else setPoint({ ...p, axis, slice });
  }
  return (
    <section
      className={`slice-card ${selected ? "selected" : ""}`}
      onClick={() => onSelect(axis)}
    >
      <div className="viewport-heading">
        <span className={`axis-dot ${axis}`} />
        <strong>
          {volume.synthetic || volume.anatomicalAxes
            ? cap(axis)
            : { axial: "Voxel K", coronal: "Voxel J", sagittal: "Voxel I" }[
                axis
              ]}
        </strong>
        <span className="mono slice-count">
          {String(slice + 1).padStart(3, "0")}{" "}
          <span>/ {sliceCount(volume, axis)}</span>
        </span>
        <IconButton
          icon={Focus}
          label={`Focus ${axis} view`}
          onClick={() => onSelect(axis)}
        />
      </div>
      <div
        className={`slice-image tool-${tool}`}
        onWheel={(e) => {
          onSlice(
            axis,
            Math.max(
              0,
              Math.min(
                sliceCount(volume, axis) - 1,
                slice + Math.sign(e.deltaY),
              ),
            ),
          );
        }}
      >
        <span className="orientation top">
          {volume.synthetic || volume.anatomicalAxes
            ? axis === "axial"
              ? "A"
              : "S"
            : "+"}
        </span>
        <span className="orientation left">
          {volume.synthetic || volume.anatomicalAxes
            ? axis === "sagittal"
              ? "P"
              : volume.anatomicalAxes
                ? "L"
                : "R"
            : "−"}
        </span>
        <span className="orientation right">
          {volume.synthetic || volume.anatomicalAxes
            ? axis === "sagittal"
              ? "A"
              : volume.anatomicalAxes
                ? "R"
                : "L"
            : "+"}
        </span>
        <span className="orientation bottom">
          {volume.synthetic || volume.anatomicalAxes
            ? axis === "axial"
              ? "P"
              : "I"
            : "−"}
        </span>
        <div
          className="canvas-wrap"
          style={{
            width: `min(${78 * zoom}%, ${90 * zoom * physicalAspect}cqh)`,
            maxWidth: "none",
            maxHeight: "none",
            aspectRatio: physicalAspect,
          }}
        >
          <canvas
            ref={canvas}
            onPointerDown={down}
            onPointerMove={(e) => {
              if (painting.current)
                onPaint(axis, slice, xy(e), tool === "erase");
            }}
            onPointerUp={() => {
              if (painting.current) {
                painting.current = false;
                onEnd();
              }
            }}
            onPointerCancel={() => {
              painting.current = false;
              onEnd();
            }}
          />
          <svg className="slice-guides" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {intersection?.coplanar && <rect className="cut-trace" x=".5" y=".5" width="99" height="99" fill="none" />}
            {intersection?.points && <line className="cut-trace" x1={intersection.points[0][0]*100} y1={intersection.points[0][1]*100} x2={intersection.points[1][0]*100} y2={intersection.points[1][1]*100} />}
            <line className="cursor-trace" x1={(cursor.x+.5)/w*100} x2={(cursor.x+.5)/w*100} y1="0" y2="100" />
            <line className="cursor-trace" y1={(cursor.y+.5)/h*100} y2={(cursor.y+.5)/h*100} x1="0" x2="100" />
          </svg>
          <span className="seed linked-seed" style={{left:`${(cursor.x+.5)/w*100}%`,top:`${(cursor.y+.5)/h*100}%`}}><span /></span>
        </div>
        <div className="scan-caption mono">
          {volume.synthetic
            ? "T1 · SYNTHETIC"
            : volume.bundled
              ? "RESEARCH MRI"
              : "NIFTI · NATIVE AXES"}
        </div>

      </div>
      <div className="slice-slider">
        <input
          aria-label={`${cap(axis)} slice`}
          type="range"
          min="0"
          max={sliceCount(volume, axis) - 1}
          value={slice}
          onChange={(e) => onSlice(axis, +e.target.value)}
        />
      </div>
    </section>
  );
}
function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("sari-theme") || "dark",
  );
  const [volume, setVolume] = useState(() => phantom());
  const [position, setPosition] = useState({
    axial: 50,
    coronal: 47,
    sagittal: 48,
  });
  const [axis, setAxis] = useState("axial");
  const [spatial, setSpatial] = useState({mode: "solid", cut: true, pitch: 0, yaw: 0, offset: 0, threshold: 30, isolate: "all", color: false});
  const [privacy, setPrivacy] = useState(() => localStorage.getItem("sari-privacy") === "true");
  useEffect(() => { localStorage.setItem("sari-privacy", String(privacy)); }, [privacy]);
  const [workspaceFocus,setWorkspaceFocus]=useState(false),[focusTools,setFocusTools]=useState(false);
  const [focus3d,setFocus3d]=useState(false),[libraryCollapsed,setLibraryCollapsed]=useState(()=>window.innerWidth<1200),[assistantCollapsed,setAssistantCollapsed]=useState(false);
  const [libraryWidth,setLibraryWidth]=useState(230),[assistantWidth,setAssistantWidth]=useState(294),[sceneShare,setSceneShare]=useState(60),[rowShare,setRowShare]=useState(50);
  useEffect(()=>{const media=window.matchMedia("(max-width:1100px)");const changed=()=>{if(media.matches)setLibraryCollapsed(true);};media.addEventListener("change",changed);return()=>media.removeEventListener("change",changed);},[]);
  const [cameraCommand,setCameraCommand]=useState({id:0,kind:"fit"});
  const cameraState=useRef(null);
  const commandCamera=kind=>setCameraCommand(c=>({id:c.id+1,kind}));
  const [layout, setLayout] = useState(() => localStorage.getItem("sari-layout") === "grid" ? "grid" : "anatomy");
  useEffect(() => { localStorage.setItem("sari-layout", layout); }, [layout]);
  const [revision, setRevision] = useState(0);
  const [settings, setSettings] = useState({
    ...displayDefaults,
    window: 210,
    level: 105,
    overlay: true,
    reference: true,
    opacity: 0.55,
  });
  const [tool, setTool] = useState("navigate"),
    [brush, setBrush] = useState(3),
    [zoom, setZoom] = useState(1),
    [point, setPoint] = useState(null),
    [brainOpacity, setBrainOpacity] = useState(0.18),
    [rotate, setRotate] = useState(false),
    [tab, setTab] = useState("assistant");
  const [roiJob,setRoiJob]=useState(null);
  const [evidenceOpen,setEvidenceOpen]=useState(false);
  const latestRevision=useRef(revision);latestRevision.current=revision;
  const [messages, setMessages] = useState([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState({
      enabled: false,
      reason: "Checking connection",
    }),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [history, setHistory] = useState([]),
    [future, setFuture] = useState([]),
    [events, setEvents] = useState([]),
    [samBusy, setSamBusy] = useState(false),
    [consent, setConsent] = useState(false),
    [hydrated, setHydrated] = useState(false),
    [loadingStudy, setLoadingStudy] = useState(false),
    [overview, setOverview] = useState(true),
    [bodyContext, setBodyContext] = useState(false);
  useEffect(() => {
    loadSession()
      .then((saved) => {
        if (saved?.volume?.data instanceof Uint8Array) {
          setVolume(saved.volume);
          if (saved.settings) setSettings({...displayDefaults, ...saved.settings});
          else if (saved.volume.id === "slicer-tumor") setSettings((s) => ({...s, window: 90, level: 45}));
          setSpatial((s) => ({...s, mode: saved.volume.atlas ? "atlas" : "solid", cut: !saved.volume.atlas, region: null, hemisphere: "both", atlasIsolate: false, threshold: saved.volume.id === "slicer-tumor" ? 10 : 30}));
          setPosition(saved.position);
          setEvents(saved.events || []);
          setRevision((r) => r + 1);
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(
      () =>
        saveSession({ volume, position, events, settings }).catch(() =>
          setToast(
            "Browser storage is unavailable. Export your review to keep it.",
          ),
        ),
      800,
    );
    return () => clearTimeout(t);
  }, [hydrated, volume, position, events, revision, settings]);
  const file = useRef(),
    maskFile = useRef(),
    beforeStroke = useRef(null);
  const activeVolume = useRef(volume);
  activeVolume.current=volume;
  const metrics = useMemo(
    () => compareMasks(volume.reference, volume.proposal, volume.dims),
    [volume, revision],
  );
  const sliceAgreement = useMemo(() => {
    const [width,height]=sliceSize(volume,axis), a=new Uint8Array(width*height),b=new Uint8Array(width*height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=index3(...voxelAt(volume,axis,x,y,position[axis]),volume.dims);
      a[x+y*width]=volume.reference[i];b[x+y*width]=volume.proposal[i];
    }
    return binaryOverlap(a,b);
  },[volume,revision,axis,position]);
  useEffect(() => {
    if (spatial.isolate === "proposal" && !metrics.countB) setSpatial((s) => ({...s, isolate: "all"}));
  }, [metrics.countB, spatial.isolate]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("sari-theme", theme);
  }, [theme]);
  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ enabled: false, reason: "Server unavailable" }));
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    setSpatial((s) => ({...s,offset:planeOffset(volume,[position.sagittal,position.coronal,position.axial],s)}));
  }, [volume.id]);
  function record(text) {
    setEvents((e) =>
      [{ text, time: new Date().toISOString() }, ...e].slice(0, 100),
    );
  }
  function navigate(xyz, seedAxis = null) {
    setPosition({sagittal:xyz[0],coronal:xyz[1],axial:xyz[2]});
    if (seedAxis) setPoint(slicePoint(volume,seedAxis,xyz));
    if (spatial.linked !== false) setSpatial((s) => ({...s,offset:planeOffset(volume,xyz,s)}));
  }
  function changeSlice(a, s) {
    const next={...position,[a]:s};
    navigate([next.sagittal,next.coronal,next.axial],point?a:null);
  }
  function changeCut(patch) {
    const next={...spatial,...patch};
    const range=cutRange(volume,next);
    next.offset=Math.max(-range,Math.min(range,next.offset));
    setSpatial(next);
    if(next.linked !== false && next.cut) {
      const xyz=anchorOnPlane(volume,[position.sagittal,position.coronal,position.axial],next);
      setPosition({sagittal:xyz[0],coronal:xyz[1],axial:xyz[2]});
      if(point)setPoint(slicePoint(volume,axis,xyz));
    }
  }
  function worst() {
    if (!metrics.countA || !metrics.countB) {
      setToast("Add a proposal mask before comparing annotations.");
      return;
    }
    if (!metrics.difference) {
      setToast("No annotation differences to navigate to.");
      return;
    }
    setAxis("axial");
    changeSlice("axial", metrics.worst);
    record(
      `Navigated to largest axial disagreement: slice ${metrics.worst + 1}`,
    );
  }
  function remember() {
    setHistory((h) => [...h.slice(-9), volume.proposal.slice()]);
    setFuture([]);
  }
  function paint(a, s, p, erase) {
    if (!beforeStroke.current) beforeStroke.current = volume.proposal.slice();
    paintMask(volume, a, s, p.x, p.y, brush, erase);
    setRevision((r) => r + 1);
  }
  function endStroke() {
    if (beforeStroke.current) {
      const previous = beforeStroke.current;
      setHistory((h) => [...h.slice(-9), previous]);
      setFuture([]);
      beforeStroke.current = null;
      record("Manually edited proposal mask");
    }
  }
  function selectAtlasRegion(id, clickedVoxel = null) {
    const region = volume.atlas?.regions.find((r) => r.id === Number(id));
    setSpatial((s) => ({...s, region: region?.id || null}));
    if (region?.centroid) {
      const [x,y,z] = clickedVoxel || region.centroid;
      navigate([x,y,z]);
      setPoint(null);
    }
  }
  function useAtlasReference() {
    try {
      const {mask,seed,region}=atlasReference(volume,spatial.region);
      volume.reference=mask;
      volume.referenceLabel=region.name;
      volume.referenceKind=`Source atlas label ${region.id}: ${region.name}; resampled source annotation, not model output`;
      navigate(seed,axis);setRevision(r=>r+1);
      setSettings(s=>({...s,reference:true}));
      record(`Comparison target set to source atlas label ${region.id}: ${region.name}`);
      setToast("Source annotation selected as reference. Seed placed inside the structure.");
    } catch(e){setToast(e.message);}
  }
  function growSeed() {
    if (!point) return;
    try {
      const result = growRegion(volume, voxelAt(volume, point.axis, point.x, point.y, point.slice));
      remember();
      volume.proposal.set(result.mask);
      setRevision((r) => r + 1);
      setSpatial((s) => ({...s, mode: "solid", isolate: "proposal"}));
      setSettings((s) => ({...s, overlay: true}));
      record(`Local intensity region: ${result.count} voxels, tolerance ±12${result.capped ? "; capped at safety limit" : ""}`);
      setToast(`${result.count.toLocaleString()} voxels isolated${result.capped ? " (size limit reached; partial region)" : ""}. Intensity-based selection, not an anatomical label.`);
    } catch (e) { setToast(e.message); }
  }
  function undo() {
    if (!history.length) return;
    setFuture((f) => [...f, volume.proposal.slice()]);
    volume.proposal.set(history.at(-1));
    setHistory((h) => h.slice(0, -1));
    record("Undid proposal edit; last generation record retained as history");
    setRevision((r) => r + 1);
  }
  function redo() {
    if (!future.length) return;
    setHistory((h) => [...h, volume.proposal.slice()]);
    volume.proposal.set(future.at(-1));
    setFuture((f) => f.slice(0, -1));
    record("Redid proposal edit");
    setRevision((r) => r + 1);
  }
  function restore() {
    const v = phantom();
    setSpatial((s) => ({...s, isolate: "all", color: false, pitch: 0, yaw: 0, offset: 0, mode: "solid", region: null, cut: true, atlasIsolate: false}));
    setVolume(v);
    setPosition({ axial: 50, coronal: 47, sagittal: 48 });
    setHistory([]);
    setFuture([]);
    setEvents([]);
    setMessages([]);
    setPoint(null);
    setConsent(false);
    setZoom(1);
    setRevision((r) => r + 1);
    setModal(null);
    setToast("Synthetic study restored.");
    setOverview(false);
  }
  async function openMni(sample = "mni-t1") {
    if (typeof sample !== "string") sample = "mni-t1";
    setLoadingStudy(true);
    try {
      const v = await loadResearchSample(sample);
      setSettings((s) => ({...s, window: sample === "spl-atlas" ? 100 : sample === "slicer-tumor" ? 90 : 210, level: sample === "spl-atlas" ? 50 : sample === "slicer-tumor" ? 45 : 105}));
      setVolume(v);
      setPosition(Object.fromEntries(axes.map((a) => [a, Math.floor(sliceCount(v, a) / 2)])));
      setSpatial((s) => ({...s, isolate: "all", color: false, pitch: 0, yaw: 0, offset: 0, threshold: sample === "slicer-tumor" ? 10 : 30, mode: v.atlas ? "atlas" : "solid", cut: !v.atlas, region: null, hemisphere: "both", atlasIsolate: false}));
      setAxis("axial");
      setHistory([]);
      setFuture([]);
      setMessages([]);
      setEvents([]);
      setPoint(null);
      setConsent(false);
      setZoom(1);
      setRevision((r) => r + 1);
      setModal(null);
      setOverview(false);
      setToast(
        `${v.name} loaded. No AI proposal has been generated.`,
      );
    } catch (e) {
      setToast(e.message);
    } finally {
      setLoadingStudy(false);
    }
  }
  async function load(e, isMask = false) {
    let f = e.target.files?.[0];
    if (!f) return;
    try {
      let v = await readVolume(f);
      if (isMask) {
        if (v.dims.some((d, i) => d !== volume.dims[i]))
          throw new Error("Mask dimensions must match the current volume.");
        if (
          volume.affine &&
          JSON.stringify(volume.affine) !== JSON.stringify(v.affine)
        )
          throw new Error("Mask and image spatial transforms do not match.");
        volume.reference = v.binaryMask;
        record(`Imported binary reference mask: ${f.name}`);
        setRevision((r) => r + 1);
        setToast("Reference mask loaded. All nonzero labels are combined.");
      } else {
        setSpatial((s) => ({...s, isolate: "all", color: false, pitch: 0, yaw: 0, offset: 0, mode: "solid", region: null, cut: true, atlasIsolate: false}));
        setVolume(v);
        setPosition(
          Object.fromEntries(
            axes.map((a) => [a, Math.floor(sliceCount(v, a) / 2)]),
          ),
        );
        setHistory([]);
        setFuture([]);
        setMessages([]);
        setEvents([]);
        setPoint(null);
        setConsent(false);
        setRevision((r) => r + 1);
        setModal(null);
        setOverview(false);
        setToast(
          "Volume loaded locally. Native voxel axes; no anatomical reorientation.",
        );
      }
    } catch (err) {
      setToast(err.message);
    }
    e.target.value = "";
  }
  function exportSession() {
    const result = {
      application: "SARI",
      version: "0.1.0",
      createdAt: new Date().toISOString(),
      study: {
        id: volume.id,
        name: volume.name,
        source: volume.source,
        synthetic: volume.synthetic,
        dims: volume.dims,
        spacing: volume.spacing,
        affine: volume.affine,
        units: volume.units,
        orientation: volume.orientation,
      },
      roiProvenance: volume.roiProvenance || null,
      literatureSearches: volume.literatureSearches || [],
      maskProvenance: volume.synthetic
        ? "Procedural reference and deliberately perturbed proposal; subsequent edits recorded below"
        : volume.bundled
          ? `${volume.referenceKind || "No reference supplied"}; proposal starts empty; local/manual/SAM edits recorded below`
          : "User-supplied reference / manual or SAM proposal",
      metrics: { ...metrics, slices: metrics.slices, currentSlice: {axis,slice:position[axis],...sliceAgreement} },
      position,
      events,
      proposalMask: Array.from(volume.proposal),
      referenceMask: Array.from(volume.reference),
      disclaimer: "Research only. Not clinically validated. No medical advice.",
    };
    let blob = new Blob([JSON.stringify(result)], { type: "application/json" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `sari-${volume.id}-review.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setToast("Research record exported, including masks and provenance.");
    record("Exported research record");
  }
  function localAction(text) {
    if (
      !metrics.countB &&
      /disagree|difference|largest|worst|compare|overlap|dice/i.test(text)
    )
      return "No proposal mask exists yet. Draw a proposal or request SAM segmentation before comparing it with the reference.";
    const t = text.toLowerCase();
    if (/disagree|difference|largest|worst/.test(t)) {
      worst();
      return metrics.difference
        ? `Axial slice ${metrics.worst + 1} has the largest disagreement: ${metrics.max.toLocaleString()} differing voxels. The workspace is positioned there.`
        : "The current masks agree exactly. There are no differing voxels.";
    }
    if (/sagittal|coronal|axial/.test(t)) {
      const a = axes.find((a) => t.includes(a));
      setAxis(a);
      return `${cap(a)} view selected. Use its slider or scroll to move through the volume.`;
    }
    if (/reference/.test(t)) {
      setSettings((s) => ({ ...s, reference: true }));
      return "Reference outline is visible in amber. The editable proposal is shown in mint.";
    }
    if (/score|dice|overlap|compare|metric/.test(t))
      return `Current 3D Dice overlap: ${(metrics.dice * 100).toFixed(1)}%. ${metrics.difference.toLocaleString()} voxels differ. These are computed annotation metrics, not a measure of clinical accuracy.`;
    if (/diagnos|tumou?r|cancer|disease|abnormal|treat|healthy/.test(t))
      return "SARI supports research annotation review. It does not assess health, detect disease, or provide diagnosis or treatment advice.";
    return "Offline controls support “largest disagreement”, “compare masks”, “show reference”, or selecting an axial, coronal, or sagittal view. Connect Meta to ask Muse open-ended workspace questions.";
  }
  function applyActions(actions) {
    const context = {dims:volume.dims,atlasRegions:volume.atlas?.regions};
    if (!Array.isArray(actions) || actions.some(a => !validAction(a,context))) throw new Error("Invalid navigation response; workspace preserved.");
    if (!actions.length) return;
    let nextSpatial={...spatial}, nextPosition={...position}, nextAxis=axis;
    for (const a of actions) {
      if (a.action === "select_region") {
        const region=volume.atlas.regions.find(r=>r.id===a.regionId);
        nextSpatial.region=region.id;
        const [x,y,z]=region.centroid.map(Math.round);
        nextPosition={sagittal:x,coronal:y,axial:z};
      } else if (a.action === "set_view") {
        Object.assign(nextSpatial,{mode:a.mode,hemisphere:a.hemisphere || nextSpatial.hemisphere,atlasIsolate:a.isolate});
      } else if (a.action === "set_cut") {
        Object.assign(nextSpatial,{cut:a.enabled ?? true,pitch:a.pitch,yaw:a.yaw,linked:true});
      } else if (a.action === "set_axis") nextAxis=a.axis;
      else if (a.action === "set_slice") {nextAxis=a.axis;nextPosition[a.axis]=a.slice;}
      else if (a.action === "worst_difference") {
        if (!metrics.countA || !metrics.countB || !metrics.difference) throw new Error("Two differing masks are needed for comparison.");
        nextAxis="axial";nextPosition.axial=metrics.worst;
      } else if (a.action === "show_reference") setSettings(s=>({...s,reference:true}));
      else if (a.action === "show_proposal") setSettings(s=>({...s,overlay:true}));
    }
    const xyz=[nextPosition.sagittal,nextPosition.coronal,nextPosition.axial];
    nextSpatial.offset=planeOffset(volume,xyz,nextSpatial);
    setSpatial(nextSpatial);setPosition(nextPosition);setAxis(nextAxis);
    setPoint(slicePoint(volume,nextAxis,xyz));
    if(actions.length) setOverview(false);
  }
  async function ask(text = input) {
    if (!text.trim() || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);
    try {
      if (status.enabled) {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history: messages.filter(m => m.source !== "Connection error"),
            context: {
              synthetic: volume.synthetic,
              atlasRegions: volume.atlas?.regions.map(({id,name})=>({id,name})),
              view: {mode:spatial.mode,hemisphere:spatial.hemisphere,isolate:spatial.atlasIsolate,cut:spatial.cut},
              caseContext: volume.caseContext,
              selectedAtlasStructure: volume.atlas?.regions.find((r) => r.id === spatial.region)?.name || null,
              dims: volume.dims,
              axis,
              position,
              metrics: {
                currentSlice: {axis,slice:position[axis],...sliceAgreement},
                dice: metrics.countA && metrics.countB ? metrics.dice : null,
                difference:
                  metrics.countA && metrics.countB ? metrics.difference : null,
                worstAxialSlice: metrics.worst,
                maxSliceDifference: metrics.max,
              },
              referenceAvailable: metrics.countA > 0,
              proposalAvailable: metrics.countB > 0,
              referenceKind:
                volume.referenceKind || "user-defined binary reference",
              studyKind: volume.atlas ? "source-labeled anatomical research atlas; labels are not AI findings" : volume.id === "slicer-tumor" ? "source-labeled tumor teaching sample; subtype not supplied" : volume.bundled
                ? "population-average MRI template"
                : volume.synthetic
                  ? "synthetic phantom"
                  : "local research volume",
            },
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if(activeVolume.current !== volume) throw new Error("Study changed while Muse was working; response discarded.");
        applyActions(data.actions);
        setMessages((m) => [
          ...m,
          { role: "assistant", text: data.text, source: data.model },
        ]);
        record(`Muse action: ${JSON.stringify(data.actions)}`);
      } else {
        let answer = localAction(text);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: answer,
            source: "Local workspace command",
          },
        ]);
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: e.message, source: "Connection error" },
      ]);
    } finally {
      setBusy(false);
    }
  }
  function openRoi() {
    if(!point){setToast("Select a point in a slice or the 3D view first.");return;}
    if(!status.enabled){setModal("connection");return;}
    const seed=voxelAt(volume,point.axis,point.x,point.y,point.slice);
    try {
      const frames=seedViews(volume,seed).map(f=>captureRoiFrame(volume,f));
      setRoiJob({volume,revision,seed,frames,target:volume.atlas?.regions.find(r=>r.id===spatial.region)?.name || "Selected research region"});
    }catch(e){setToast(e.message);}
  }
  function applyRoi(result) {
    if(activeVolume.current!==roiJob.volume || latestRevision.current!==roiJob.revision){setToast("Workspace changed. Start a new ROI review; existing proposal preserved.");setRoiJob(null);return;}
    remember();volume.proposal.set(result.mask);volume.roiProvenance=result.provenance;
    setRevision(r=>r+1);setSettings(s=>({...s,overlay:true}));
    setSpatial(s=>({...s,mode:"solid",isolate:"proposal",cut:false,atlasIsolate:false}));
    record(`Reviewed ROI applied: ${JSON.stringify(result.provenance)}`);
    setRoiJob(null);setToast("Draft ROI applied. Inspect the sampled planes before using.");
  }
  async function segment() {
    if (!point) {
      setToast("Click a foreground point in a slice first.");
      return;
    }
    if (!status.enabled) {
      setModal("connection");
      return;
    }
    if (!consent) {
      setModal("consent");
      return;
    }
    setSamBusy(true);
    try {
      const captured = { ...point };
      const { rgba, width, height } = slicePixels(
        volume,
        point.axis,
        point.slice,
        { overlay: false, reference: false },
      );
      let c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      c.getContext("2d").putImageData(new ImageData(rgba, width, height), 0, 0);
      let response = await fetch("/api/segment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: c.toDataURL("image/png"),
          point: { x: point.x, y: point.y },
          width,
          height,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if(activeVolume.current !== volume) throw new Error("Study changed while SAM was working; result discarded.");
      if(!Array.isArray(data.mask) || data.width!==width || data.height!==height || data.mask.length!==width*height || data.mask.some(n=>n!==0&&n!==1)) throw new Error("Invalid SAM mask; existing proposal preserved.");
      remember();
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const xyz = voxelAt(volume, captured.axis, x, y, captured.slice);
          volume.proposal[index3(...xyz, volume.dims)] = data.mask[
            x + y * width
          ]
            ? 1
            : 0;
        }
      setRevision((r) => r + 1);
      const referenceSlice=new Uint8Array(width*height);
      for(let y=0;y<height;y++)for(let x=0;x<width;x++) referenceSlice[x+y*width]=volume.reference[index3(...voxelAt(volume,captured.axis,x,y,captured.slice),volume.dims)];
      const agreement=binaryOverlap(referenceSlice,data.mask);
      record(`SAM slice comparison: ${JSON.stringify(agreement)}; target: ${volume.referenceKind}; 2D agreement only, not clinical accuracy`);
      record(
        `SAM 3.1 proposal on ${captured.axis} slice ${captured.slice + 1}; point ${captured.x},${captured.y}`,
      );
      setToast("SAM proposal applied to this slice. Inspect before using.");
    } catch (e) {
      setToast(e.message);
    } finally {
      setSamBusy(false);
    }
  }
  useEffect(() => {
    function key(e) {
      if (e.key === "Escape") {
        setFocus3d(false);
        setWorkspaceFocus(false);
        setModal(null);
        setTool("navigate");
        return;
      }
      if (e.defaultPrevented || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.closest?.('[role="separator"]')) return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if (e.key === "ArrowRight")
        changeSlice(
          axis,
          Math.min(sliceCount(volume, axis) - 1, position[axis] + 1),
        );
      if (e.key === "ArrowLeft")
        changeSlice(axis, Math.max(0, position[axis] - 1));
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [axis, position, volume, history, future]);
  return overview ? (
    <React.Suspense
      fallback={<div className="overview-loading">Preparing SARI…</div>}
    >
      <BodyOverview
        theme={theme}
        privacy={privacy}
        setPrivacy={setPrivacy}
        setTheme={setTheme}
        onHeadSelect={() => (volume.atlas ? setOverview(false) : openMni("spl-atlas"))}
        loading={loadingStudy}
        hasStudy={volume.bundled}
        onResume={() => setOverview(false)}
        onPhantom={restore}
        onLocal={() => file.current.click()}
      />
      <input
        type="file"
        ref={file}
        accept=".nii,.gz"
        hidden
        onChange={(e) => load(e)}
      />
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </React.Suspense>
  ) : (
    <div className={`app ${workspaceFocus||focus3d?"compact-workspace":""} ${focusTools?"focus-tools-open":""}`}>
      <input
        type="file"
        ref={file}
        accept=".nii,.gz"
        hidden
        onChange={(e) => load(e)}
      />
      <input
        type="file"
        ref={maskFile}
        accept=".nii,.gz"
        hidden
        onChange={(e) => load(e, true)}
      />
      <div className="compact-workspace-bar" role="toolbar" aria-label="Focused workspace navigation">
        <a href="/" aria-label="SARI overview" onClick={e=>{e.preventDefault();setOverview(true);}}>SARI</a>
        <span className="compact-target" title={volume.name}>{volume.atlas?.regions.find(r=>r.id===spatial.region)?.name || volume.roiProvenance?.target || volume.name}</span>
        <span className="compact-research">Research only</span>
        <div className="layout-switch" role="group" aria-label="Focused workspace layout">{["anatomy","grid"].map(value=><button key={value} aria-label={value==="anatomy"?"Focus layout: Anatomy":"Focus layout: Four views"} aria-pressed={layout===value} onClick={()=>setLayout(value)}>{value==="anatomy"?"Anatomy":"Four views"}</button>)}</div>
        <button className="focus-action" aria-label="Toggle focus tools" aria-pressed={focusTools} onClick={()=>setFocusTools(v=>!v)}><SlidersHorizontal size={13}/> Tools</button>
        <IconButton icon={ArrowDownToLine} label="Export review" onClick={exportSession}/>
        <button className="focus-action" aria-label="Exit workspace focus" title="Exit workspace focus (Escape)" onClick={()=>{setWorkspaceFocus(false);setFocus3d(false);}}><Maximize2 size={13}/> Exit focus</button>
      </div>
      <header className="topbar">
        <a href="/" className="brand" aria-label="SARI overview" onClick={(e) => { e.preventDefault(); setModal(null); setOverview(true); }}>
          <Logo />
          <span>
            SARI<small>ANATOMY IN CONTEXT</small>
          </span>
        </a>
        <span className="header-divider" />
        <div className="workspace-label">
          Research workspace <ChevronDown size={13} />
        </div>
        <div className="header-right">
          <span className="research-tag">
            <span />
            RESEARCH ONLY
          </span>
          <IconButton
            icon={theme === "dark" ? Sun : Moon}
            label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          />
          <IconButton
            icon={CircleHelp}
            label="Workspace help"
            onClick={() => setModal("help")}
          />
          <span className="avatar">SS</span>
        </div>
      </header>
      <div className={`shell inspection-shell ${libraryCollapsed||workspaceFocus||focus3d?"library-collapsed":""} ${assistantCollapsed||workspaceFocus||focus3d?"assistant-collapsed":""} ${focus3d?"focus-3d":""}`} style={{"--library-width":`${libraryWidth}px`,"--assistant-width":`${assistantWidth}px`,"--scene-fr":`${sceneShare}fr`,"--slice-fr":`${100-sceneShare}fr`,"--row-fr":`${rowShare}fr`,"--bottom-fr":`${100-rowShare}fr`}}>
        <nav className="rail" aria-label="Workspace navigation">
          <IconButton
            icon={Layers}
            label={libraryCollapsed ? "Show study library" : "Hide study library"}
            active={!libraryCollapsed}
            onClick={() => {setFocus3d(false);setLibraryCollapsed(v=>!v);}}
          />
          <IconButton
            icon={Box}
            label="Body overview"
            onClick={() => setOverview(true)}
          />
          <IconButton
            icon={Waypoints}
            label="Review history"
            onClick={() => setTab("history")}
          />
          <IconButton icon={MessageSquare} label={assistantCollapsed ? "Show assistant" : "Hide assistant"} active={!assistantCollapsed} onClick={()=>{setFocus3d(false);setAssistantCollapsed(v=>!v);}}/>
          <div className="rail-bottom">
            <IconButton
              icon={Settings2}
              label="Meta connection settings"
              onClick={() => setModal("connection")}
            />
            <span className="rail-version">0.1</span>
          </div>
        </nav>
        <aside className="study-panel">
          <div className="panel-eyebrow">
            STUDY LIBRARY <IconButton icon={ChevronLeft} label="Collapse study library" onClick={()=>setLibraryCollapsed(true)}/>
          </div>
          <h2>
            Your research,
            <br />
            <span>in perspective.</span>
          </h2>
          <button className="study-tile" aria-label={`Choose study. Current: ${volume.name}`} onClick={() => setModal("study")}>
            <div className="study-art">
              <StudyPreview volume={volume} />
              <span className="sample-tag">
                {volume.synthetic
                  ? "PHANTOM"
                  : volume.atlas
                    ? "ANATOMY ATLAS"
                    : volume.bundled ? "RESEARCH MRI" : "LOCAL VOLUME"}
              </span>
              <span className="study-switch-hint">Choose study <ChevronDown size={11} /></span>
            </div>
            <div className="study-tile-body">
              <span className="tiny-icon">
                <ScanLine size={14} />
              </span>
              <strong>{volume.name}</strong>
              <Check size={14} className="mint" />
              <small>
                {volume.synthetic
                  ? "Brain · T1-like · Demo study"
                  : volume.bundled
                    ? volume.series
                    : "NIfTI · Native voxel axes"}
              </small>
            </div>
          </button>
          <div className="study-details">
            <div>
              <span>Volume</span>
              <span className="mono">{volume.dims.join(" × ")}</span>
            </div>
            <div>
              <span>Spacing</span>
              <span className="mono">
                {volume.spacing.map((x) => Number(x.toFixed(2))).join(" × ")}
              </span>
            </div>
            <div>
              <span>Source</span>
              <span>
                {volume.synthetic
                  ? "Procedural phantom"
                  : volume.sourceLabel || "Browser-local"}
              </span>
            </div>
          </div>
          {volume.id === "slicer-tumor" && <p className="case-context">{volume.caseContext}</p>}
          <button
            className="import-button"
            onClick={() => file.current.click()}
          >
            <Plus size={15} /> Open local volume
          </button>
          {volume.atlas && <div className="atlas-browser">
            <div className="panel-eyebrow">ANATOMY · {volume.atlas.regions.length} STRUCTURES</div>
            <select aria-label="Atlas structure" value={spatial.region || ""} onChange={(e) => selectAtlasRegion(e.target.value)}>
              <option value="">Explore structures</option>
              {["Cortex", "Deep structures", "Ventricles", "White matter", "Cerebellum"].map((group) => <optgroup key={group} label={group}>{volume.atlas.regions.filter((r) => r.group === group).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</optgroup>)}
            </select>
            <select aria-label="Context hemisphere" value={spatial.hemisphere || "both"} onChange={(e) => setSpatial((s) => ({...s, hemisphere:e.target.value}))}><option value="both">Both hemispheres</option><option value="left">Left hemisphere</option><option value="right">Right hemisphere</option></select>
            <label><input type="checkbox" checked={!!spatial.atlasIsolate} disabled={!spatial.region} onChange={(e) => setSpatial((s) => ({...s, atlasIsolate:e.target.checked}))} /> Isolate selected structure</label>
            <label><input type="checkbox" checked={!!spatial.color} onChange={(e) => setSpatial((s) => ({...s, color:e.target.checked}))} /> Atlas colors</label>
            <button className="quiet-button" disabled={!spatial.region || samBusy} onClick={useAtlasReference}>Use structure as reference</button>
            {spatial.region && <p className="atlas-selected">{volume.atlas.regions.find((r) => r.id === spatial.region)?.name}</p>}
            <a href="/data/spl-atlas/README.md" target="_blank" rel="noreferrer">Atlas source & attribution ↗</a>
          </div>}
          <div className="sidebar-section">
            <div className="panel-eyebrow">
              ANNOTATIONS <span>02</span>
            </div>
            <div className="annotation-row">
              <span className="annotation-swatch mint-bg" />
              <div>
                <strong>Proposal</strong>
                <small>
                  {volume.synthetic
                    ? "Perturbed demo mask"
                    : metrics.countB
                      ? "Editable proposal"
                      : "No proposal yet"}
                </small>
              </div>
              <IconButton
                icon={settings.overlay ? Eye : EyeOff}
                label="Toggle proposal overlay"
                onClick={() =>
                  setSettings((s) => ({ ...s, overlay: !s.overlay }))
                }
              />
            </div>
            <div className="annotation-row">
              <span className="annotation-swatch amber-bg" />
              <div>
                <strong>Reference</strong>
                <small>
                  {volume.synthetic
                    ? "Synthetic ground truth"
                    : volume.referenceLabel
                      ? volume.referenceLabel
                      : metrics.countA
                        ? "Imported binary mask"
                        : "No reference loaded"}
                </small>
              </div>
              <IconButton
                icon={settings.reference ? Eye : EyeOff}
                label="Toggle reference outline"
                onClick={() =>
                  setSettings((s) => ({ ...s, reference: !s.reference }))
                }
              />
            </div>
            <button
              className="text-button"
              onClick={() => maskFile.current.click()}
            >
              <FileUp size={13} /> Import reference mask
            </button>
          </div>
          {volume.roiProvenance && <details className="roi-history"><summary>Last guided ROI · {volume.roiProvenance.frames.length} planes</summary><p>{volume.roiProvenance.target}</p><p>{volume.roiProvenance.summary}</p><p>{volume.roiProvenance.limitations}</p><strong>Intersecting sampled masks</strong><p>{volume.roiProvenance.conflicts} conflicting voxels / {volume.roiProvenance.compared} compared; conflicts excluded.</p><small>Sampled planes only. This compares predictions with one another, not with the reference. Subsequent edits are recorded in Activity.</small></details>}
          <div className="review-card">
            <div className="panel-eyebrow">PROPOSAL / REFERENCE · CURRENT SLICE</div>
            {volume.roiProvenance && <small className="coverage-label">Last guided run: sampled planes only</small>}
            <div className="score">{sliceAgreement.reference && sliceAgreement.proposal ? `${(sliceAgreement.dice*100).toFixed(1)}%` : "—"}</div>
            <div className="score-meta">{cap(axis)} {position[axis]+1} · 2D Dice overlap</div>
            <div className="panel-eyebrow">WHOLE-VOLUME OVERLAP</div>
            <div className="score">
              {metrics.countA && metrics.countB ? (
                <>
                  {(metrics.dice * 100).toFixed(1)}
                  <span>%</span>
                </>
              ) : (
                "—"
              )}
              <span className="score-label">3D Dice</span>
            </div>
            <div className="score-track">
              <span
                style={{
                  width: `${metrics.countA && metrics.countB ? metrics.dice * 100 : 0}%`,
                }}
              />
            </div>
            <div className="score-meta">
              {metrics.countB
                ? `${metrics.difference.toLocaleString()} differing voxels`
                : "Add a proposal to compare"}
            </div>
            <small className="coverage-label">Overlap is not confidence or independent model accuracy.</small>
            <button onClick={worst}>
              Review largest difference <ArrowRight size={14} />
            </button>
          </div>
          <div className="sidebar-foot">
            <div className="status-dot" />{" "}
            {volume.synthetic
              ? "No patient data"
              : "Stored locally in this browser"}
            <small>Reviewed images are shared with Meta only after approval.</small><small>Research use · Not clinically validated</small>
          </div>
        </aside>
        <WorkspaceResize label="Resize study library" value={libraryWidth} min={180} max={360} onChange={setLibraryWidth} className="library-divider"/>
        <main className={`main layout-${layout}`}>
          <div className="study-header">
            <div>
              <div className="breadcrumbs">
                Workspace <ChevronRight size={12} />{" "}
                {volume.synthetic || volume.bundled
                  ? "Brain research"
                  : "Local research"}
              </div>
              <h1>
                {volume.name}{" "}
                <span className="study-id">
                  {volume.synthetic
                    ? "SYN-001"
                    : volume.bundled
                      ? "RESEARCH"
                      : "LOCAL"}
                </span>
              </h1>
              <p title={volume.caseContext}>
                {volume.synthetic
                  ? "A spatial workspace for annotation review."
                  : volume.bundled
                    ? volume.series
                    : "Native voxel coordinates · anatomical orientation not inferred."}
              </p>
            </div>
            <div className="study-actions">
            <button className="button secondary" aria-label="Focus workspace" title="Focus workspace" onClick={()=>setWorkspaceFocus(true)}><Maximize2 size={14}/><span>Focus</span></button>
            <div className="layout-switch" role="group" aria-label="Workspace layout">
              {["anatomy", "grid"].map((value) => <button key={value} aria-pressed={layout === value} onClick={() => setLayout(value)}>{value === "anatomy" ? "Anatomy" : "Four views"}</button>)}
            </div>
            <button className="button secondary" aria-label="Export review" title="Export review" onClick={exportSession}>
              <ArrowDownToLine size={15} />
              <span>Export review</span>
            </button>
            </div>
          </div>
          <div className="research-context" aria-label="Research target context">
            <span>Selected anatomy <strong>{volume.atlas?.regions.find(r=>r.id===spatial.region)?.name || "None"}</strong></span>
            <span>Reference <strong>{volume.referenceLabel || (metrics.countA?"Imported mask":"None")}</strong></span>
            <span>Proposal <strong>{metrics.countB?(volume.roiProvenance?.target || "Editable mask"):"None"}</strong></span>
          </div>
          <div className="toolbar">
            <div className="tool-group">
              <IconButton
                icon={MousePointer2}
                label="Navigate and place seed"
                active={tool === "navigate"}
                onClick={() => setTool("navigate")}
              />
              <IconButton
                icon={Crosshair}
                label="Place segmentation seed"
                active={tool === "seed"}
                onClick={() => setTool("seed")}
              />
              <IconButton
                icon={ScanLine}
                label="Paint proposal mask"
                active={tool === "brush"}
                onClick={() => setTool("brush")}
              />
              <IconButton
                icon={Eraser}
                label="Erase proposal mask"
                active={tool === "erase"}
                onClick={() => setTool("erase")}
              />
            </div>
            <span className="toolbar-divider" />
            <div className="tool-group">
              <IconButton
                icon={Undo2}
                label="Undo annotation edit"
                disabled={!history.length}
                onClick={undo}
              />
              <IconButton
                icon={Redo2}
                label="Redo annotation edit"
                disabled={!future.length}
                onClick={redo}
              />
            </div>
            <span className="toolbar-divider" />
            <div className="zoom-control">
              <IconButton
                icon={Minus}
                label="Zoom out"
                onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
              />
              <span className="mono">{Math.round(zoom * 100)}%</span>
              <IconButton
                icon={Plus}
                label="Zoom in"
                onClick={() => setZoom((z) => Math.min(1.6, z + 0.1))}
              />
            </div>
            <div className="toolbar-right">
              <button className="quiet-button" aria-label="Grow region" disabled={!point} onClick={growSeed} title="Replace proposal with connected voxels within ±12 intensity of the seed"><Crosshair size={14} /><span>Grow region</span></button>
              <button
                className="quiet-button" aria-label="Display" title="Display"
                onClick={() => {setWorkspaceFocus(false);setFocus3d(false);setTab("display");setAssistantCollapsed(false);}}
              >
                <SlidersHorizontal size={14} />
                <span>Display</span>
              </button>
              <button className="quiet-button" aria-label="Guided ROI" title="Guided ROI" disabled={samBusy||busy} onClick={openRoi}><Focus size={14}/> Guided ROI</button>
              <button
                className="sam-button" aria-label="SAM proposal" title="SAM proposal"
                onClick={segment}
                disabled={samBusy}
              >
                {samBusy ? (
                  <Loader2 className="spin" size={14} />
                ) : (
                  <Waypoints size={14} />
                )}
                SAM proposal
              </button>
            </div>
          </div>
          {(spatial.mode === "solid" || spatial.mode === "atlas" || spatial.mode === "volume") && <details className="spatial-inspector"><summary>3D inspector · Cut & isolation</summary><div className="cut-controls">
                <label><input type="checkbox" checked={spatial.cut} onChange={(e) => changeCut({cut:e.target.checked})} /> Cut plane</label>
                <label><input type="checkbox" checked={spatial.linked !== false} onChange={(e) => changeCut({linked:e.target.checked})} /> Link views</label>
                <select aria-label="Cut plane orientation" value={spatial.pitch===90&&spatial.yaw===0?"axial":spatial.pitch===0&&spatial.yaw===90?"sagittal":spatial.pitch===0&&spatial.yaw===0?"coronal":"free"} onChange={(e)=>{
                  const angles={axial:{pitch:90,yaw:0},coronal:{pitch:0,yaw:0},sagittal:{pitch:0,yaw:90}}[e.target.value];
                  if(angles)changeCut({...angles,offset:planeOffset(volume,[position.sagittal,position.coronal,position.axial],angles)});
                }}><option value="free" disabled>Oblique</option><option value="axial">Axial</option><option value="coronal">Coronal</option><option value="sagittal">Sagittal</option></select>
                {[ ["pitch", "Tilt", -90, 90, 1], ["yaw", "Rotate", -180, 180, 1], ["offset", "Depth", -Math.floor(cutRange(volume,spatial)*1000)/1000, Math.floor(cutRange(volume,spatial)*1000)/1000, .001] ].map(([key, label, min, max, step]) => <label key={key}>{label}<input aria-label={`Cut plane ${label.toLowerCase()}`} type="range" min={min} max={max} step={step} value={spatial[key]} onChange={(e) => changeCut({[key]:+e.target.value})} /></label>)}
                {(spatial.mode === "solid" || spatial.mode === "volume") && <select aria-label="Isolate 3D region" value={spatial.isolate} onChange={(e) => setSpatial((s) => ({...s, isolate: e.target.value}))}><option value="all">Whole volume</option><option value="reference" disabled={!metrics.countA}>Reference only</option><option value="proposal" disabled={!metrics.countB}>Proposal only</option>{volume.tissues && <><option value="tissue-1">CSF only</option><option value="tissue-2">Gray matter only</option><option value="tissue-3">White matter only</option></>}</select>}
                {volume.tissues && <label><input type="checkbox" checked={spatial.color} onChange={(e) => setSpatial((s) => ({...s, color: e.target.checked}))} /> Tissue colors</label>}
                <button onClick={() => changeCut({pitch:0,yaw:0,offset:0,isolate:"all"})}>Reset cut</button>
              </div></details>}
          <div className="viewer-grid">
            <section className="scene-card" style={settings.background === "black" ? {background:"#05080c"} : settings.background === "white" ? {background:"#f4f3ee"} : undefined}>
              <div className="viewport-heading">
                <span className="axis-dot spatial" />
                <strong className="active-spatial-target" title={volume.atlas?.regions.find(r=>r.id===spatial.region)?.name || volume.roiProvenance?.target || "Head context"}>{bodyContext ? "Body context" : volume.atlas?.regions.find(r=>r.id===spatial.region)?.name || "Head context"}</strong>
                <select className="spatial-select" aria-label="3D rendering mode" value={spatial.mode} onChange={(e) => setSpatial((s) => ({...s, mode: e.target.value}))}>{volume.atlas && <option value="atlas">Anatomy</option>}<option value="solid">Solid</option><option value="volume">Volume</option><option value="context">Context</option></select>
                <IconButton
                  icon={Box}
                  label={
                    bodyContext ? "Focus on head" : "Show full-body context"
                  }
                  active={bodyContext}
                  onClick={() => setBodyContext((b) => !b)}
                />
                <IconButton
                  icon={RotateCcw}
                  label="Toggle slow 3D rotation"
                  active={rotate}
                  onClick={() => setRotate((r) => !r)}
                />
                <div className="scene-navigation">
                  <IconButton icon={Focus} label="Fit to visible content" onClick={()=>commandCamera("fit")}/>
                  <IconButton icon={RotateCcw} label="Reset camera" onClick={()=>commandCamera("reset")}/>
                  <button className="focus-action" aria-label={focus3d?"Return from 3D focus":"Expand 3D view"} title={focus3d?"Return from 3D focus":"Expand 3D view"} onClick={()=>setFocus3d(v=>!v)}><Maximize2 size={13}/><span>{focus3d?"Return to layout":"Expand 3D"}</span></button>
                </div>
              </div>
              <React.Suspense
                fallback={
                  <div className="scene-fallback">Preparing spatial view…</div>
                }
              >
                <Scene cameraCommand={cameraCommand} cameraState={cameraState}
                  spatial={spatial}
                  displaySettings={settings}
                  position={position}
                  onVoxelSelect={(xyz) => navigate(xyz,axis)}
                  onAtlasSelect={selectAtlasRegion}
                  bodyContext={bodyContext}
                  privacy={privacy}
                  volume={volume}
                  slice={position[axis]}
                  axis={axis}
                  showMask={settings.overlay}
                  showReference={settings.reference}
                  brainOpacity={brainOpacity}
                  revision={revision}
                  rotate={rotate}
                />
              </React.Suspense>
              <div className="scene-overlay">
                <span className="scene-caption">
                  {volume.synthetic
                    ? "Synthetic anatomy"
                    : bodyContext
                      ? "Generic body placement · illustrative"
                      : spatial.mode === "atlas" ? "Source anatomical surfaces · SPL/NAC" : (spatial.mode === "solid" || spatial.mode === "volume") ? "Intensity volume · research view" : "Intensity surface · approximate"}
                </span>
                <span className="scene-caption mono">{spatial.mode === "solid" || spatial.mode === "atlas" || spatial.mode === "volume" ? (spatial.cut ? "Free cut plane" : "Whole anatomy") : `${cap(axis)} plane`}</span>
              </div>

              <div className="orbit-note">
                <Compass size={12} /> Drag to orbit · scroll to zoom
              </div>
              <div className="compass">
                <span>S</span>
                <i />
                <b>R</b>
                <em>A</em>
              </div>
            </section>
            {axes.map((a) => (
              <Slice
                key={a}
                volume={volume}
                axis={a}
                slice={position[a]}
                onSlice={changeSlice}
                selected={axis === a}
                onSelect={setAxis}
                settings={{...settings, tissueColors: spatial.color, atlasRegion: spatial.region, atlasColors: spatial.color}}
                tool={tool}
                onPaint={paint}
                onEnd={endStroke}
                point={point}
                position={position}
                spatial={spatial}
                setPoint={(p) => {
                  navigate(voxelAt(volume,p.axis,p.x,p.y,p.slice),p.axis);
                }}
                revision={revision}
                zoom={zoom}
              />
            ))}
            <WorkspaceResize label="Resize 3D and slice views" value={sceneShare} min={30} max={80} ratio onChange={setSceneShare} className="viewer-column-divider" style={{left:`${sceneShare}%`}}/>
            <WorkspaceResize label="Resize view rows" value={rowShare} min={25} max={75} ratio axis="y" onChange={setRowShare} className="viewer-row-divider" style={{top:`${rowShare}%`}}/>
          </div>
          <SliceFilmstrip volume={volume} axis={axis} slice={position[axis]} onAxis={setAxis} onSlice={(s) => changeSlice(axis, s)} settings={settings} />
          <footer className="workspace-footer">
            <span>
              <span className="status-dot" /> {spatial.linked === false ? "Independent cut" : "Linked views"}{" "}
              {spatial.cut && spatial.mode !== "context" && <span className="cut-key" title="Amber dashed line: 3D cut plane intersection"> · Cut trace</span>}
              <span className="footer-divider">/</span>{" "}
              <span className="mono">
                {cap(axis)} {position[axis] + 1}
              </span>
            </span>
            <span>
              {tool === "brush" || tool === "erase"
                ? "Drag to edit proposal"
                : "Scroll a slice to explore"}{" "}
              <kbd>←</kbd>
              <kbd>→</kbd>
            </span>
          </footer>
        </main>
        <WorkspaceResize label="Resize assistant" value={assistantWidth} min={250} max={480} reverse onChange={setAssistantWidth} className="assistant-divider"/>
        <aside className="assistant-panel">
          <div className="assistant-tabs">
            <IconButton icon={PanelRightClose} label="Collapse assistant" onClick={()=>setAssistantCollapsed(true)}/>
            <button
              className={tab === "assistant" ? "selected" : ""}
              onClick={() => setTab("assistant")}
            >
              Assistant
            </button>
            <button
              className={tab === "history" ? "selected" : ""}
              onClick={() => setTab("history")}
            >
              Activity
            </button>
            <IconButton
              icon={SlidersHorizontal}
              label="Display controls"
              active={tab === "display"}
              onClick={() => setTab("display")}
            />
          </div>
          {tab === "assistant" ? (
            <>
              <div className="assistant-intro">
                <div className="assistant-symbol">
                  <Logo />
                </div>
                <div>
                  <h3>A little perspective.</h3>
                  <p>
                    Explore the evidence.
                    <br />
                    Keep your place.
                  </p>
                </div>
              </div>
              <button
                className={`connection-pill ${status.enabled ? "connected" : ""}`}
                onClick={() => setModal("connection")}
              >
                <span className="status-dot" />
                {status.enabled ? "Muse Spark connected" : "Local exploration"}
                <ChevronRight size={12} />
              </button>
              <div className="assistant-target">Selected anatomy: <strong>{volume.atlas?.regions.find(r=>r.id===spatial.region)?.name || "None"}</strong></div>
              <button className="quiet-button" disabled={!status.enabled} onClick={()=>setEvidenceOpen(true)}><Layers size={14}/> Explore literature</button>
              <div className="assistant-messages">
                {!messages.length ? (
                  <div className="empty-conversation">
                    <span className="panel-eyebrow">START WITH A QUESTION</span>
                    <button
                      onClick={() => ask(volume.atlas ? "Show the left hippocampus, isolate it in anatomy view, and select the coronal view." : "Show the largest disagreement")}
                    >
                      <Crosshair size={15} />
                      <span>{volume.atlas ? "Explore the left hippocampus" : "Where do the masks disagree?"}</span>
                      <ArrowUp size={13} />
                    </button>
                    <button onClick={() => ask("Compare the masks")}>
                      <Activity size={15} />
                      <span>Compare annotation overlap</span>
                      <ArrowUp size={13} />
                    </button>
                    <button onClick={() => ask("Show the reference")}>
                      <Layers size={15} />
                      <span>Show the reference outline</span>
                      <ArrowUp size={13} />
                    </button>
                    <div className="assistant-note">
                      {status.enabled
                        ? "Navigation uses metadata. Guided ROI shares reviewed images with Muse and SAM."
                        : "Offline commands navigate the workspace. Connect Meta for model-powered assistance."}
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <div key={i} className={`message ${m.role}`}>
                      <span>
                        {m.role === "user"
                          ? "YOU"
                          : m.source?.startsWith("muse")
                            ? "MUSE SPARK"
                            : m.source}
                      </span>
                      <p>{m.text}</p>
                    </div>
                  ))
                )}
                {busy && (
                  <div className="thinking">
                    <Loader2 size={13} className="spin" /> Working with the
                    workspace…
                  </div>
                )}
              </div>
              <form
                className="composer"
                onSubmit={(e) => {
                  e.preventDefault();
                  ask();
                }}
              >
                <textarea
                  aria-label="Ask SARI"
                  placeholder="Ask about this workspace…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={2000}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      ask();
                    }
                  }}
                />
                <div>
                  <span>
                    {status.enabled ? "Muse Spark · Meta" : "Local commands"}
                  </span>
                  <button
                    aria-label="Send question"
                    disabled={busy || !input.trim()}
                  >
                    <ArrowUp size={17} />
                  </button>
                </div>
              </form>
              <div className="assistant-footer">
                Research assistance. No medical advice.
              </div>
            </>
          ) : tab === "display" ? (
            <div className="display-panel">
              <span className="panel-eyebrow">VIEW SETTINGS</span>
              <label className="privacy-toggle"><input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> Privacy pixelation</label>
              <h3>Make room for detail.</h3>
              <label>Color map<select aria-label="Intensity color map" value={settings.colorMap??"gray"} onChange={(e)=>setSettings((s)=>({...s,colorMap:e.target.value}))}><option value="gray">Grayscale</option><option value="ice">Ice · intensity colors</option><option value="amber">Amber · intensity colors</option></select></label>
              {[["gain","Intensity",.25,4,.05],["contrast","Contrast",.3,3,.05]].map(([key,label,min,max,step])=><label key={key}>{label}<span className="mono">{(settings[key]??1).toFixed(2)}</span><input aria-label={label} type="range" min={min} max={max} step={step} value={settings[key]??1} onChange={(e)=>setSettings((s)=>({...s,[key]:+e.target.value}))} /></label>)}
              <label>3D view<select aria-label="Display rendering mode" value={spatial.mode} onChange={(e)=>setSpatial((s)=>({...s,mode:e.target.value}))}>{volume.atlas&&<option value="atlas">Anatomy surfaces</option>}<option value="solid">Solid cutaway</option><option value="volume">Translucent volume</option><option value="context">Slice context</option></select></label>
              {spatial.mode==="volume"&&<label>Volume opacity<span className="mono">{Math.round((settings.volumeOpacity??.15)*100)}%</span><input aria-label="Volume opacity" type="range" min=".02" max="1" step=".01" value={settings.volumeOpacity??.15} onChange={(e)=>setSettings((s)=>({...s,volumeOpacity:+e.target.value}))} /></label>}
              {(spatial.mode==="solid"||spatial.mode==="volume")&&<label>Ray quality<select aria-label="Ray quality" value={settings.quality??"balanced"} onChange={(e)=>setSettings((s)=>({...s,quality:e.target.value}))}><option value="fast">Fast</option><option value="balanced">Balanced</option><option value="fine">Fine</option></select></label>}
              {spatial.mode==="volume"&&<label>Ray jitter<span className="mono">{Math.round((settings.jitter??0)*100)}%</span><input aria-label="Ray jitter" type="range" min="0" max="1" step=".05" value={settings.jitter??0} onChange={(e)=>setSettings((s)=>({...s,jitter:+e.target.value}))} /></label>}
              <label>3D background<select aria-label="3D background" value={settings.background??"theme"} onChange={(e)=>setSettings((s)=>({...s,background:e.target.value}))}><option value="theme">Follow theme</option><option value="black">Black</option><option value="white">White</option></select></label>

              <label>Solid background threshold <span className="mono">{spatial.threshold}</span><input aria-label="Solid background threshold" type="range" min="5" max="150" value={spatial.threshold} onChange={(e) => setSpatial((s) => ({...s, threshold: +e.target.value}))} /></label>
              <label>
                Window <span className="mono">{settings.window}</span>
                <input
                  aria-label="Window width"
                  type="range"
                  min="30"
                  max="400"
                  value={settings.window}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, window: +e.target.value }))
                  }
                />
              </label>
              <label>
                Level <span className="mono">{settings.level}</span>
                <input
                  aria-label="Window level"
                  type="range"
                  min="0"
                  max="255"
                  value={settings.level}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, level: +e.target.value }))
                  }
                />
              </label>
              <label>
                Overlay opacity{" "}
                <span className="mono">
                  {Math.round(settings.opacity * 100)}%
                </span>
                <input
                  aria-label="Overlay opacity"
                  type="range"
                  min="0"
                  max="1"
                  step=".05"
                  value={settings.opacity}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, opacity: +e.target.value }))
                  }
                />
              </label>
              {spatial.mode === "context" && <label>
                3D anatomy opacity{" "}
                <span className="mono">{Math.round(brainOpacity * 100)}%</span>
                <input
                  aria-label="3D anatomy opacity"
                  type="range"
                  min=".03"
                  max=".7"
                  step=".01"
                  value={brainOpacity}
                  onChange={(e) => setBrainOpacity(+e.target.value)}
                />
              </label>}
              <label>
                Brush radius <span className="mono">{brush} vx</span>
                <input
                  aria-label="Brush radius"
                  type="range"
                  min="1"
                  max="10"
                  value={brush}
                  onChange={(e) => setBrush(+e.target.value)}
                />
              </label>
              <button
                className="button secondary"
                onClick={() => {
                  setSettings({
                    ...displayDefaults,
                    window: volume.atlas ? 100 : volume.id === "slicer-tumor" ? 90 : 210,
                    level: volume.atlas ? 50 : volume.id === "slicer-tumor" ? 45 : 105,
                    overlay: true,
                    reference: true,
                    opacity: 0.55,
                  });
                  setBrainOpacity(0.18);
                  setZoom(1);
                }}
              >
                Reset display
              </button>
            </div>
          ) : (
            <div className="activity-panel">
              <span className="panel-eyebrow">REVIEW TRAIL</span>
              <h3>A record of your work.</h3>
              {events.length ? (
                events.map((e, i) => (
                  <div className="event" key={i}>
                    <span className="status-dot" />
                    <div>
                      <span>{eventPresentation(e.text,volume.atlas?.regions).title}</span>
                      {eventPresentation(e.text,volume.atlas?.regions).details && <details className="event-details"><summary>Technical record</summary><pre>{e.text}</pre></details>}
                      <small>
                        {new Date(e.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">
                  Your navigation actions, annotation edits, and model proposals
                  will appear here.
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={16} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {evidenceOpen && <EvidenceDialog initialResult={volume.literatureSearches?.at(-1)} region={volume.atlas?.regions.find(r=>r.id===spatial.region)?.name || volume.roiProvenance?.target || ""} onClose={()=>setEvidenceOpen(false)} onSave={data=>{if(activeVolume.current!==volume)return;volume.literatureSearches=[...(volume.literatureSearches||[]),data].slice(-10);setRevision(r=>r+1);record(`Literature search saved: ${data.query}; ${data.retrievedAt}`);}}/>}
      {roiJob && <RoiDialog job={roiJob} onClose={()=>setRoiJob(null)} onApply={applyRoi}/>}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <IconButton
              icon={X}
              label="Close dialog"
              onClick={() => setModal(null)}
              className="modal-close"
            />
            <span className="panel-eyebrow">SARI / RESEARCH WORKSPACE</span>
            <h2 id="modal-title">
              {modal === "study"
                ? "Choose your perspective."
                : modal === "connection"
                  ? "Connect your research tools."
                  : modal === "consent"
                    ? "Share this slice with Meta?"
                    : "A quieter way to explore."}
            </h2>
            {modal === "study" ? (
              <>
                <p>
                  Choose a research sample or open a local 3D NIfTI volume. The tumor case is source-labeled; no tumor subtype or lesion mask is supplied.
                </p>
                {researchSamples.map((sample) => <button key={sample.id} className="study-option" onClick={() => openMni(sample.id)} disabled={loadingStudy}>
                  {loadingStudy ? <Loader2 size={24} className="spin" /> : <ScanLine size={24} />}
                  <span><strong>{sample.title}</strong><small>{sample.detail}</small></span><ArrowRight size={17} />
                </button>)}
                <button className="study-option" onClick={restore}>
                  <ScanLine size={24} />
                  <span>
                    <strong>Brain phantom</strong>
                    <small>
                      Synthetic T1-like · 96³ · reference + proposal masks
                    </small>
                  </span>
                  <ArrowRight size={17} />
                </button>
                <button
                  className="study-option"
                  onClick={() => file.current.click()}
                >
                  <FileUp size={24} />
                  <span>
                    <strong>Open local NIfTI</strong>
                    <small>
                      .nii or .nii.gz · up to 80 MB · native voxel axes
                    </small>
                  </span>
                  <ArrowRight size={17} />
                </button>
                <p className="fine-print">
                  Use research data you have permission to process. This
                  prototype is not for clinical interpretation. Imported volumes
                  are not automatically reoriented or registered to an atlas.
                </p>
              </>
            ) : modal === "connection" ? (
              <>
                <p>
                  {status.enabled
                    ? "Meta is connected through the local server."
                    : "Local exploration is ready. Model-powered tools need a server-side API key."}
                </p>
                <div className="connection-status">
                  <span className="status-dot" />
                  {status.reason}
                </div>
                <p className="fine-print">
                  Configure MODEL_API_KEY and META_ENABLED=true in the local
                  .env file, then restart the server. Never put a key in
                  frontend code or chat. Model requests may incur charges;
                  confirm your credit coverage and data-use terms first.
                </p>
                <div className="model-line">
                  <span>Muse Spark</span>
                  <code>{status.model}</code>
                </div>
                <div className="model-line">
                  <span>Segmentation</span>
                  <code>sam-3.1</code>
                </div>
              </>
            ) : modal === "consent" ? (
              <>
                <p>
                  SAM will receive the selected grayscale slice and foreground
                  point. No full volume is uploaded. Contributor/free-credit
                  terms may permit use for product improvement.
                </p>
                <label className="consent">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />{" "}
                  I have permission to share this research sample with Meta
                  under the applicable terms.
                </label>
                <button
                  className="button primary"
                  disabled={!consent}
                  onClick={() => {
                    setModal(null);
                    segment();
                  }}
                >
                  Send slice to SAM
                </button>
              </>
            ) : (
              <>
                <p>
                  Scroll over a scan to change its slice. Drag the 3D view to
                  orbit. Mint is the editable proposal; amber outlines the
                  reference.
                </p>
                <div className="help-grid">
                  <span>Paint / erase</span>
                  <span>Use the annotation toolbar</span>
                  <span>Undo / redo</span>
                  <span>⌘ Z / ⇧ ⌘ Z</span>
                  <span>Change slice</span>
                  <span>← / →</span>
                  <span>Largest difference</span>
                  <span>Computed across axial slices</span>
                </div>
                <p className="fine-print">
                  {studyHelp(volume)}
                </p>
                <p className="fine-print">
                  Dice measures proposal-versus-reference overlap. Intersection conflicts compare sampled predictions with one another. Neither is confidence or clinical accuracy. Research only; no diagnosis, treatment, or medical advice.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
