// "La ratatouille du chef": timeline, shots, cameras, kicks, depth of field and prop states. Pure functions of the frame.
export const FPS = 30;
/** voice = voice/fish2/voice.wav (Fish « Voix Narrative Française », tagged for intonation, placed by scripts/place_voice.py with ~0.3 s pauses).
 *  Every timing below is still written on the first 48.6 s track; R maps it onto the new voice through word anchors (old time -> new time). */
const ANCH: [number, number][] = [[0.0, 0.0], [0.35, 0.35], [1.61, 1.65], [2.87, 2.57], [3.87, 3.63], [5.03, 4.356], [6.97, 5.736], [7.57, 6.516], [9.8, 8.396], [11.03, 9.756], [12.02, 10.496], [12.66, 11.176], [13.22, 11.956], [13.58, 12.616], [13.98, 13.216], [16.37, 14.016], [16.61, 14.196], [17.39, 14.956], [18.5, 15.856], [19.32, 16.716], [19.62, 16.976], [20.66, 18.447], [21.94, 19.067], [23.02, 20.147], [23.75, 20.897], [24.37, 21.597], [25.3, 22.437], [26.14, 23.297], [26.34, 23.517], [26.7, 23.917], [27.06, 24.297], [28.54, 25.297], [29.77, 26.077], [30.01, 26.517], [30.63, 27.157], [31.55, 27.816], [33.57, 30.056], [36.27, 32.636], [38.74, 33.416], [39.14, 33.836], [40.29, 34.796], [41.11, 35.716], [41.59, 36.256], [41.81, 36.456], [43.52, 37.236], [44.02, 37.616], [45.24, 38.616], [45.7, 39.236], [46.4, 39.936], [46.59, 40.176], [47.9, 41.516]];
export const R = (t: number) => {
  if (t <= ANCH[0][0]) return t;
  for (let i = 1; i < ANCH.length; i++) if (t <= ANCH[i][0]) { const [a0, b0] = ANCH[i - 1], [a1, b1] = ANCH[i]; return b0 + (t - a0) * (b1 - b0) / (a1 - a0); }
  return ANCH[ANCH.length - 1][1];
};
export const TOTAL = Math.round(R(47.9) * 30); // 41.52 s of voice
export type V3 = [number, number, number];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const smoother = (x: number) => { const u = clamp01(x); return u * u * u * (u * (u * 6 - 15) + 10); };
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
/** reactions land 2 frames before their word */
export const LEAD = 2 / FPS;

// ---------------- the set (metres; floor y = 0, island stove centred at x = 0, z = 0, characters face +z) ----------------
export const TOP = 0.95; // island top
export const MARCO: V3 = [0.0, 0, -0.75];
export const CHEF_DOOR: V3 = [-1.1, 0, -2.6];
export const CHEF_ISLAND: V3 = [-0.05, 0, -0.75];
// compact set so every shot fits a 9:16 frame: pans roughly 2 x 2 but set down a bit at random (never touching), board in front, pot on the front-right burner
export const PANS: [number, number][] = [[-0.18, -0.2], [0.16, -0.24], [-0.14, 0.12], [0.18, 0.1]];
export const PAN_YAW = [0.28, -0.22, -0.32, 0.18];
export const POT: V3 = [0.18, TOP, 0.1];
export const BOARD: V3 = [-0.1, TOP, 0.4];
// vegetables spaced so they never touch, even at their 1.25 pop
export const SLOT = [-0.26, -0.09, 0.07, 0.22];
export const CLOCK: V3 = [1.6, 2.3, -3.17];

// ---------------- word times (s) ----------------
const W0 = {
  // timed on the Fish Audio voice (voice/fish/layout.json, Whisper word times)
  guerre: 3.87, mission: 9.8, chef1: 11.03, aub: 12.66, cou: 13.22, poi: 13.58, tom: 13.98, jette: 16.61, casserole: 17.39,
  heureux: 18.5, superbon: 19.32, derriere: 21.94, leChef: 23.02, nicois: 24.37, chaque: 26.14, legume: 26.34, cuit: 26.7, seul: 27.06,
  poele: 28.54, melange: 30.01, joue: 33.57, bruit: 36.27, quatre: 40.29, heures: 41.11, zero: 41.59, goute: 44.02, rien: 45.24, deuxieme: 46.4,
};
export const W = Object.fromEntries(Object.entries(W0).map(([k, v]) => [k, R(v)])) as typeof W0;

