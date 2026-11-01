import test from 'node:test';
import assert from 'node:assert/strict';
import { growRegion } from '../src/regions.mjs';
test('region growing respects connectivity, threshold, boundaries and size limit', () => {
  const volume = {dims: [3,3,3], data: new Uint8Array(27)};
  volume.data[0] = 100; volume.data[1] = 105; volume.data[2] = 145;
  volume.data[8] = 100; // disconnected, including across a row boundary
  const result = growRegion(volume, [0,0,0], 12);
  assert.equal(result.count, 2);
  assert.equal(result.mask[8], 0);
  assert.equal(result.mask[2], 0);
  const capped = growRegion(volume, [0,0,0], 12, 1);
  assert.equal(capped.capped, true); assert.equal(capped.count, 1);
  assert.throws(() => growRegion(volume, [2,2,2]), /background/);
});
test('slice aspect respects anisotropic voxel spacing', async () => {
  const { sliceAspect } = await import('../src/volume.mjs');
  const v = {dims: [256,256,112], spacing: [.9375,.9375,1.4]};
  assert.equal(sliceAspect(v, 'axial'), 1);
  assert.ok(Math.abs(sliceAspect(v, 'coronal') - 240 / 156.8) < 1e-12);
});
