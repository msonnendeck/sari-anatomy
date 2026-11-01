import React, { useEffect, useMemo, useRef } from "react";
import { slicePixels, sliceCount } from "./volume.mjs";

// Previews show intensity data only so annotation edits do not redraw the strip.
function Thumbnail({ volume, axis, slice, windowWidth, level, gain, contrast, colorMap }) {
  const ref = useRef();
  useEffect(() => {
    const { rgba, width, height } = slicePixels(volume, axis, slice, {
      window: windowWidth, level, gain, contrast, colorMap, overlay: false, reference: false,
    });
    const c = ref.current;
    c.width = width;
    c.height = height;
    c.getContext("2d").putImageData(new ImageData(rgba, width, height), 0, 0);
  }, [volume, axis, slice, windowWidth, level, gain, contrast, colorMap]);
  return <canvas ref={ref} aria-hidden="true" />;
}
const Preview = React.memo(Thumbnail);

export default function SliceFilmstrip({ volume, axis, slice, onAxis, onSlice, settings }) {
  const strip = useRef();
  const count = sliceCount(volume, axis);
  // A sampled overview keeps even large imported volumes inexpensive to browse.
  const indices = useMemo(() => {
    const step = Math.max(1, Math.ceil(count / 48));
    return [...new Set([...Array.from({ length: Math.ceil(count / step) }, (_, i) => i * step), count - 1, slice])].sort((a, b) => a - b);
  }, [count, slice]);
  const nearest = slice;
  useEffect(() => {
    const container = strip.current;
    const item = container.querySelector('[aria-current="true"]');
    if (item) container.scrollTo({ left: item.offsetLeft - container.offsetLeft - container.clientWidth / 2 + item.clientWidth / 2 });
  }, [nearest, axis, volume]);
  return <section className="slice-filmstrip" aria-label="Slice navigator">
    <div className="filmstrip-controls">
      <select aria-label="Filmstrip plane" value={axis} onChange={(e) => onAxis(e.target.value)}>
        {["axial", "coronal", "sagittal"].map((a) => <option key={a} value={a}>{volume.synthetic || volume.anatomicalAxes ? a[0].toUpperCase() + a.slice(1) : { axial: "Voxel K", coronal: "Voxel J", sagittal: "Voxel I" }[a]}</option>)}
      </select>
      <input aria-label="Filmstrip slice" type="range" min="0" max={count - 1} value={slice} onChange={(e) => onSlice(+e.target.value)} />
      <span className="mono">{slice + 1} / {count}</span>
    </div>
    <div className="filmstrip-frames" ref={strip}>
      {indices.map((n) => <button key={`${axis}-${n}`} aria-label={`Go to ${axis} slice ${n + 1}`} aria-current={n === nearest ? "true" : undefined} onClick={() => onSlice(n)}>
        <Preview volume={volume} axis={axis} slice={n} windowWidth={settings.window} level={settings.level} gain={settings.gain} contrast={settings.contrast} colorMap={settings.colorMap} />
        <span>{n + 1}</span>
      </button>)}
    </div>
  </section>;
}
