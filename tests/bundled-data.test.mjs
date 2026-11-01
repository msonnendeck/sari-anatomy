import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { readVolume } from "../src/nifti.mjs";
test("bundled MNI template and brain mask share the documented RAS grid", async () => {
  const image = await readVolume(
    new File([readFileSync("public/data/mni152/t1.nii.gz")], "t1.nii.gz"),
  );
  const mask = await readVolume(
    new File(
      [readFileSync("public/data/mni152/brain-mask.nii.gz")],
      "mask.nii.gz",
    ),
  );
  assert.deepEqual(image.dims, [97, 115, 97]);
  assert.deepEqual(image.spacing, [2, 2, 2]);
  assert.deepEqual(image.affine, [
    [2, 0, 0, -96],
    [0, 2, 0, -132],
    [0, 0, 2, -78],
    [0, 0, 0, 1],
  ]);
  assert.deepEqual(image.affine, mask.affine);
  const count = mask.binaryMask.reduce((a, b) => a + b, 0);
  assert.ok(count > 100000 && count < 300000);
  assert.equal(image.data.length, mask.binaryMask.length);
  assert.ok(image.data.some((v) => v > 100));
});
test("bundled human mesh has valid indices and normalized body height", () => {
  const b = gunzipSync(readFileSync("public/models/body-surface.bin.gz"));
  const np = b.readUInt32LE(0),
    ni = b.readUInt32LE(4);
  assert.equal(b.length, 8 + np * 4 + ni * 4);
  assert.equal(ni % 3, 0);
  let minY = Infinity,
    maxY = -Infinity;
  for (let i = 0; i < np; i++) {
    let v = b.readFloatLE(8 + i * 4);
    assert.ok(Number.isFinite(v));
    if (i % 3 === 1) {
      minY = Math.min(minY, v);
      maxY = Math.max(maxY, v);
    }
  }
  assert.ok(Math.abs(maxY - minY - 5) < 0.001);
  for (let i = 0; i < ni; i++)
    assert.ok(b.readUInt32LE(8 + np * 4 + i * 4) < np / 3);
});
test("research samples retain high-resolution grids, RAS alignment and tissue classes", async () => {
  const read = (name) => readVolume(new File([readFileSync(`public/data/research/${name}.nii.gz`)], `${name}.nii.gz`));
  const hi = await read('mni-t1-1mm');
  assert.deepEqual(hi.dims, [193,229,193]);
  assert.deepEqual(hi.spacing, [1,1,1]);
  const t2 = await read('mni-t2-2mm'), tissue = await read('mni-tissues');
  assert.deepEqual(t2.affine, tissue.affine);
  assert.deepEqual(tissue.dims, [97,115,97]);
  assert.deepEqual([...new Set(tissue.data)].sort((a,b)=>a-b), [0,85,170,255]);
  const tumor = await read('slicer-tumor');
  assert.deepEqual(tumor.dims, [256,256,112]);
  assert.deepEqual(tumor.spacing, [.9375,.9375,Math.fround(1.4)]);
  assert.ok(tumor.affine[0][0] > 0 && tumor.affine[1][1] > 0);
  assert.ok(tumor.reference.every(v => v === 0));
});
