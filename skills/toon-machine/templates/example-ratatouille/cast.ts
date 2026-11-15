// Marco and the chef as lit flat sprites in the 3D kitchen (same card system as every short: Pool / Actor / Fx),
// plus the kitchen effects (steam, sauce splashes, sweat, notes, bursts, stars).
import * as THREE from "three";
import { Pen, bodyFront, fxNote, fxBurst, fxStars, fxContact, Outfit, Expr, FrontOpts, Prop } from "./toon";
import {
  FPS, LEAD, V3, W, MARCO, CHEF_DOOR, CHEF_ISLAND, PANS, POT, TOP, clamp01, smooth, splashes,
  R,
} from "./story";
import { NOINK } from "../look/ink";
import { cardShade, blobMaterial, CARD_K } from "../look/cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m (soles at y = 975)
// the sheet goes PAD units above the 600 x 1000 design space, so the chef's tall toque is never sliced flat (a review found it cut in test 4)
export const PAD = 150;
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, (1000 + PAD) * SU); g.translate(0, (975 - (1000 - PAD) / 2) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);

export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(BODY, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false;
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    } else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = this.mesh.material === this.soft ? 2 : 0; }
  }
}

// ---------------- placements ----------------
export type Place = { key: string; draw: (p: Pen) => void; x: number; y: number; z: number; scale?: number; mirror?: boolean; yaw?: number; roll?: number; size?: [number, number, number] };
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3 };
export type Stage = { places: Place[]; fx: FxPlace[] };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3450, 3.0] : d < 6.5 ? [1080, 2070, 1.8] : d < 16 ? [480, 920, 0.8] : [240, 460, 0.4];

/** world direction TOWARD the key light (the kitchen window side, up front-left) */
export const SUN = new THREE.Vector3(-0.55, 0.85, 0.75).normalize();
const tmp = new THREE.Vector3();
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

// ---------------- life: blinks ----------------
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13));
  }
  return 0;
};

// ---------------- the cast ----------------
export const MARCO_O: Outfit = { jacket: "#f2efe8", pants: "#34405c", boots: "#22202a", hat: "toque", buttons: "#2a2a2a", belt: null, build: "adult" };
export const CHEF_O: Outfit = { jacket: "#fbfaf6", pants: "#2a2d3a", boots: "#22202a", hat: "toque_tall", buttons: "#e8c45a", sash: "#c0353a", moustache: "#3a2a20", belt: null, build: "stout" };
type Who = { i: number; o: Outfit; okey: string };
const MARCO_W: Who = { i: 1, o: MARCO_O, okey: "marco" };
const CHEF_W: Who = { i: 2, o: CHEF_O, okey: "chef" };

const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, fo: FrontOpts, mirror = false): Place => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.4, z));
  const [w, h, k] = tier(d);
  const light = light2D(cam, mirror), seed = who.i * 3 + 1;
  const f2: FrontOpts = { ...fo, light, seed };
  return { key: `F|${who.okey}|${fkey(f2)}`, x, y, z, mirror, draw: (p) => { p.g.translate(0, PAD); bodyFront(p, who.o, f2); }, size: [w, h, k] };
};
const CONTACT = "#9b93b0";
const blob = (out: Stage, x: number, z: number, sc = 1) =>
  out.fx.push({ key: "blob|contact", cw: 128, ch: 128, draw: (p) => fxContact(p, CONTACT), x, y: 0.012, z, w: 0.62 * sc, h: 0.48 * sc, flat: true });

