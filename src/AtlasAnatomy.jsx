import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
let pending;
function loadSurfaces() {
  return pending ||= fetch("/data/spl-atlas/surfaces.bin.gz").then(async (r) => {
    if (!r.ok) throw new Error("Atlas surfaces unavailable");
    const buffer = await new Response(r.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
    const view = new DataView(buffer), np = view.getUint32(0, true), ni = view.getUint32(4, true);
    if (buffer.byteLength !== 8 + np * 4 + ni * 4) throw new Error("Invalid atlas surface data");
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(buffer, 8, np), 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(buffer, 8 + np * 4, ni), 1));
    geometry.computeVertexNormals();
    return geometry;
  });
}
export default function AtlasAnatomy({ volume, spatial, onAtlasSelect }) {
  const shared = React.use(loadSurfaces()), root = useRef();
  const { camera, controls } = useThree();
  const wasIsolated = useRef(false);
  const plane = useMemo(() => new THREE.Plane(), []);
  const geometries = useMemo(() => volume.atlas.regions.map((r) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", shared.attributes.position);
    g.setAttribute("normal", shared.attributes.normal);
    g.setIndex(new THREE.BufferAttribute(shared.index.array.subarray(r.indexStart, r.indexStart + r.indexCount), 1));
    return g;
  }), [shared, volume]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useEffect(() => {
    if (!controls || !root.current) return;
    const region = volume.atlas.regions.find((r) => r.id === spatial.region);
    if (spatial.atlasIsolate && region) {
      const box = new THREE.Box3(), p = new THREE.Vector3();
      for(let j=region.indexStart;j<region.indexStart+region.indexCount;j++) box.expandByPoint(p.fromBufferAttribute(shared.attributes.position,shared.index.array[j]));
      root.current.updateWorldMatrix(true,false); box.applyMatrix4(root.current.matrixWorld);
      const center = box.getCenter(new THREE.Vector3()), radius=box.getSize(new THREE.Vector3()).length()/2;
      const direction = camera.position.clone().sub(controls.target).normalize();
      controls.target.copy(center); camera.position.copy(center).addScaledVector(direction,radius/Math.sin(camera.fov*Math.PI/360)*1.35);
      wasIsolated.current=true; controls.update();
    } else if (wasIsolated.current) {
      const direction=camera.position.clone().sub(controls.target).normalize();
      controls.target.set(0,.25,0); camera.position.copy(controls.target).addScaledVector(direction,4.4);
      wasIsolated.current=false; controls.update();
    }
  }, [spatial.atlasIsolate, spatial.region, controls, camera, shared, volume]);
  useFrame(() => {
    const p = spatial.pitch * Math.PI / 180, y = spatial.yaw * Math.PI / 180;
    // Match the solid renderer's normalized-volume clipping coordinates.
    plane.set(new THREE.Vector3(-Math.sin(y)*Math.cos(p), -Math.sin(p), -Math.cos(y)*Math.cos(p)), spatial.offset);
    const extent = volume.dims.map((n,i) => n * volume.spacing[i]), largest = Math.max(...extent);
    plane.applyMatrix4(new THREE.Matrix4().makeScale(extent[0]/largest*3, extent[2]/largest*3, extent[1]/largest*3));
    root.current.updateWorldMatrix(true, false);
    plane.applyMatrix4(root.current.matrixWorld);
  });
  return <group ref={root}>
    {volume.atlas.regions.map((r, i) => {
      const selected = String(r.id) === String(spatial.region);
      const side = r.name.startsWith("left ") ? "left" : r.name.startsWith("right ") ? "right" : "midline";
      if (spatial.atlasIsolate && spatial.region && !selected) return null;
      if (!selected && spatial.hemisphere && spatial.hemisphere !== "both" && side !== "midline" && side !== spatial.hemisphere) return null;
      // Inner white-matter shells obscure deep structures; expose them on selection.
      if (r.group === "White matter" && !selected) return null;
      const color = selected ? "#70b8ed" : spatial.color ? new THREE.Color(...r.color.map((n) => n/255)).convertSRGBToLinear() : r.group === "Cortex" ? "#d0cdc1" : new THREE.Color(...r.color.map((n) => n/255)).convertSRGBToLinear();
      return <mesh key={r.id} geometry={geometries[i]} onClick={(e) => {e.stopPropagation(); onAtlasSelect?.(r.id);}}>
        <meshStandardMaterial color={color} roughness={.68} metalness={.02} emissive={selected ? "#173b57" : "#000000"} emissiveIntensity={.2} clippingPlanes={spatial.cut ? [plane] : []} side={THREE.DoubleSide} />
      </mesh>;
    })}
  </group>;
}
