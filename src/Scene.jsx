import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { slicePixels } from "./volume.mjs";
import HumanBody from "./HumanBody.jsx";
import PrivacyPixelation from "./PrivacyPixelation.jsx";
import SolidVolume from "./SolidVolume.jsx";
import NavigationMarker from "./NavigationMarker.jsx";
import { sceneToVoxel } from "./navigation.mjs";
import {visibleBounds,fitDistance,cameraViewKey} from "./camera-framing.mjs";
import AtlasAnatomy from "./AtlasAnatomy.jsx";
function surface(v, mask, step = 2) {
  const verts = [];
  const d = v.dims,
    sp = v.spacing,
    max = Math.max(...d.map((n, i) => n * sp[i])),
    at = (x, y, z) => {
      if (x < 0 || y < 0 || z < 0 || x >= d[0] || y >= d[1] || z >= d[2])
        return false;
      let i = x + d[0] * (y + d[1] * z);
      if (mask) return !!mask[i];
      if (v.synthetic) {
        const a = (x - d[0] / 2) / (d[0] * 0.39),
          b = (y - d[1] * 0.49) / (d[1] * 0.43),
          c = (z - d[2] * 0.49) / (d[2] * 0.45);
        return a * a + b * b + c * c < 0.96 && v.data[i] > 65;
      }
      return v.data[i] > 85;
    };
  const faces = [
    [
      [1, 0, 0],
      [
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1],
        [1, 0, 1],
      ],
    ],
    [
      [-1, 0, 0],
      [
        [0, 0, 1],
        [0, 1, 1],
        [0, 1, 0],
        [0, 0, 0],
      ],
    ],
    [
      [0, 1, 0],
      [
        [0, 1, 1],
        [1, 1, 1],
        [1, 1, 0],
        [0, 1, 0],
      ],
    ],
    [
      [0, -1, 0],
      [
        [0, 0, 0],
        [1, 0, 0],
        [1, 0, 1],
        [0, 0, 1],
      ],
    ],
    [
      [0, 0, 1],
      [
        [1, 0, 1],
        [1, 1, 1],
        [0, 1, 1],
        [0, 0, 1],
      ],
    ],
    [
      [0, 0, -1],
      [
        [0, 0, 0],
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0],
      ],
    ],
  ];
  for (let z = 0; z < d[2]; z += step)
    for (let y = 0; y < d[1]; y += step)
      for (let x = 0; x < d[0]; x += step)
        if (at(x, y, z))
          for (const [delta, corners] of faces)
            if (
              !at(x + delta[0] * step, y + delta[1] * step, z + delta[2] * step)
            )
              for (const idx of [0, 1, 2, 0, 2, 3]) {
                let c = corners[idx];
                verts.push(
                  (((x + c[0] * step - d[0] / 2) * sp[0]) / max) * 3,
                  (((z + c[2] * step - d[2] / 2) * sp[2]) / max) * 3,
                  ((-(y + c[1] * step - d[1] / 2) * sp[1]) / max) * 3,
                );
              }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return g;
}
function VoxelAnatomy({
  volume,
  slice,
  axis,
  showMask,
  showReference,
  brainOpacity,
  revision,
  spatial,
  displaySettings,
  onVoxelSelect,
}) {
  const brain = useMemo(
    () =>
      surface(
        volume,
        null,
        Math.max(2, Math.ceil(Math.max(...volume.dims) / 100)),
      ),
    [volume],
  );
  const mask = useMemo(
    () => surface(volume, volume.proposal, 1),
    [volume, revision],
  );
  const ref = useMemo(() => surface(volume, volume.reference, 1), [volume, revision]);
  const tex = useMemo(() => {
    const { rgba, width, height } = slicePixels(volume, axis, slice, {
      overlay: false,
      reference: false,
    });
    for (let i = 0; i < width * height; i++) {
      if (rgba[i * 4] < 15) rgba[i * 4 + 3] = 0;
    }
    const t = new THREE.DataTexture(rgba, width, height);
    t.needsUpdate = true;
    t.flipY = true;
    return t;
  }, [volume, axis, slice]);
  React.useEffect(() => () => brain.dispose(), [brain]);
  React.useEffect(() => () => mask.dispose(), [mask]);
  React.useEffect(() => () => ref.dispose(), [ref]);
  React.useEffect(() => () => tex.dispose(), [tex]);
  const d = volume.dims,
    sp = volume.spacing,
    max = Math.max(...d.map((n, i) => n * sp[i])),
    s = 3 / max;
  let pos, rot, size;
  if (axis === "axial") {
    pos = [0, (slice - d[2] / 2) * sp[2] * s, 0];
    rot = [-Math.PI / 2, 0, 0];
    size = [d[0] * sp[0] * s, d[1] * sp[1] * s];
  } else if (axis === "coronal") {
    pos = [0, 0, -(slice - d[1] / 2) * sp[1] * s];
    rot = [0, 0, 0];
    size = [d[0] * sp[0] * s, d[2] * sp[2] * s];
  } else {
    pos = [(slice - d[0] / 2) * sp[0] * s, 0, 0];
    rot = [0, Math.PI / 2, 0];
    size = [d[1] * sp[1] * s, d[2] * sp[2] * s];
  }
  if (spatial?.mode === "solid") return <SolidVolume volume={volume} spatial={spatial} revision={revision} displaySettings={displaySettings} />;
  return (
    <group rotation={[0, 0, 0]}>
      <mesh geometry={brain}>
        <meshPhysicalMaterial
          color="#9aadaf"
          roughness={0.56}
          metalness={0.08}
          alphaHash
          opacity={brainOpacity}
          depthWrite
          side={THREE.FrontSide}
        />
      </mesh>
      {showMask && (
        <mesh geometry={mask}>
          <meshStandardMaterial
            color="#6be0c1"
            emissive="#195846"
            emissiveIntensity={0.5}
            roughness={0.35}
          />
        </mesh>
      )}
      {showReference && (
        <mesh geometry={ref} scale={1.005}>
          <meshBasicMaterial
            color="#f0c184"
            wireframe
            transparent
            opacity={0.18}
          />
        </mesh>
      )}
      <mesh position={pos} rotation={rot} onClick={(e) => {if(e.delta>4)return;e.stopPropagation();const p=e.object.parent.worldToLocal(e.point.clone());onVoxelSelect?.(sceneToVoxel(volume,p.toArray()));}}>
        <planeGeometry args={size} />
        <meshBasicMaterial
          map={tex}
          side={THREE.DoubleSide}
          alphaTest={0.5}
          depthWrite
        />
      </mesh>
    </group>
  );
}
function Anatomy(props) {
  if (props.spatial.mode === "atlas" && props.volume.atlas) return <React.Suspense fallback={null}><AtlasAnatomy {...props} /></React.Suspense>;
  if (props.spatial.mode === "solid" || props.spatial.mode === "volume") return <SolidVolume {...props} />;
  return <VoxelAnatomy {...props} />;
}
class Boundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="scene-fallback">
        3D needs WebGL. The slice workspace remains available.
      </div>
    ) : (
      this.props.children
    );
  }
}
function CameraRig({volume,spatial,bodyContext,revision,cameraCommand,cameraState}) {
  const {camera,controls,gl}=useThree();
  const readyKey=useRef(null),viewKey=cameraViewKey(volume,spatial,bodyContext);
  function saveCamera(){
    if(!controls)return;
    cameraState.current={studyId:volume.id,viewKey:readyKey.current,position:camera.position.toArray(),target:controls.target.toArray(),up:camera.up.toArray(),zoom:camera.zoom,fov:camera.fov};
    gl.domElement.dataset.cameraPosition=JSON.stringify(cameraState.current.position);gl.domElement.dataset.cameraTarget=JSON.stringify(cameraState.current.target);gl.domElement.dataset.cameraViewKey=readyKey.current||"";
  }

  const bounds=useMemo(()=>visibleBounds(volume,spatial,bodyContext),[volume,spatial.mode,spatial.isolate,spatial.atlasIsolate,spatial.region,spatial.hemisphere,spatial.threshold,bodyContext,revision]);
  const latest=useRef(bounds);latest.current=bounds;
  function fit(reset=false){
    if(!controls)return;
    const box=latest.current,center=new THREE.Vector3(...box.min.map((n,i)=>(n+box.max[i])/2));
    const direction=reset?new THREE.Vector3(2.6,1.4,3.4).normalize():camera.position.clone().sub(controls.target).normalize();
    if(direction.lengthSq()<.1)direction.set(1,.5,1).normalize();
    controls.target.copy(center);camera.position.copy(center).addScaledVector(direction,fitDistance(box,camera.fov,camera.aspect,direction.toArray()));
    controls.update();readyKey.current=viewKey;saveCamera();
  }
  useEffect(()=>{
    if(!controls)return;
    const save=()=>saveCamera();
    controls.addEventListener('change',save);save();return()=>controls.removeEventListener('change',save);
  },[camera,controls,gl,cameraState,volume.id]);
  const restoredCommand=useRef(null);
  // A snapshot restore takes precedence over content-triggered automatic fitting.
  useEffect(()=>{if(cameraCommand?.kind==='restore'&&restoredCommand.current!==cameraCommand.id)return;fit();},[controls,volume.id,bodyContext,spatial.mode,spatial.isolate,spatial.atlasIsolate,spatial.atlasIsolate?spatial.region:null,spatial.hemisphere]);
  useEffect(()=>{
    if(!controls||!cameraCommand?.id)return;
    if(cameraCommand.kind==='restore'&&cameraCommand.pose){
      const p=cameraCommand.pose;camera.position.fromArray(p.position);controls.target.fromArray(p.target);
      if(p.up)camera.up.fromArray(p.up);camera.zoom=p.zoom||1;camera.fov=p.fov||40;camera.updateProjectionMatrix();controls.update();readyKey.current=viewKey;saveCamera();restoredCommand.current=cameraCommand.id;
    }else fit(cameraCommand.kind==='reset');
  },[cameraCommand?.id,controls]);
  return null;
}
export default function Scene(props) {
  const initialCamera=useMemo(()=>({position:[2.6,1.4,3.4],fov:40}),[]);
  return (
    <Boundary>
      <Canvas camera={initialCamera}
        dpr={[1, 1.8]}
        gl={{ antialias: true, alpha: true, localClippingEnabled: true }}
      >
        {props.bodyContext && props.privacy && <PrivacyPixelation />}
        <ambientLight intensity={1.3} />
        <directionalLight
          position={[4, 5, 3]}
          intensity={2.4}
          color="#d7f5ed"
        />
        <directionalLight
          position={[-3, 0, -2]}
          intensity={1.5}
          color="#91acdf"
        />
        {props.bodyContext ? (
          <React.Suspense fallback={null}>
            <HumanBody opacity={0.2} selected />
            <group position={[0, 2.14, -0.02]} scale={0.18}>
              <Anatomy {...props} /><NavigationMarker {...props} />
            </group>
          </React.Suspense>
        ) : (
          <><Anatomy {...props} /><NavigationMarker {...props} /></>
        )}
        <OrbitControls
          makeDefault
          enablePan={true}
          minDistance={.04}
          maxDistance={80}
          autoRotate={props.rotate}
          autoRotateSpeed={0.4}
        />
        <CameraRig {...props}/>
      </Canvas>
    </Boundary>
  );
}
