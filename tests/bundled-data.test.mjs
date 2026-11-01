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