// ---------------- shots ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export type Shot = { id: number; a: number; b: number; cam: (t: number) => Cam };
/** slow push-in between two framings over the whole shot (holds always move a little) */
const push = (p0: V3, l0: V3, p1: V3, l1: V3, fov = 38) => (a: number, b: number) => (t: number): Cam => {
  const k = smooth((t - a) / (b - a)) * 0.7 + 0.3 * clamp01((t - a) / (b - a));
  return { pos: lerp3(p0, p1, k), look: lerp3(l0, l1, k), fov, roll: 0 };
};
type Mk = (a: number, b: number) => (t: number) => Cam;
type Def = [number, number, Mk];
const C = (pos: V3, look: V3, fov = 38, roll = 0): Cam => ({ pos, look, fov, roll });
const mix = (A: Cam, B: Cam, k: number): Cam => ({ pos: lerp3(A.pos, B.pos, k), look: lerp3(A.look, B.look, k), fov: A.fov + (B.fov - A.fov) * k, roll: A.roll + (B.roll - A.roll) * k });
const D = Math.PI / 180;
/** camera move A -> B over the whole shot (smoother ease with a little linear drift so it never stops dead) */
const move = (A: Cam, B: Cam): Mk => (a, b) => (t) => { const u = clamp01((t - a) / (b - a)); return mix(A, B, smoother(u) * 0.75 + u * 0.25); };
/** hard cuts inside one shot: [start time (s, new timeline), camera maker] in order */
const cuts = (...parts: [number | null, Mk][]): Mk => (a, b) => {
  const ts = parts.map(([x], i) => (i === 0 ? a : (x as number)));
  const fs = parts.map(([, mk], i) => mk(ts[i], i + 1 < ts.length ? ts[i + 1] : b));
  return (t) => { let i = 0; while (i + 1 < ts.length && t >= ts[i + 1]) i++; return fs[i](t); };
};
/** orbit around a point: angle in degrees from +z (front), height h, radius r */
const orbit = (c: V3, r: number, h: number, ang0: number, ang1: number, lookY: number, fov: number, roll0 = 0, roll1 = roll0): Mk => (a, b) => (t) => {
  const k = smooth((t - a) / (b - a)), g = (ang0 + (ang1 - ang0) * k) * D;
  return C([c[0] + r * Math.sin(g), h, c[2] + r * Math.cos(g)], [c[0], lookY, c[2]], fov, (roll0 + (roll1 - roll0) * k) * D);
};
/** handheld: small smooth wobble (sum of sines, no randomness so renders repeat) */
const hand = (c: Cam, t: number, amp: number): Cam => {
  const n = (f: number, p: number) => Math.sin(t * f + p) * 0.6 + Math.sin(t * f * 2.3 + p * 1.7) * 0.4;
  return { ...c, look: [c.look[0] + amp * n(5.1, 0), c.look[1] + amp * n(4.3, 2), c.look[2]], roll: c.roll + amp * 0.6 * n(3.7, 4) };
};
/** crash zoom: fov snaps from f0 to f1 in `dur` s, starting 2 frames before the word */
const crash = (f0: number, f1: number, at: number, dur = 0.22) => (t: number) => f0 + (f1 - f0) * smooth((t - (at - LEAD)) / dur);

