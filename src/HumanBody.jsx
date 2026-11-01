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
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1,
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
      <group position={[0, -0.13, 0.02]}>
        {[
          [
            [0, 0, 0],
            [0.45, 0.29, 0.43],
          ],
          [
            [-0.28, 0.04, 0],
            [0.23, 0.21, 0.36],
          ],
          [
            [0.28, 0.04, 0],
            [0.23, 0.21, 0.36],
          ],
          [
            [-0.16, -0.18, 0.09],
            [0.28, 0.19, 0.38],
          ],
          [
            [0.17, -0.18, 0.09],
            [0.28, 0.19, 0.38],
          ],
          [
            [-0.08, 0.18, 0.05],
            [0.28, 0.18, 0.34],
          ],
          [
            [0.16, 0.16, -0.06],
            [0.23, 0.18, 0.34],
          ],
        ].map(([position, scale], i) => (
          <mesh key={i} position={position} scale={scale} renderOrder={5}>
            <sphereGeometry args={[1, 32, 20]} />
            <meshStandardMaterial
              color="#c4d5d5"
              roughness={1}
              metalness={0}
              transparent={false}
              depthWrite
            />
          </mesh>
        ))}
      </group>
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
