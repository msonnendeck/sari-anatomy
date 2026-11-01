import React, { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { sceneToVoxel } from "./navigation.mjs";
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
  const plane = useMemo(() => new THREE.Plane(), []);
  const geometries = useMemo(() => volume.atlas.regions.map((r) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", shared.attributes.position);
    g.setAttribute("normal", shared.attributes.normal);
    g.setIndex(new THREE.BufferAttribute(shared.index.array.subarray(r.indexStart, r.indexStart + r.indexCount), 1));
    return g;
  }), [shared, volume]);
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
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
      return <mesh key={r.id} geometry={geometries[i]} onClick={(e) => {if(e.delta>4)return;e.stopPropagation();const p=root.current.worldToLocal(e.point.clone());onAtlasSelect?.(r.id,sceneToVoxel(volume,p.toArray()));}}>
        <meshStandardMaterial color={color} roughness={.68} metalness={.02} emissive={selected ? "#173b57" : "#000000"} emissiveIntensity={.2} clippingPlanes={spatial.cut ? [plane] : []} side={THREE.DoubleSide} />
      </mesh>;
    })}
  </group>;
}
