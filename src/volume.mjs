import { intensityColor } from "./display.mjs";
export const index3 = (x, y, z, d) => x + d[0] * (y + d[1] * z);
export function phantom(size = 96) {
  const dims = [size, size, size],
    n = size ** 3,
    data = new Uint8Array(n),
    reference = new Uint8Array(n),
    proposal = new Uint8Array(n);
  for (let z = 0; z < size; z++)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const a = (x - size / 2) / (size * 0.39),
          b = (y - size * 0.49) / (size * 0.43),
          c = (z - size * 0.49) / (size * 0.45),
          r = a * a + b * b + c * c,
          i = index3(x, y, z, dims);
        const noise =
          ((Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453) % 1) * 4;
        if (r < 1.13) {
          data[i] = r > 1.04 ? 35 : r > 1 ? 190 : r > 0.94 ? 24 : 0;
        }
        if (r < 1) {
          const fold =
            Math.sin(21 * Math.atan2(b, a) + Math.sin(z * 0.23) * 2) +
            Math.sin(x * 0.54 + y * 0.27 + z * 0.41);
          const sulci = r > 0.65 && fold > 1.08;
          const deep =
            Math.sin(x * 0.27) * Math.cos(y * 0.31) * Math.sin(z * 0.19);
          data[i] = Math.max(
            0,
            Math.min(
              255,
              (sulci ? 48 : r > 0.72 ? 112 : 163) + deep * 17 + noise,
            ),
          );
          if (Math.abs(a) < 0.016 && r > 0.15) data[i] = 40;
          const v =
            (Math.abs(a) - 0.13) ** 2 / 0.006 +
            (b + 0.08) ** 2 / 0.13 +
            (c - 0.05) ** 2 / 0.035;
          const horn =
            (Math.abs(a) - (0.12 + 0.05 * Math.sin(b * 8))) ** 2 / 0.003 +
            (b - 0.19) ** 2 / 0.025 +
            (c + 0.07) ** 2 / 0.022;
          if (v < 1 || horn < 1) {
            reference[i] = 1;
            data[i] = 26 + noise;
          }
          const vp =
            (Math.abs(a) - 0.14) ** 2 / 0.007 +
            (b + 0.06) ** 2 / 0.14 +
            (c - 0.07) ** 2 / 0.04;
          if (vp < 1 || horn < 0.87) proposal[i] = 1;
          if (c < -0.63 && r < 0.86)
            data[i] = 100 + Math.sin(y * 2 + x * 0.3) * 24 + noise;
        }
      }
  return {
    id: "sari-phantom-v1",
    name: "Brain phantom",
    series: "Synthetic T1-like volume",
    dims,
    spacing: [2, 2, 2],
    data,
    reference,
    proposal,
    synthetic: true,
    orientation: "Illustrative coordinates",
    source: "SARI procedural phantom v1 · no patient data",
    revision: 0,
  };
}
export function compareMasks(a, b, dims) {
  let countA = 0,
    countB = 0,
    intersection = 0,
    difference = 0;
  const slices = new Array(dims[2]).fill(0);
  for (let i = 0; i < a.length; i++) {
    const aa = !!a[i],
      bb = !!b[i];
    if (aa) countA++;
    if (bb) countB++;
    if (aa && bb) intersection++;
    if (aa !== bb) {
      difference++;
      slices[Math.floor(i / (dims[0] * dims[1]))]++;
    }
  }
  const max = Math.max(...slices);
  return {
    countA,
    countB,
    intersection,
    difference,
    dice: countA + countB ? (2 * intersection) / (countA + countB) : 1,
    slices,
    worst: slices.indexOf(max),
    max,
  };
}
export function sliceSize(v, axis) {
  return axis === "axial"
    ? [v.dims[0], v.dims[1]]
    : axis === "coronal"
      ? [v.dims[0], v.dims[2]]
      : [v.dims[1], v.dims[2]];
}
export function sliceAspect(v, axis) {
  const [w, h] = sliceSize(v, axis);
  const [a, b] = axis === "axial" ? [0, 1] : axis === "coronal" ? [0, 2] : [1, 2];
  return w * v.spacing[a] / (h * v.spacing[b]);
}
export function voxelAt(v, axis, u, w, s) {
  const d = v.dims;
  return axis === "axial"
    ? [u, d[1] - 1 - w, s]
    : axis === "coronal"
      ? [u, s, d[2] - 1 - w]
      : [s, u, d[2] - 1 - w];
}
export function sliceCount(v, axis) {
  return v.dims[axis === "axial" ? 2 : axis === "coronal" ? 1 : 0];
}
export function paintMask(v, axis, s, u, w, radius, erase) {
  const mask = v.proposal;
  const [width, height] = sliceSize(v, axis);
  for (
    let yy = Math.max(0, Math.floor(w - radius));
    yy < Math.min(height, w + radius + 1);
    yy++
  )
    for (
      let xx = Math.max(0, Math.floor(u - radius));
      xx < Math.min(width, u + radius + 1);
      xx++
    )
      if ((xx - u) ** 2 + (yy - w) ** 2 <= radius ** 2) {
        const [x, y, z] = voxelAt(v, axis, xx, yy, s);
        mask[index3(x, y, z, v.dims)] = erase ? 0 : 1;
      }
}
export function slicePixels(
  v,
  axis,
  s,
  {
    window = 210,
    level = 105,
    overlay = true,
    reference = true,
    opacity = 0.55,
    tissueColors = false,
    atlasRegion = null,
    atlasColors = false,
    gain = 1, contrast = 1, colorMap = "gray",
  } = {},
) {
  const [width, height] = sliceSize(v, axis);
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const xyz = voxelAt(v, axis, x, y, s),
        i = index3(...xyz, v.dims),
        p = (x + y * width) * 4;
      const val = Math.max(
        0,
        Math.min(255, ((v.data[i] - (level - window / 2)) * 255) / window),
      );
      let color = intensityColor(v.data[i], {window,level,gain,contrast,colorMap});
      if (tissueColors && v.tissues?.[i]) {
        const tint = [[0,0,0], [184,125,199], [219,168,110], [110,186,232]][v.tissues[i]];
        color = tint.map((c) => c * .65 + val * .35);
      }
      const atlasId = v.atlasLabels?.[i];
      if (atlasColors && atlasId && v.atlas?.table[atlasId]) color = v.atlas.table[atlasId].color.map((c) => c * .6 + val * .4);
      if (atlasRegion && atlasId === Number(atlasRegion)) {
        const adjacent = [Math.max(0,x-1), Math.max(0,y-1)];
        const edge = x === 0 || y === 0 || x === width-1 || y === height-1 || v.atlasLabels[index3(...voxelAt(v,axis,adjacent[0],y,s),v.dims)] !== atlasId || v.atlasLabels[index3(...voxelAt(v,axis,x,adjacent[1],s),v.dims)] !== atlasId;
        color = edge ? [90,180,245] : color.map((c,j) => c*.55 + [90,180,245][j]*.45);
      }
      if (overlay && v.proposal?.[i])
        color = color.map(
          (a, j) => a * (1 - opacity) + [86, 207, 183][j] * opacity,
        );
      if (reference && v.reference?.[i]) {
        const edge =
          x === 0 ||
          y === 0 ||
          x === width - 1 ||
          y === height - 1 ||
          !v.reference[
            index3(...voxelAt(v, axis, Math.max(0, x - 1), y, s), v.dims)
          ] ||
          !v.reference[
            index3(...voxelAt(v, axis, x, Math.max(0, y - 1), s), v.dims)
          ];
        if (edge) color = [226, 180, 112];
      }
      rgba.set([...color, 255], p);
    }
  return { rgba, width, height };
}
