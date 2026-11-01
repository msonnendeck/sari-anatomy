// Run after extracting the official McGill 2009c symmetric NIfTI archive:
// node scripts/prepare-mni.mjs /absolute/path/to/mni_icbm152_nlin_sym_09c
import * as nifti from "nifti-reader-js";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";
const source = process.argv[2];
if (!source) throw new Error("Provide the extracted official MNI directory.");
mkdirSync("public/data/mni152", { recursive: true });
for (const [name, input, isMask] of [
  ["t1", "mni_icbm152_t1_tal_nlin_sym_09c.nii", false],
  ["brain-mask", "mni_icbm152_t1_tal_nlin_sym_09c_mask.nii", true],
]) {
  const b = readFileSync(path.join(source, input)),
    buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength),
    h = nifti.readHeader(buf),
    raw = new DataView(nifti.readImage(h, buf)),
    dims = h.dims.slice(1, 4),
    outDims = dims.map((d) => Math.ceil(d / 2)),
    n = outDims.reduce((a, b) => a * b, 1);
  const out = new ArrayBuffer(n * (isMask ? 1 : 4)),
    view = new DataView(out);
  for (let z = 0; z < outDims[2]; z++)
    for (let y = 0; y < outDims[1]; y++)
      for (let x = 0; x < outDims[0]; x++) {
        const i = x * 2 + dims[0] * (y * 2 + dims[1] * z * 2),
          j = x + outDims[0] * (y + outDims[1] * z),
          value =
            raw.getInt16(i * 2, h.littleEndian) * (h.scl_slope || 1) +
            (h.scl_inter || 0);
        if (isMask) view.setUint8(j, value > 0.5 ? 1 : 0);
        else view.setFloat32(j * 4, value, true);
      }
  const nh = new nifti.NIFTI1();
  nh.littleEndian = true;
  nh.dims = [3, ...outDims, 1, 1, 1, 1];
  nh.pixDims = [1, 2, 2, 2, 1, 1, 1, 1];
  nh.datatypeCode = isMask ? 2 : 16;
  nh.numBitsPerVoxel = isMask ? 8 : 32;
  nh.vox_offset = 352;
  nh.magic = "n+1";
  nh.scl_slope = 1;
  nh.sform_code = 1;
  nh.xyzt_units = 2;
  nh.affine = h.affine.map((row, i) =>
    row.map((v, j) => (i < 3 && j < 3 ? v * 2 : v)),
  );
  nh.description =
    "MNI ICBM152 2009c symmetric; SARI 2mm nearest-neighbor derivative";
  const merged = new Uint8Array(352 + out.byteLength);
  merged.set(new Uint8Array(nh.toArrayBuffer()));
  merged.set(new Uint8Array(out), 352);
  writeFileSync(`public/data/mni152/${name}.nii.gz`, gzipSync(merged));
  console.log(`${name}: ${outDims.join("x")} at 2mm`);
}