const DEFS: Def[] = [
  // 1 hook, LOW ANGLE from the counter: the board big in the foreground, vegetables fly past the lens into the pot, Marco towers above
  [0, 2.8, move(C([0.80, 0.98, 2.80], [-0.11, 1.30, -0.16], 46, -4 * D), C([0.53, 0.84, 2.50], [-0.08, 1.30, -0.18], 46, 2 * D))],
  // 2 hook, the chef in the doorway: low hero angle, slow push, then a CRASH ZOOM on "guerre"
  [2.8, 4.95, (a, b) => (t) => { const k = smooth((t - a) / (b - a)); return C([-0.63, 1.06 + 0.02 * k, 1.85 - 0.3 * k], [-1.08, 1.68, -2.61], crash(36, 22, W.guerre)(t)); }],
  // 3 establishing: CRANE DOWN from the ceiling corner onto the bistro kitchen
  [4.95, 7.5, move(C([2.6, 3.05, 3.8], [-0.05, 0.98, 0.2], 44), C([2.3, 1.85, 3.5], [-0.05, 1.05, 0.2], 44))],
  // 4 Marco walks in: TRACKING shot alongside him, then settles in front of him for the wave
  [7.5, 12.0, (a, b) => (t) => {
    const u = smooth((t - R(7.6)) / 1.7), x = 2.2 + (MARCO[0] - 2.2) * u, z = -2.0 + (MARCO[2] + 2.0) * u, s = smooth((t - R(9.4)) / 1.2);
    const track = C([x + 1.1, 1.45, z + 2.6], [x, 1.45, z], 40);
    return mix(track, C([0.30, 1.50, 2.25], [0.0, 1.52, -0.75], 40), s);
  }],
  // 5 MACRO insert at board level: a slider glides from vegetable to vegetable, very shallow focus
  [12.0, 16.3, (a, b) => (t) => {
    const on = [W.aub, W.cou, W.poi, W.tom].map((x) => x - 0.25);
    let x = BOARD[0] + SLOT[0];
    for (let k = 1; k < 4; k++) x += (SLOT[k] - SLOT[k - 1]) * smoother((t - on[k]) / 0.5);
    const z = clamp01((t - a) / (b - a));
    return C([x + 0.05, TOP + 0.14, BOARD[2] + 0.42 - 0.04 * z], [x, TOP + 0.05, BOARD[2]], 40, 3 * D);
  }],
  // 6 everything into the casserole: HIGH ANGLE looking down into the pot, Marco above it, slow orbit
  [16.3, 18.45, orbit([-0.07, 0, -0.17], 2.25, 2.95, 34, 14, 1.27, 56)],
  // 7 it smells great: camera behind the steam, focus pulls from the steam onto Marco's face
  [18.45, 20.6, move(C([0.31, 1.40, 1.55], [0.10, 1.53, -0.47], 34), C([0.29, 1.43, 1.30], [0.10, 1.53, -0.47], 34))],
  // 8 Marco happy in front, the chef behind: on "derrière" the focus jumps to the chef and a DOLLY ZOOM (vertigo) makes him loom
  [20.6, 23.7, (a, b) => (t) => {
    const k = smoother((t - (W.derriere - LEAD)) / 1.4), p = smooth((t - a) / (W.derriere - a));
    return mix(C([0.63, 1.46, 1.05 - 0.12 * p], [0.02, 1.54, -0.76], 40), C([0.26, 1.37, 2.01], [-1.07, 1.53, -2.61], 25), k);
  }],
  // 9 "the chef is from Nice": symmetrical frontal close-up, dead centre, snap push on "niçois"
  [23.7, 25.25, (a, b) => (t) => { const k = smooth((t - a) / (b - a)) * 0.3 + 0.7 * smooth((t - (W.nicois - LEAD)) / 0.3); return C([-1.08, 1.64, 0.85 - 0.36 * k], [-1.08, 1.69, -2.6], 30); }],
  // 10 four pans, one vegetable each: HIGH ANGLE over the pans (chef behind), then a CRANE DOWN to his eye level
  [25.25, 29.7, (a, b) => {
    const top = C([0.05, 3.05, 2.6], [0.04, 1.4, -0.35], 54), rev = C([0.05, 2.09, 3.22], [0.05, 1.38, -0.28], 40);
    return (t) => mix(top, rev, smoother((t - (W.seul + 0.1)) / (b - W.seul - 0.1)));
  }],
  // 11 mixed only at the end: LOW ANGLE on the chef lifting the plate
  [29.7, 31.5, move(C([0.32, 1.05, 2.05], [-0.04, 1.58, -0.75], 40, 3 * D), C([0.24, 1.02, 1.75], [-0.04, 1.60, -0.75], 40, 0))],
  // 12 like a band: an ORBIT round the pans (notes one by one), it speeds up and tilts (dutch) on "bruit"
  [31.5, 38.65, (a, b) => {
    const calm = orbit([0.0, 0, -0.05], 2.7, 2.35, -38, 8, TOP + 0.22, 46)(a, W.bruit);
    const wild = orbit([0.0, 0, -0.05], 2.7, 2.2, 8, 52, TOP + 0.25, 48, 0, -9)(W.bruit - LEAD, b);
    return (t) => (t < W.bruit - LEAD ? calm(t) : wild(t));
  }],
  // 13 Marco starts again: HIGH ANGLE, he looks small behind his four pans
  [38.65, 40.9, move(C([0.11, 3.05, 3.25], [0.04, 1.21, -0.29], 40), C([0.12, 2.93, 2.91], [0.04, 1.22, -0.29], 40))],
  // 14 two hours: CRASH ZOOM into the spinning clock
  [40.9, 41.55, (a, b) => (t) => C([1.25, 2.05, -1.55], [CLOCK[0], CLOCK[1], CLOCK[2]], 40 - 18 * smooth((t - a) / 0.3))],
  // 15 zero break: extreme close-up, DUTCH angle, handheld
  [41.55, 43.45, (a, b) => (t) => hand(C([0.23, 1.48, 1.50 - 0.1 * smooth((t - a) / (b - a))], [0.16, 1.54, -0.76], 34, 7 * D), t, 0.012)],
  // 16 the chef tastes (two-shot) / says nothing (side close-up, Marco hidden behind him) / takes a second plate (back wide on both)
  [43.45, 48.6, cuts(
    [null, move(C([0.04, 1.58, 2.95], [0.04, 1.47, -0.75], 38), C([0.04, 1.58, 2.6], [0.04, 1.47, -0.75], 38))],
    [W.rien - LEAD, move(C([-2.1, 1.72, -0.7], [-0.22, 1.78, -0.75], 40), C([-1.9, 1.72, -0.72], [-0.22, 1.78, -0.75], 40))],
    [W.deuxieme - LEAD, move(C([0.04, 1.62, 2.3], [0.04, 1.47, -0.75], 40), C([0.04, 1.66, 2.95], [0.04, 1.47, -0.75], 40))],
  )],
];
export const SHOTS: Shot[] = DEFS.map(([a0, b0, mk], i) => { const a = R(a0), b = i === DEFS.length - 1 ? TOTAL / FPS : R(b0); return { id: i + 1, a, b, cam: mk(a, b) }; });
export const shotAt = (f: number) => {
  const t = f / FPS;
  let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1].a) i++;
  return SHOTS[i];
};

