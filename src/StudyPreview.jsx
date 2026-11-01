import React, { useEffect, useRef } from "react";
import { slicePixels, sliceCount, sliceAspect } from "./volume.mjs";

// Draw real, unannotated slices from the active volume, entirely in the browser.
export default function StudyPreview({ volume }) {
  const canvas = useRef();
  useEffect(() => {
    const c = canvas.current, ctx = c.getContext("2d");
    c.width = 480; c.height = 240;
    ctx.fillStyle = "#080e14"; ctx.fillRect(0, 0, 480, 240);
    const window = volume.atlas ? 100 : volume.id === "slicer-tumor" ? 90 : 210;
    for (const [axis, rect, label] of [
      ["sagittal", [16, 42, 276, 180], "S"],
      ["axial", [310, 28, 152, 92], "A"],
      ["coronal", [310, 132, 152, 92], "C"],
    ]) {
      const { rgba, width, height } = slicePixels(volume, axis, Math.floor(sliceCount(volume, axis) / 2), { window, level: window / 2, overlay: false, reference: false });
      const image = document.createElement("canvas"); image.width = width; image.height = height;
      image.getContext("2d").putImageData(new ImageData(rgba, width, height), 0, 0);
      const [x, y, w, h] = rect, aspect = sliceAspect(volume, axis);
      const dw = Math.min(w, h * aspect), dh = dw / aspect;
      ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
      ctx.fillStyle = "#8babb8"; ctx.font = "12px monospace";
      ctx.fillText(volume.synthetic || volume.anatomicalAxes ? label : { sagittal: "I", axial: "K", coronal: "J" }[axis], x + 4, y + 15);
    }
    ctx.strokeStyle = "#26353f"; ctx.beginPath(); ctx.moveTo(300, 24); ctx.lineTo(300, 224); ctx.stroke();
  }, [volume]);
  return <canvas ref={canvas} className="study-preview" role="img" aria-label={`Three scan previews from ${volume.name}`} />;
}
