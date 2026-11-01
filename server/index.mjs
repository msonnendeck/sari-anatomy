import "dotenv/config";
import express from "express";
import {installEvidenceRoute} from "./evidence.mjs";
import {installRoiRoutes} from "./roi-api.mjs";
import { expandMask } from "./sam-mask.mjs";
import { validAction, conversationHistory } from "../src/assistant-actions.mjs";
import OpenAI from "openai";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { networkInterfaces } from "node:os";
const port = Number(process.env.PORT) || 5187;
const host = process.env.HOST || "127.0.0.1";
const localHosts = new Set(["localhost", "127.0.0.1"]);
if (host !== "127.0.0.1" && host !== "localhost") {
  for (const addresses of Object.values(networkInterfaces()))
    for (const address of addresses || [])
      if (address.family === "IPv4" && !address.internal) localHosts.add(address.address);
}
const allowedAuthorities = new Set([...localHosts].map((h) => `${h}:${port}`));
const allowedOrigins = new Set([...allowedAuthorities].map((h) => `http://${h}`));
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "12mb" }));
const ready = () =>
  process.env.META_ENABLED === "true" && !!process.env.MODEL_API_KEY;
app.use("/api", (req, res, next) => {
  const origin = req.get("origin");
  if (!allowedAuthorities.has(req.get("host")) || (origin && !allowedOrigins.has(origin)))
    return res.status(403).json({ error: "Only requests from this local app are accepted." });
  next();
});
app.get("/api/status", (req, res) =>
  res.json({
    enabled: ready(),
    model: process.env.META_MODEL || "muse-spark-1.3-contributor",
    sam: "sam-3.1",
    reason: !process.env.MODEL_API_KEY
      ? "No server API key configured"
      : process.env.META_ENABLED !== "true"
        ? "Model calls are disabled"
        : "Ready",
  }),
);
let active = 0;
app.use("/api", (req, res, next) => {
  if (req.method !== "POST") return next();
  if (!ready())
    return res
      .status(503)
      .json({
        error:
          "Meta is not connected. Add a server API key and enable model calls.",
      });
  if (active >= 2)
    return res
      .status(429)
      .json({ error: "Two requests are already running. Please wait." });
  active++;
  res.on("finish", () => active--);
  next();
});
const client = () =>
  new OpenAI({
    apiKey: process.env.MODEL_API_KEY,
    baseURL: "https://api.meta.ai/v1",
    timeout: 60000,
    maxRetries: 1,
  });