// ---------------- kitchen effects ----------------
/** soft steam puff on a 256 x 256 canvas (alpha already in the drawing) */
const fxSteam = (p: Pen, a: number) => {
  const g = p.g;
  for (const [x, y, r] of [[128, 150, 70], [92, 120, 52], [164, 112, 56], [128, 86, 50]] as const) {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(255,255,255,${(0.75 * a).toFixed(3)})`); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
};
/** tomato-sauce splash crown on an 800 x 800 canvas; t in 0..1 */
const fxSauce = (p: Pen, t: number) => {
  const c = 400, size = 800, rise = Math.sin(Math.min(1, t * 1.3) * Math.PI);
  const red = "#f0662f", deep = "#c23f1f"; // more orange than the red pot so the splash reads
  if (rise > 0.02) {
    const pts: [number, number][] = [];
    for (let i = 0; i < 15; i++) {
      const h = (i % 2 ? 240 : 110) * rise * (0.7 + 0.3 * Math.sin(i * 1.7));
      pts.push([c - 260 + (520 * i) / 14, size - 120 - h]);
    }
    p.poly([...pts, [c + 260, size - 90], [c - 260, size - 90]], red, 10);
    p.ell(c, size - 100, 280, 40, deep, 10);
  }
  for (let i = 0; i < 7; i++) {
    const a = ((200 + i * 22) * Math.PI) / 180, d = 60 + 160 * t, y = size - 160 + d * Math.sin(a) + 420 * t * t, r = 24 * (1 - t) + 6;
    if (t > 0.08 && y < size - 110) p.ell(c + d * Math.cos(a), y, r, r * 1.2, red, 7);
  }
};
/** two sweat drops on a 200 x 200 canvas */
const fxSweat = (p: Pen, side: number) => {
  for (const [x, y, s] of [[70, 90, 1], [140, 120, 0.75]] as const) {
    const X = side > 0 ? x : 200 - x;
    p.poly([[X, y - 52 * s], [X + 22 * s, y], [X, y + 22 * s], [X - 22 * s, y]], "#9fd6ff", 6);
    p.ell(X - 6 * s, y - 2 * s, 6 * s, 9 * s, "#ffffff", 0);
  }
};

const burst = (out: Stage, t: number, at: number, x: number, y: number, z: number, w: number, dur = 0.4) => {
  const u = (t - (at - LEAD)) / dur;
  if (u >= 0 && u < 1) out.fx.push({ key: `burst${q(u, 30)}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, q(u, 30)), x, y, z, w, h: w });
};
const steam = (out: Stage, t: number, x: number, y: number, z: number, n = 4, sz = 0.32, k = 1) => {
  for (let i = 0; i < n; i++) {
    const u = ((t * 0.55 + i / n + hh(i, 4) * 0.2) % 1);
    const a = q(Math.sin(u * Math.PI) * k, 20);
    if (a < 0.05) continue;
    out.fx.push({ key: `steam${a}`, cw: 256, ch: 256, draw: (p) => fxSteam(p, a), x: x + 0.06 * Math.sin(u * 5 + i * 2), y: y + 0.05 + u * 0.55, z: z + 0.02 * i,
      w: sz * (0.6 + u * 0.8), h: sz * (0.6 + u * 0.8), soft: true });
  }
};

// ---------------- who does what, shot by shot ----------------
const waveAt = (t: number, a: number, b: number) => (t >= a && t < b ? q(Math.sin((t - a) * 14), 20) : undefined);
const marcoArrive = (t: number): [number, number, boolean] => {
  const u = smooth((t - R(7.6)) / 1.7);
  return [2.2 + (MARCO[0] - 2.2) * u, -2.0 + (MARCO[2] + 2.0) * u, u > 0 && u < 1];
};

