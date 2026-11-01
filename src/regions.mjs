// Six-connected, intensity-bounded research ROI. This is not anatomical labeling.
export function growRegion(volume, seed, tolerance = 12, limit = 400000) {
  const d = volume.dims, n = volume.data.length;
  if (!seed.every((v, i) => Number.isInteger(v) && v >= 0 && v < d[i])) throw new Error("Place a seed inside the scan first.");
  const start = seed[0] + d[0] * (seed[1] + d[1] * seed[2]);
  const value = volume.data[start];
  if (value < 15) throw new Error("Place the seed on tissue, away from the background.");
  const visited = new Uint8Array(n), mask = new Uint8Array(n);
  const queue = new Uint32Array(Math.min(n, limit));
  let head = 0, tail = 1, capped = false;
  queue[0] = start; visited[start] = 1; mask[start] = 1;
  while (head < tail) {
    const i = queue[head++], x = i % d[0], y = Math.floor(i / d[0]) % d[1], z = Math.floor(i / (d[0] * d[1]));
    const adjacent = [x > 0 ? i - 1 : -1, x < d[0] - 1 ? i + 1 : -1, y > 0 ? i - d[0] : -1, y < d[1] - 1 ? i + d[0] : -1, z > 0 ? i - d[0] * d[1] : -1, z < d[2] - 1 ? i + d[0] * d[1] : -1];
    for (const j of adjacent) {
      if (j < 0 || visited[j]) continue;
      visited[j] = 1;
      if (volume.data[j] < 15 || Math.abs(volume.data[j] - value) > tolerance) continue;
      if (tail >= queue.length) { capped = true; continue; }
      queue[tail++] = j; mask[j] = 1;
    }
  }
  return { mask, count: tail, capped };
}
