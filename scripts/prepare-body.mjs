// Convert the official BodyParts3D 4.0 skin OBJ to a compact neutral body surface.
// node scripts/prepare-body.mjs /path/to/FJ2810.obj
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
const source = process.argv[2];
if (!source) throw new Error("Provide the official FJ2810.obj path.");
const object = new OBJLoader().parse(readFileSync(source, "utf8"));
let raw = object.children.find((c) => c.isMesh).geometry.attributes.position;
const vertices = [];
const minZ = -78.11119842529297,
  height = 1719.4711837768555,
  centerY = -100;
for (let i = 0; i < raw.count; i += 3) {
  let cx = 0,
    cz = 0;
  for (let j = 0; j < 3; j++) {
    cx += raw.getX(i + j) / 3;
    cz += raw.getZ(i + j) / 3;
  }
  // Preserve every original vertex and triangle. Privacy coverage is a separate render layer.
  for (let j = 0; j < 3; j++)
    vertices.push(
      (raw.getX(i + j) / height) * 5,
      ((raw.getZ(i + j) - minZ) / height) * 5 - 2.5,
      (-(raw.getY(i + j) - centerY) / height) * 5,
    );
}
const g = new BufferGeometry();
g.setAttribute("position", new Float32BufferAttribute(vertices, 3));
const merged = mergeVertices(g, 0.0001),
  p = merged.attributes.position.array,
  indices = new Uint32Array(merged.index.array);
const data = Buffer.alloc(8 + p.byteLength + indices.byteLength);
data.writeUInt32LE(p.length, 0);
data.writeUInt32LE(indices.length, 4);
Buffer.from(p.buffer, p.byteOffset, p.byteLength).copy(data, 8);
Buffer.from(indices.buffer).copy(data, 8 + p.byteLength);
mkdirSync("public/models", { recursive: true });
writeFileSync("public/models/body-surface.bin.gz", gzipSync(data));
console.log(
  JSON.stringify({
    vertices: p.length / 3,
    triangles: indices.length / 3,
    compressedBytes: gzipSync(data).length,
  }),
);