// ---------------- impact kicks: sign flips every frame, decays over 7 frames ----------------
const KICKS: [number, number][] = [[W.guerre, 0.03], [W.casserole, 0.01], [W.nicois, 0.02], [W.joue, 0.015], [W.bruit, 0.03], [W.quatre, 0.01]];
export const kickAt = (f: number) => {
  let off = 0;
  for (const [ts, a] of KICKS) {
    const k = f - Math.round((ts - LEAD) * FPS);
    if (k >= 0 && k < 7) off += (k % 2 ? -1 : 1) * a * (1 - k / 7);
  }
  return off;
};
export const camAt = (f: number): Cam => {
  const s = shotAt(f), c = s.cam(f / FPS), k = kickAt(f);
  return { ...c, pos: [c.pos[0] + k * 0.6, c.pos[1] + k, c.pos[2]], roll: c.roll + k * 0.25 };
};

// ---------------- depth of field (on ~1/3 of shots) ----------------
export type Dof = { cInf: number; focus?: V3 };
const face = (p: V3, h = 1.62): V3 => [p[0], h, p[2]];
export const dofAt = (f: number): Dof => {
  const t = f / FPS, id = shotAt(f).id;
  switch (id) {
    case 2: return { cInf: 12, focus: face(CHEF_DOOR, 1.66) };
    case 5: return { cInf: 16 };
    case 7: { const k = smoother((t - (W.superbon - 0.6)) / 0.6); return { cInf: 13, focus: lerp3([POT[0], TOP + 0.5, POT[2]], face(MARCO), k) }; }
    case 8: { const k = smoother((t - (W.derriere - LEAD)) / 0.5); return { cInf: 12, focus: lerp3(face(MARCO), face(CHEF_DOOR, 1.58), k) }; }
    case 9: return { cInf: 12, focus: face(CHEF_DOOR, 1.66) };
    case 14: return { cInf: 9 };
    case 15: return { cInf: 14 };
    case 16: return t >= W.rien - LEAD && t < W.deuxieme - LEAD ? { cInf: 13, focus: face([-0.22, 0, -0.75], 1.48) } : { cInf: 0 };
    default: return { cInf: 0 };
  }
};

