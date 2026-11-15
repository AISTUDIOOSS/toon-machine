// Checks every shot of a vertical short through its own camera, before any render.
// usage: node scripts/framing.mjs src/videos/<name>/framing.ts            -> lists every point outside the safe zone
//        node scripts/framing.mjs src/videos/<name>/framing.ts --fit 4,8:start [fill]  -> proposes a camera for those shots
// framing.ts exports SHOTS ([{id, a, b, cam(t) => {pos, look, fov}}], a/b in seconds) and FRAMING (see the example).
// Safe zone of a 9:16 frame: x 0.10-0.85 (right-side buttons), y 0.13-0.78 (top margin so hats breathe, bottom ~22 %
// covered by the caption and buttons). The group of points must also be centred (|centre x - 0.475| <= 0.08).
import { build } from "esbuild";
import path from "node:path";
import fs from "node:fs";
const [file, mode, list, fillArg] = process.argv.slice(2);
if (!file) { console.log("usage: node scripts/framing.mjs <framing.ts> [--fit ids] [fill]"); process.exit(1); }
fs.mkdirSync(".tmp", { recursive: true });
const out = path.resolve(".tmp/framing.mjs");
await build({ entryPoints: [file], bundle: true, format: "esm", outfile: out, logLevel: "error", external: ["three", "react", "remotion"] });
const { SHOTS, FRAMING, SAFE: S0 } = await import(out + "?" + Date.now());
const SAFE = S0 ?? { x0: 0.1, x1: 0.85, y0: 0.13, y1: 0.78 }, CX = (SAFE.x0 + SAFE.x1) / 2, ASPECT = 9 / 16;
const pick = (imp, when) => (Array.isArray(imp) ? imp : (imp?.[when] ?? []));
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
const proj = (c, p) => {
  const f = norm(sub(c.look, c.pos)), r0 = norm(cross(f, [0, 1, 0])), u0 = cross(r0, f), v = sub(p, c.pos), d = dot(f, v);
  // camera roll (three.js cam.rotateZ(roll)): the screen axes turn with it
  const cr = Math.cos(c.roll ?? 0), sr = Math.sin(c.roll ?? 0);
  const r = r0.map((x, i) => x * cr + u0[i] * sr), u = u0.map((x, i) => x * cr - r0[i] * sr);
  const th = Math.tan((c.fov * Math.PI) / 360);
  return [0.5 + dot(r, v) / d / (2 * th * ASPECT), 0.5 - dot(u, v) / d / (2 * th), d];
};
if (mode === "--fit") {
  // keeps the camera direction and fov, solves aim point + distance so the points fill the safe zone
  const fill = Number(fillArg || 0.9);
  for (const tok of list.split(",")) {
    const [ids, which = "end"] = tok.split(":"), id = Number(ids), s = SHOTS.find((x) => x.id === id);
    const pts = pick(FRAMING[id], which).map((q) => q[1]);
    if (!pts.length) { console.log(`${id}: no points for "${which}"`); continue; }
    const c = s.cam(which === "start" ? s.a : s.b), f = norm(sub(c.look, c.pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
    const th = Math.tan((c.fov * Math.PI) / 360);
    let C = pts.reduce((a, p) => a.map((v, i) => v + p[i] / pts.length), [0, 0, 0]), d = Math.hypot(...sub(c.look, c.pos));
    for (let it = 0; it < 60; it++) {
      const P = pts.map((p) => proj({ pos: C.map((v, i) => v - f[i] * d), look: C, fov: c.fov }, p)), xs = P.map((q) => q[0]), ys = P.map((q) => q[1]);
      const mx = (Math.min(...xs) + Math.max(...xs)) / 2, my = (Math.min(...ys) + Math.max(...ys)) / 2;
      const sc = Math.max((Math.max(...xs) - Math.min(...xs)) / ((SAFE.x1 - SAFE.x0) * fill), (Math.max(...ys) - Math.min(...ys)) / ((SAFE.y1 - SAFE.y0) * fill));
      C = C.map((v, i) => v + r[i] * (mx - CX) * 2 * th * ASPECT * d - u[i] * (my - (SAFE.y0 + SAFE.y1) / 2) * 2 * th * d);
      d *= 0.5 + 0.5 * sc;
    }
    const r3 = (a) => "[" + a.map((v) => v.toFixed(2)).join(", ") + "]";
    console.log(`${id} ${which}: pos ${r3(C.map((v, i) => v - f[i] * d))}  look ${r3(C)}  fov ${c.fov}  (distance ${d.toFixed(2)} m; start a push ~12 % farther back)`);
  }
  process.exit(0);
}
let bad = 0;
for (const s of SHOTS) {
  const imp = FRAMING[s.id];
  if (imp === undefined) { console.log(`  ? shot ${s.id}: nothing listed in FRAMING`); continue; }
  for (const [when, t] of [["start", s.a + 0.01], ["mid", (s.a + s.b) / 2], ["end", s.b - 0.01]]) {
    const pts = pick(imp, when), c = s.cam(t), xs = [];
    for (const [n, p] of pts) {
      const [x, y, d] = proj(c, p); xs.push(x);
      if (d <= 0 || x < SAFE.x0 || x > SAFE.x1 || y < SAFE.y0 || y > SAFE.y1) { bad++; console.log(`  ✗ shot ${s.id} ${when}: ${n} outside the safe zone (x ${x.toFixed(2)}, y ${y.toFixed(2)})`); }
    }
    if (xs.length > 1) { const m = (Math.min(...xs) + Math.max(...xs)) / 2; if (Math.abs(m - CX) > 0.08) { bad++; console.log(`  ✗ shot ${s.id} ${when}: group off-centre (centre x ${m.toFixed(2)})`); } }
  }
}
console.log(bad ? `${bad} problem(s)` : "all shots OK");
process.exit(bad ? 1 : 0);