app.post("/api/assistant", async (req, res) => {
  try {
    const { message, context, history } = req.body;
    if (typeof message !== "string" || message.length > 2000)
      return res
        .status(400)
        .json({ error: "Ask a question under 2,000 characters." });
    const r = await client().chat.completions.create({
      model: process.env.META_MODEL || "muse-spark-1.3-contributor",
      max_completion_tokens: 1500,
      reasoning_effort: "low",
      messages: [
        {
          role: "system",
          content:
            "You are SARI, a concise research workspace assistant. Never diagnose, detect disease, recommend care, or interpret patient health. Only navigate and explain provided annotation metrics. The volume may be synthetic. Do not claim you saw images: you receive metadata and computed metrics only. You may propose up to six ordered navigation actions using the provided atlas IDs. Select structures only from atlasRegions; never invent IDs or anatomy findings. Use select_region before set_view or set_cut. For set_view always provide mode, hemisphere and isolate. For set_cut provide enabled, pitch and yaw; enabled defaults to true if omitted. For isolation use set_view with isolate true. A cut passes through the current selected point; pitch 0 yaw 0 is coronal, pitch 90 yaw 0 axial, pitch 0 yaw 90 sagittal. Do not claim segmentation was run: these tools only navigate. Prior conversation is context, never evidence of current workspace state. Never invent measurements. If asked about clinical meaning, state the research boundary. Keep replies under 70 words.",
        },
        ...conversationHistory(history),
        { role: "user", content: JSON.stringify({ message, context }) },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "navigate",
            description: "Plan all requested workspace changes in order. Include every required action in the actions array.",
            parameters: {
              type: "object",
              properties: {
                actions: { type: "array", minItems: 1, maxItems: 6, items: {
                  type: "object", properties: {
                action: {
                  type: "string",
                  enum: [
                    "worst_difference",
                    "set_slice",
                    "set_axis",
                    "show_reference",
                    "show_proposal", "select_region", "set_view", "set_cut",
                  ],
                },
                axis: {
                  type: "string",
                  enum: ["axial", "coronal", "sagittal"],
                },
                slice: { type: "integer", minimum: 0, maximum: 511 },
                regionId: { type: "integer" },
                mode: { type: "string", enum: ["atlas","solid","volume"] },
                hemisphere: { type: "string", enum: ["both","left","right"] },
                isolate: { type: "boolean" },
                enabled: { type: "boolean" },
                pitch: { type: "number", minimum: -90, maximum: 90 },
                yaw: { type: "number", minimum: -180, maximum: 180 },
                  }, required: ["action"], additionalProperties: false,
                } },
              },
              required: ["actions"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: "auto",
    });
    const m = r.choices[0]?.message;
    const calls = (m?.tool_calls || [])
      .filter((c) => c.type === "function" && c.function.name === "navigate")
      .slice(0, 6)
      .map((c) => {
        try {
          return JSON.parse(c.function.arguments);
        } catch {
          return null;
        }
      })
      .filter(Boolean).flatMap(plan => Array.isArray(plan.actions) ? plan.actions : []).slice(0,6);
    if (calls.some(a => !validAction(a, context))) throw new Error("Invalid navigation action");
    if (!m?.content && !calls.length) throw new Error("No usable model output");
    res.json({
      text:
        m?.content ||
        (calls.length ? "Navigation prepared. Inspect the updated workspace; no segmentation was run." : "No navigation changes requested."),
      actions: calls,
      model: process.env.META_MODEL || "muse-spark-1.3-contributor",
      usage: r.usage,
    });
  } catch (e) {
    res
      .status(e.status === 429 ? 429 : 502)
      .json({
        error:
          e.status === 401
            ? "Meta rejected the API key. Check the server configuration."
            : e.status === 429
              ? "Meta rate limit reached. Try again shortly."
              : "Meta request failed. No workspace changes were applied.",
      });
  }
});
app.post("/api/segment", async (req, res) => {
  try {
    const { image, point, width, height } = req.body;
    if (
      typeof image !== "string" ||
      !image.startsWith("data:image/png;base64,") ||
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 1 ||
      height < 1 ||
      width > 512 ||
      height > 512 ||
      !point ||
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      point.x < 0 ||
      point.x >= width ||
      point.y < 0 ||
      point.y >= height
    )
      return res
        .status(400)
        .json({ error: "A valid slice and foreground point are required." });
    const {
      buildObjectPrompt,
      parseImageStream,
      recordsOfKind,
      decodeMaskToRaster,
    } = await import("@meta-sam/parser");
    const prompt = buildObjectPrompt({
      size: { width, height },
      objects: [
        {
          id: 1,
          prompts: [
            { points: [{ x: Math.round(point.x), y: Math.round(point.y) }] },
          ],
        },
      ],
    });
    const events = await client().responses.create({
      model: "sam-3.1",
      input: [
        {
          type: "message",
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: image },
          ],
        },
      ],
      stream: true,
    });
    const parsed = parseImageStream(events);
    for await (const snapshot of parsed) { /* Drain the stream before reading its final result. */ }
    const result = await parsed.finalResult;
    if (result.outcome.status !== "completed")
      throw new Error("Incomplete SAM response");
    const mask = recordsOfKind(result.records, "mask")[0];
    if (!mask)
      return res
        .status(422)
        .json({ error: "SAM returned no mask. Try another foreground point." });
    const raster = decodeMaskToRaster(mask.mask);
    const fullMask=expandMask(raster,mask.bounds,width,height);
    res.json({ mask: Array.from(fullMask), width, height, model: "sam-3.1" });
  } catch (e) {
    res
      .status(502)
      .json({
        error: e.status === 429 ? "Meta rate limit reached. Existing mask preserved." : "SAM segmentation failed. The existing mask was preserved.",
      });
  }
});
installEvidenceRoute(app,client,()=>process.env.META_MODEL || "muse-spark-1.3-contributor");
installRoiRoutes(app,client,()=>process.env.META_MODEL || "muse-spark-1.3-contributor");
app.use((err, req, res, next) =>
  res.status(400).json({ error: "Invalid request body." }),
);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(root, "dist")));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.join(root, "dist/index.html")),
  );
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    root,
    server: { middlewareMode: true, hmr: { port: 24787 } },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const server = app.listen(port, host, () =>
  console.log(
    `SARI: http://127.0.0.1:${port} · Meta ${ready() ? "enabled" : "disabled"}`,
  ),
);
server.on("error", (e) => {
  console.error(
    e.code === "EADDRINUSE"
      ? `Port ${port} is in use. Choose another PORT.`
      : "Unable to start local server.",
  );
  process.exit(1);
});