// ---------------- vegetables and pots ----------------
export type VegState = { on: boolean; pos: V3; s: number; spin: number };
const arc = (from: V3, to: V3, u: number, h: number): V3 => {
  const p = lerp3(from, to, u);
  return [p[0], p[1] + 4 * h * u * (1 - u), p[2]];
};
const slotPos = (k: number): V3 => [BOARD[0] + SLOT[k], TOP + 0.03, BOARD[2]];
const potIn: V3 = [POT[0], TOP + 0.2, POT[2]];
/** launch times (s) of the four tosses in the hook and in shot 6 */
const TOSS: Record<number, number[]> = { 1: [0.45, 1.0, 1.55, 2.1], 6: [16.45, 16.6, 16.75, 16.9].map(R) };
export const FLIGHT = 0.5;
export const vegAt = (id: number, t: number, k: number): VegState => {
  const at = slotPos(k);
  if (id === 1 || id === 6) {
    const u = (t - TOSS[id][k]) / FLIGHT;
    if (u < 0) return { on: true, pos: at, s: 1, spin: 0 };
    if (u >= 1) return { on: false, pos: potIn, s: 1, spin: 0 };
    return { on: true, pos: arc(at, potIn, u, 0.45), s: 1, spin: u * 7 };
  }
  if (id === 3 || id === 4) return { on: true, pos: at, s: 1, spin: 0 };
  if (id === 5) {
    const on = [W.aub, W.cou, W.poi, W.tom][k] - LEAD, u = (t - on) / 0.22;
    if (u < 0) return { on: false, pos: at, s: 0, spin: 0 };
    const s = u >= 1 ? 1 + 0.12 * Math.exp(-(u - 1) * 3) * Math.cos((u - 1) * 9) : 1.25 * Math.sin(u * Math.PI * 0.5) ** 0.7;
    return { on: true, pos: [at[0], at[1] + 0.06 * Math.max(0, Math.sin(Math.min(1, u) * Math.PI)), at[2]], s, spin: 0 };
  }
  return { on: false, pos: at, s: 1, spin: 0 };
};
/** landings (s) where a sauce splash fires */
export const splashes = (id: number) => (TOSS[id] ?? []).map((x) => x + FLIGHT);
/** stew inside the pot: 0 empty .. 1 full */
export const potFill = (id: number, t: number) => {
  if (id === 1 || id === 6) return TOSS[id].filter((x) => t >= x + FLIGHT).length / 4;
  return id === 7 || id === 8 ? 1 : 0;
};
export const potShown = (id: number) => id <= 9;
export const pansShown = (id: number) => id >= 10;
/** which pans hold their vegetable */
export const panFill = (id: number, t: number, k: number) => {
  if (id === 10) return t >= [W.chaque, W.legume, W.cuit, W.seul][k] - LEAD;
  return id >= 12;
};
