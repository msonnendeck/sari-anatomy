import { test } from "node:test";
import assert from "node:assert/strict";
import * as nifti from "nifti-reader-js";
import { readVolume } from "../src/nifti.mjs";
function sample() {
  const h = new nifti.NIFTI1();
  h.littleEndian = true;
  h.dims = [3, 8, 10, 12, 1, 1, 1, 1];
  h.pixDims = [1, 1, 2, 3, 1, 1, 1, 1];
  h.datatypeCode = 2;
  h.numBitsPerVoxel = 8;
  h.vox_offset = 352;
  h.magic = "n+1";
  h.scl_slope = 1;
  h.affine = [
    [1, 0, 0, 0],
    [0, 2, 0, 0],
    [0, 0, 3, 0],
    [0, 0, 0, 1],
  ];
  const buffer = new Uint8Array(352 + 960);
  buffer.set(new Uint8Array(h.toArrayBuffer()));
  for (let i = 0; i < 960; i++) buffer[352 + i] = i % 256;
  return new File([buffer], "test.nii");
}
test("reads scalar NIfTI dimensions, spacing and masks", async () => {
  const v = await readVolume(sample());
  assert.deepEqual(v.dims, [8, 10, 12]);
  assert.deepEqual(v.spacing, [1, 2, 3]);
  assert.equal(v.data.length, 960);
  assert.equal(v.synthetic, false);
  assert.equal(v.binaryMask[0], 0);
  assert.equal(v.binaryMask[1], 1);
});
test("rejects invalid files without mutating workspace", async () => {
  await assert.rejects(
    readVolume(new File(["invalid"], "bad.nii")),
    /not a supported/,
  );
});
