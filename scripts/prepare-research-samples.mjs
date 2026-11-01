// Offline conversion of reviewed public samples; no patient uploads are used.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import * as nifti from "nifti-reader-js";
const root = process.argv[2];
if (!root) throw new Error("Provide the source-data directory");
function readMni(kind) {
  const b = readFileSync(`${root}/mni/mni_icbm152_nlin_sym_09c/mni_icbm152_${kind}_tal_nlin_sym_09c.nii`);
  const buffer = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  const h = nifti.readHeader(buffer), raw = new DataView(nifti.readImage(h, buffer));
  const n = h.dims.slice(1, 4).reduce((a, b) => a * b, 1);
  return { h, values: Float32Array.from({ length: n }, (_, i) => raw.getInt16(i * 2, h.littleEndian) * (h.scl_slope || 1) + (h.scl_inter || 0)) };
}
function write(name, data, dims, spacing, affine, description) {
  const h = new nifti.NIFTI1();
  Object.assign(h, { littleEndian: true, dims: [3, ...dims, 1, 1, 1, 1], pixDims: [1, ...spacing, 1, 1, 1, 1], datatypeCode: 2, numBitsPerVoxel: 8, vox_offset: 352, magic: "n+1", scl_slope: 1, sform_code: 1, xyzt_units: 2, affine, description });
  const b = new Uint8Array(352 + data.length);
  b.set(new Uint8Array(h.toArrayBuffer())); b.set(data, 352);
  writeFileSync(`public/data/research/${name}.nii.gz`, gzipSync(b));
}
function normalize(values) {
  let max = 0; for (const v of values) max = Math.max(max, v);
  return Uint8Array.from(values, (v) => Math.max(0, Math.min(255, Math.round(v / (max || 1) * 255))));
}
mkdirSync("public/data/research", { recursive: true });
const t1 = readMni("t1"), dims = t1.h.dims.slice(1, 4);
write("mni-t1-1mm", normalize(t1.values), dims, [1, 1, 1], t1.h.affine, "MNI152 2009c symmetric T1; original 1mm grid; uint8 derivative");
const wm = readMni("wm"), gm = readMni("gm"), csf = readMni("csf");
const labels = Uint8Array.from(t1.values, (_, i) => {
  const p = [csf.values[i], gm.values[i], wm.values[i]];
  const best = Math.max(...p); return best > .1 ? p.indexOf(best) + 1 : 0;
});
// 2mm tissue labels and T2 match the existing 2mm template's coordinate grid.
const t2 = readMni("t2"), t2data = normalize(t2.values), ds = dims.map((n) => Math.ceil(n / 2));
const down = (data) => Uint8Array.from({ length: ds.reduce((a, b) => a * b, 1) }, (_, i) => {
  const x = i % ds[0], y = Math.floor(i / ds[0]) % ds[1], z = Math.floor(i / (ds[0] * ds[1]));
  return data[x * 2 + dims[0] * (y * 2 + dims[1] * z * 2)];
});
const affine2 = t1.h.affine.map((r, i) => r.map((v, j) => i < 3 && j < 3 ? v * 2 : v));
write("mni-tissues", down(labels), ds, [2, 2, 2], affine2, "Argmax of MNI CSF(1),GM(2),WM(3) probability maps; probability >0.1");
write("mni-t2-2mm", down(t2data), ds, [2, 2, 2], affine2, "MNI152 2009c symmetric T2; 2mm uint8 derivative");
const nrrd = readFileSync(`${root}/MRBrainTumor1.nrrd`);
if (createHash("sha256").update(nrrd).digest("hex") !== "998cb522173839c78657f4bc0ea907cea09fd04e44601f17c82ea27927937b95") throw new Error("Slicer sample checksum mismatch");
const split = nrrd.indexOf(Buffer.from("\n\n"));
const header = nrrd.subarray(0, split).toString();
if (!header.includes("sizes: 256 256 112") || !header.includes("space: left-posterior-superior")) throw new Error("Unexpected sample grid");
const raw = gunzipSync(nrrd.subarray(split + 2));
const values = new Float32Array(256 * 256 * 112);
for (let z = 0; z < 112; z++) for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) values[x + 256 * (y + 256 * z)] = raw.readInt16LE(2 * ((255 - x) + 256 * ((255 - y) + 256 * z)));
write("slicer-tumor", normalize(values), [256, 256, 112], [.9375, .9375, 1.4], [[.9375,0,0,-119.5315],[0,.9375,0,-119.5315],[0,0,1.4,-77.7],[0,0,0,1]], "3D Slicer MRBrainTumor1; LPS to RAS flips; uint8 derivative; no subtype or lesion mask supplied");
console.log("Prepared 1mm T1, 2mm T2, tissue labels and Slicer tumor teaching case.");
