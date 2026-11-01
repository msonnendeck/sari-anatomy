import React from "react";
import * as THREE from "three";
let promise;
function bodyGeometry() {
  if (!promise)
    promise = fetch("/models/body-surface.bin.gz").then(async (response) => {
      if (!response.ok) throw new Error("Body asset unavailable");
      const stream = response.body.pipeThrough(new DecompressionStream("gzip")),
        buffer = await new Response(stream).arrayBuffer(),
        header = new DataView(buffer),
        np = header.getUint32(0, true),
        ni = header.getUint32(4, true);
      if (buffer.byteLength !== 8 + np * 4 + ni * 4)
        throw new Error("Body geometry is incomplete");
      const g = new THREE.BufferGeometry();
      g.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(buffer, 8, np), 3),
      );
      g.setIndex(
        new THREE.BufferAttribute(new Uint32Array(buffer, 8 + np * 4, ni), 1),
      );
      g.computeVertexNormals();
      return g;
    });
  return promise;
}
export default function HumanBody({
  opacity = 1,
  onHeadSelect,
  onHeadHover,
  selected = false,
}) {
  const geometry = React.use(bodyGeometry());
  const material = {
    color: "#90a8aa",
    roughness: 0.57,
    metalness: 0.12,
    transparent: false,
    alphaHash: opacity < 1,
    opacity,
    depthWrite: true,
  };
  return (
    <group>
      <mesh
        geometry={geometry}
        dispose={null}
        onClick={
          onHeadSelect
            ? (e) => {
                e.stopPropagation();
                if (e.point.y > 1.65) onHeadSelect();
              }
            : undefined
        }
        onPointerMove={
          onHeadHover ? (e) => onHeadHover(e.point.y > 1.65) : undefined
        }
        onPointerOut={onHeadHover ? () => onHeadHover(false) : undefined}
      >
        <meshStandardMaterial {...material} />
      </mesh>
      <mesh
        position={[0, 2.14, -0.02]}
        scale={[0.31, 0.36, 0.3]}
        onClick={
          onHeadSelect
            ? (e) => {
                e.stopPropagation();
                onHeadSelect();
              }
            : undefined
        }
        onPointerOver={onHeadHover ? () => onHeadHover(true) : undefined}
        onPointerOut={onHeadHover ? () => onHeadHover(false) : undefined}
      >
        <sphereGeometry args={[1, 32, 24]} />
        <meshBasicMaterial
          color="#83dec7"
          transparent
          opacity={selected ? 0.12 : 0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
