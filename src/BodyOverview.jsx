import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import {
  ArrowRight,
  ArrowUpRight,
  Brain,
  ChevronRight,
  Focus,
  Heart,
  Layers,
  Loader2,
  Moon,
  RotateCcw,
  ScanLine,
  Sun,
  X,
} from "lucide-react";
import HumanBody from "./HumanBody.jsx";
import PrivacyPixelation from "./PrivacyPixelation.jsx";
export default function BodyOverview({
  theme,
  privacy,
  setPrivacy,
  setTheme,
  onHeadSelect,
  loading,
  hasStudy,
  onResume,
  onPhantom,
  onLocal,
}) {
  const [hover, setHover] = useState(false),
    [rotate, setRotate] = useState(false),
    [sources, setSources] = useState(false);
  return (
    <div className="body-page">
      <header className="body-header">
        <div className="body-brand">
          <span className="body-brand-mark">◈</span>
          <span>
            SARI<small>ANATOMY IN CONTEXT</small>
          </span>
        </div>
        <span className="body-header-label">SPATIAL RESEARCH INTERFACE</span>
        <div className="body-header-right">
          <button className="privacy-button" aria-pressed={privacy} onClick={() => setPrivacy(!privacy)}>Privacy pixelation {privacy ? "on" : "off"}</button>
          <span className="research-tag">
            <span />
            RESEARCH ONLY
          </span>
          <button
            className="icon-button"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>
      <main className="body-layout">
        <section className="body-intro">
          <div className="panel-eyebrow">01 / SELECT A REGION</div>
          <h1>
            The whole picture.
            <br />
            <em>A closer look.</em>
          </h1>
          <p>
            Start with the body.
            <br />
            Follow your research inward.
          </p>
          <div className="body-region-list">
            <button
              className="body-region enabled"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={onHeadSelect}
              disabled={loading}
            >
              <span className="region-icon">
                <Brain size={21} />
              </span>
              <span>
                <strong>Head & brain</strong>
                <small>MRI · MNI152 research template</small>
              </span>
              {loading ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <ArrowRight size={18} />
              )}
            </button>
            <div className="body-region future">
              <span className="region-icon">
                <Heart size={20} />
              </span>
              <span>
                <strong>Thorax & heart</strong>
                <small>Future region</small>
              </span>
              <span className="future-dot" />
            </div>
            <div className="body-region future">
              <span className="region-icon">
                <ScanLine size={20} />
              </span>
              <span>
                <strong>Neck & thyroid</strong>
                <small>Future region</small>
              </span>
              <span className="future-dot" />
            </div>
          </div>
          <div className="body-alt-actions">
            <button onClick={onLocal}>
              Open local NIfTI <ArrowUpRight size={12} />
            </button>
            <button onClick={onPhantom}>
              Try synthetic study <ArrowUpRight size={12} />
            </button>
          </div>
        </section>
        <section
          className={`body-stage ${hover ? "head-hover" : ""}`}
          aria-label="Interactive 3D human body"
        >
          <div className="body-stage-grid" />
          <Canvas
            camera={{ position: [3, 1, 8.8], fov: 38 }}
            dpr={[1, 1.7]}
            gl={{ antialias: true, alpha: true }}
          >
            {privacy && <PrivacyPixelation />}
            <ambientLight intensity={1.3} />
            <directionalLight
              position={[3, 5, 5]}
              intensity={2.2}
              color="#d4e9ed"
            />
            <directionalLight
              position={[-4, 2, -2]}
              intensity={2}
              color="#86c7b9"
            />
            <directionalLight position={[0, -2, 5]} intensity={0.6} />
            <React.Suspense fallback={null}>
              <HumanBody
                opacity={0.92}
                onHeadSelect={onHeadSelect}
                onHeadHover={setHover}
                selected={hover || hasStudy}
              />
              <group position={[0, 2.14, -0.02]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.4, 0.005, 8, 80]} />
                  <meshBasicMaterial
                    color="#8edac5"
                    transparent
                    opacity={hover ? 0.9 : 0.45}
                  />
                </mesh>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                  <torusGeometry args={[0.4, 0.003, 8, 80]} />
                  <meshBasicMaterial
                    color="#8edac5"
                    transparent
                    opacity={0.25}
                  />
                </mesh>
              </group>
            </React.Suspense>
            <OrbitControls
              enablePan={false}
              minDistance={6}
              maxDistance={12}
              minPolarAngle={Math.PI * 0.25}
              maxPolarAngle={Math.PI * 0.7}
              autoRotate={rotate}
              autoRotateSpeed={0.35}
              target={[0, 0, 0]}
            />
          </Canvas>
          <button
            className="head-callout"
            onClick={onHeadSelect}
            disabled={loading}
          >
            <span className="status-dot" />
            <span>HEAD & BRAIN</span>
            <ArrowUpRight size={14} />
          </button>
          <div className="body-stage-controls">
            <span>
              <Focus size={12} /> Drag to explore · scroll to zoom
            </span>
            <button
              className={`icon-button ${rotate ? "active" : ""}`}
              aria-label="Toggle body rotation"
              onClick={() => setRotate((r) => !r)}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <div className="body-coordinate">
            <span>S</span>
            <i />
            <b>R</b>
            <em>A</em>
          </div>
        </section>
        <aside className="body-study-card">
          <div className="panel-eyebrow">
            AVAILABLE STUDY <span>01</span>
          </div>
          <div className="mri-thumbnail">
            <img
              src="/data/mni152/preview.png"
              alt="Axial slice from the MNI152 population-average MRI template"
            />
            <span>T1-WEIGHTED MRI</span>
          </div>
          <div className="body-study-heading">
            <span className="study-id">MNI152</span>
            <span className="template-label">RESEARCH TEMPLATE</span>
          </div>
          <h2>
            Real imaging.
            <br />
            Shared understanding.
          </h2>
          <p>
            An average of real brain scans, ready to explore in three
            dimensions.
          </p>
          <div className="body-study-facts">
            <div>
              <span>Source</span>
              <strong>McGill University</strong>
            </div>
            <div>
              <span>Dataset</span>
              <strong>ICBM 2009c · symmetric</strong>
            </div>
            <div>
              <span>Resolution</span>
              <strong>2 mm · derived preview</strong>
            </div>
          </div>
          <button
            className="body-open-study"
            onClick={onHeadSelect}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="spin" />
                Loading MRI…
              </>
            ) : (
              <>
                Explore head study <ArrowRight size={16} />
              </>
            )}
          </button>
          {hasStudy && (
            <button className="body-resume" onClick={onResume}>
              Return to current workspace <ChevronRight size={13} />
            </button>
          )}
          <small className="body-placement-note">
            Mapped to a reference body for context.
            <br />
            Not patient-specific registration.
          </small>
        </aside>
      </main>
      <footer className="body-footer">
        <span>
          <span className="status-dot" />
          Research use · Not clinically validated
        </span>
        <span>Spatial Anatomy Research Interface</span>
        <button onClick={() => setSources(true)}>
          Data & attribution <ArrowUpRight size={11} />
        </button>
      </footer>
      {sources && (
        <div className="modal-backdrop" onClick={() => setSources(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="source-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close attribution"
              onClick={() => setSources(false)}
            >
              <X size={18} />
            </button>
            <span className="panel-eyebrow">DATA PROVENANCE</span>
            <h2 id="source-title">Built on shared research.</h2>
            <p>
              MNI ICBM152 2009c symmetric T1 template and brain mask. © Louis
              Collins / McConnell Brain Imaging Centre, Montreal Neurological
              Institute, McGill University. SARI distributes attributed 2 mm
              nearest-neighbor derivatives.
            </p>
            <p>
              BodyParts3D, © The Database Center for Life Science. Adapted
              reference skin mesh with neutral groin coverage. See bundled
              attribution for current CC BY 4.0 permission and the archived CC
              BY-SA 2.1 Japan notice.
            </p>
            <p className="fine-print">
              The body and MRI come from different reference sources. Their
              placement is contextual; no subject-specific registration is
              claimed. The brain mask is not a ventricular annotation or a model
              prediction.
            </p>
            <a
              className="text-button"
              href="/data/mni152/README.md"
              target="_blank"
              rel="noreferrer"
            >
              MRI source & transformations <ArrowUpRight size={12} />
            </a>
            <a
              className="text-button"
              href="/models/ATTRIBUTION.md"
              target="_blank"
              rel="noreferrer"
            >
              Body model attribution <ArrowUpRight size={12} />
            </a>
          </section>
        </div>
      )}
    </div>
  );
}
