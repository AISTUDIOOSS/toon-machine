// usage: node scripts/render.mjs <compId> <out.mp4> [from-to] [scale]
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [id, out, range, scale = "1"] = process.argv.slice(2);
const chromiumOptions = { gl: process.env.GL || "angle" };
const inputProps = process.env.PROPS ? JSON.parse(process.env.PROPS) : {};
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const composition = await selectComposition({ serveUrl, id, chromiumOptions, inputProps });
const frameRange = range ? range.split("-").map(Number) : null;
let last = 0;
await renderMedia({ composition, serveUrl, codec: "h264", crf: 16, outputLocation: out, inputProps, chromiumOptions, scale: Number(scale),
  frameRange, concurrency: Number(process.env.CONC || 4), timeoutInMilliseconds: 240000,
  onProgress: ({ progress }) => { const p = Math.floor(progress * 10); if (p > last) { last = p; console.log(`${p * 10}%`); } } });
console.log("done", out);