export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const L = LEAD;
  const marco = (x: number, z: number, fo: FrontOpts, swaps: number[] = []) => {
    out.places.push(person(cam, MARCO_W, x, 0, z, { mode: "stand", blink: fo.expr === "smile_closed" ? 0 : lidAt(t, 1, swaps), ...fo }));
    blob(out, x, z);
  };
  const chef = (x: number, z: number, fo: FrontOpts, swaps: number[] = []) => {
    out.places.push(person(cam, CHEF_W, x, 0, z, { mode: "stand", blink: fo.expr === "smile_closed" ? 0 : lidAt(t, 2, swaps), ...fo }));
    blob(out, x, z, 1.1);
  };
  switch (id) {
    case 1: marco(MARCO[0], MARCO[2], { expr: t < 1.4 ? "grin" : "laugh", prop: "spoon" }); break;
    case 2: chef(CHEF_DOOR[0], CHEF_DOOR[2], { expr: t < W.guerre - L ? "stern" : "shock", headTilt: t < W.guerre - L ? 0 : -4 }, [W.guerre]); break;
    case 3: break; // empty kitchen
    case 4: {
      const [x, z, walking] = marcoArrive(t);
      const fo: FrontOpts = walking ? { mode: "stroll", phase: q(((t - R(7.6)) * 1.6) % 1, 60), expr: "smile" }
        : { expr: t < W.mission - L ? "smile" : t < W.chef1 - L ? "grin" : "smile", wave: waveAt(t, W.mission - L, W.mission + 0.9) };
      marco(x, z, fo, [W.mission]);
      break;
    }
    case 5: break; // the vegetables (world.ts)
    case 6: marco(MARCO[0], MARCO[2], { expr: "laugh", prop: "spoon" }); break;
    case 7: {
      marco(MARCO[0], MARCO[2], { expr: t < W.superbon - L ? "smile_closed" : "grin", headTilt: t < W.superbon - L ? 6 : 0 }, [W.superbon]);
      steam(out, t, POT[0], TOP + 0.2, POT[2], 5, 0.36, 1);
      break;
    }
    case 8: {
      marco(MARCO[0], MARCO[2], { expr: t < W.leChef - L ? "grin" : "nervous", look: t < W.leChef - L ? 0 : -1 }, [W.leChef]);
      chef(CHEF_DOOR[0], CHEF_DOOR[2], { expr: "stern", prop: "arms" });
      steam(out, t, POT[0], TOP + 0.2, POT[2], 3, 0.3, 0.7);
      break;
    }
    case 9: chef(CHEF_DOOR[0], CHEF_DOOR[2], { expr: t < W.nicois - L ? "stern" : "grin", headTilt: t < W.nicois - L ? 0 : 5 }, [W.nicois]); break;
    case 10: chef(CHEF_ISLAND[0], CHEF_ISLAND[2], { expr: "stern", prop: "spoon" });
      PANS.forEach(([x, z], k) => { if (t >= [W.chaque, W.legume, W.cuit, W.seul][k] - L) steam(out, t + k * 0.3, x, TOP + 0.08, z, 2, 0.2, 0.7); });
      break;
    case 11: chef(CHEF_ISLAND[0], CHEF_ISLAND[2], { expr: t < W.melange - L ? "stern" : "smile_closed", prop: t < W.melange - L ? "spoon" : "plate" }, [W.melange]); break;
    case 12: {
      // notes: one pan at a time, then all at once on "joue", chaos on "bruit"
      const solo = Math.floor((t - R(31.6)) / 0.75) % 4;
      const all = t >= W.joue - L;
      PANS.forEach(([x, z], k) => {
        if (!all && k !== solo) return;
        const n = all ? 3 : 2;
        for (let j = 0; j < n; j++) {
          const age = ((t * (all ? 1.4 : 0.9) + j / n + k * 0.23) % 1);
          const pop = Math.min(1, age * 6) * (age > 0.8 ? (1 - age) / 0.2 : 1);
          const kind = (j + k) % 2, sw = all ? 0.08 * Math.sin(t * 23 + k) : 0;
          out.fx.push({ key: `note${kind}${all ? "r" : ""}`, cw: 220, ch: 260, draw: (p) => fxNote(p, kind, all ? "#b52a1e" : "#1f2a44"),
            x: x + sw + 0.05 * Math.sin(age * 7 + j), y: TOP + 0.12 + 0.5 * age, z: z + 0.05, w: 0.12 * pop, h: 0.165 * pop, rot: 0.3 * Math.sin(age * 6 + j) + sw * 3 });
        }
      });
      if (t >= W.bruit - L) {
        const u = q((t * 0.9) % 1, 30);
        out.fx.push({ key: `stars${u}`, cw: 420, ch: 210, draw: (p) => fxStars(p, u), x: 0, y: 1.42, z: -0.05, w: 0.6, h: 0.3 });
      }
      break;
    }
    case 13: marco(MARCO[0], MARCO[2], { expr: "stern", prop: "spoon" }, [W.quatre]);
      PANS.forEach(([x, z], k) => steam(out, t + k * 0.4, x, TOP + 0.08, z, 2, 0.2, 0.7)); break;
    case 14: break; // the clock
    case 15: {
      marco(MARCO[0], MARCO[2], { expr: "nervous", prop: "spoon", headTilt: 3 * Math.sin(t * 9) });
      const dy = ((t * 1.3) % 1) * 0.12;
      out.fx.push({ key: "sweat", cw: 200, ch: 200, draw: (p) => fxSweat(p, 1), x: MARCO[0] + 0.24, y: 1.92 - dy, z: MARCO[2] + 0.08, w: 0.2, h: 0.2 });
      break;
    }
    case 16: {
      const pre = t < W.goute - L, plate = t >= W.deuxieme - L;
      chef(-0.22, CHEF_ISLAND[2], {
        expr: pre ? "stern" : plate ? "smile_closed" : t < W.rien - L ? "smile_closed" : "neutral",
        prop: plate ? "plate" : "spoon", headTilt: !pre && t < W.rien - L ? 6 : 0,
      }, [W.goute, W.rien, W.deuxieme]);
      marco(0.3, MARCO[2], { expr: plate ? "relief_open" : "nervous", look: plate ? 0 : -1 }, [W.deuxieme]);
      break;
    }
  }
  // sauce splashes on every landing in the pot (hook + shot 6)
  for (const at of splashes(id)) {
    const u = (t - at) / 0.5;
    if (u >= 0 && u < 1) out.fx.push({ key: `sauce${q(u, 30)}`, cw: 800, ch: 800, draw: (p) => fxSauce(p, q(u, 30)), x: POT[0], y: TOP + 0.2 + 0.125, z: POT[2], w: 0.32, h: 0.32 });
  }
  if (id === 6 && t > 17.2) steam(out, t, POT[0], TOP + 0.2, POT[2], 3, 0.3, clamp01((t - 17.2) / 0.6));
  return out;
};
export type { Expr, Prop, V3 };
