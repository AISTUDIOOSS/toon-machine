// The bistro kitchen: a 3D toon set (two-tone lit, ink lines) posed every frame from story.ts, with the flat cast on top.
import * as THREE from "three";
import { FPS, TOTAL, R, V3, TOP, POT, PANS, PAN_YAW, BOARD, CLOCK, camAt, shotAt, vegAt, potFill, potShown, pansShown, panFill } from "./story";
import { Pool, Actor, Fx, stage, SUN } from "./cast";
import { NOINK } from "../look/ink";
import { TONE, CHAR, twoTone } from "../look/shade";
import { LIGHTS, LOOK, LightPreset } from "../look/lights";
import { ctex, rep } from "../look/paint";

export const KITCHEN_FRAMES = TOTAL;
const L: LightPreset = {
  ...LIGHTS.day,
  lit: [1.5, 1.4, 1.2], shade: [0.46, 0.41, 0.46], lift: [0.07, 0.06, 0.08],
  charTint: [1.0, 0.95, 0.9], sunCol: "#fff0d8", sunI: 2.6, sky: "#fff4e4", ground: "#b48a6a", hemiI: 0.6,
};

const lam = (color: THREE.ColorRepresentation, extra: THREE.MeshLambertMaterialParameters = {}) => twoTone(new THREE.MeshLambertMaterial({ color, ...extra }));
const map = (t: THREE.Texture, extra: THREE.MeshLambertMaterialParameters = {}) => twoTone(new THREE.MeshLambertMaterial({ map: t, ...extra }));
const phong = (color: string, spec = "#ffffff", sh = 50) => twoTone(new THREE.MeshPhongMaterial({ color, specular: spec, shininess: sh }), 0.3);

// ---------------- painted textures ----------------
const checker = () => ctex("rt_checker", 512, 512, (g) => {
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
    g.fillStyle = (i + j) % 2 ? "#2c2a36" : "#efe6d4"; g.fillRect(i * 64, j * 64, 64, 64);
  }
  g.strokeStyle = "rgba(40,30,40,0.35)"; g.lineWidth = 2;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, 512); g.stroke(); g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); }
});
/** wall: cream metro tiles above 1.05 m, bordeaux wainscot below; texture spans 1 m wide x 3.2 m tall */
const wall = () => ctex("rt_wall", 256, 820, (g, r) => {
  const mPx = 820 / 3.2, low = 820 - 1.05 * mPx;
  g.fillStyle = "#e9dcc2"; g.fillRect(0, 0, 256, low);
  const th = 0.15 * mPx / 2, tw = 0.3 * mPx / 2;
  for (let y = 0, row = 0; y < low; y += th, row++) for (let x = row % 2 ? -tw / 2 : 0; x < 256; x += tw) {
    g.fillStyle = r() < 0.5 ? "#efe3cb" : "#e4d6bb"; g.fillRect(x + 1.5, y + 1.5, tw - 3, th - 3);
  }
  g.fillStyle = "#8e2633"; g.fillRect(0, low, 256, 820 - low);
  g.fillStyle = "#7a1f2b"; for (let x = 0; x < 256; x += 64) g.fillRect(x, low + 20, 4, 820 - low - 20);
  g.fillStyle = "#c9a35a"; g.fillRect(0, low - 6, 256, 12);
});
const wood = () => ctex("rt_wood", 256, 256, (g, r) => {
  g.fillStyle = "#b07a4a"; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(90,50,30,0.35)"; g.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const y = r() * 256; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + 6, 170, y - 6, 256, y + 3); g.stroke(); }
});
const islandFront = () => ctex("rt_island", 512, 200, (g) => {
  g.fillStyle = "#b8323b"; g.fillRect(0, 0, 512, 200);
  g.strokeStyle = "#7e1f28"; g.lineWidth = 5;
  for (let i = 0; i < 4; i++) { g.strokeRect(12 + i * 125, 18, 113, 164); }
  g.fillStyle = "#e8c45a"; for (let i = 0; i < 4; i++) g.fillRect(52 + i * 125, 40, 34, 7);
});
const rooftops = () => ctex("rt_view", 512, 384, (g) => {
  const sky = g.createLinearGradient(0, 0, 0, 384); sky.addColorStop(0, "#8ec3ee"); sky.addColorStop(1, "#d8ecf7");
  g.fillStyle = sky; g.fillRect(0, 0, 512, 384);
  g.fillStyle = "#fff8ec"; g.beginPath(); g.arc(120, 90, 34, 0, 7); g.arc(160, 80, 40, 0, 7); g.arc(200, 96, 30, 0, 7); g.fill();
  const roofs: [number, number, number, string, string][] = [[-20, 230, 170, "#f2c79a", "#c8553d"], [140, 200, 150, "#f6dfb5", "#b84a3a"], [280, 245, 140, "#efd2a8", "#d0623f"], [400, 210, 150, "#f4e3c2", "#b8553f"]];
  for (const [x, y, w, wallC, roofC] of roofs) {
    g.fillStyle = wallC; g.fillRect(x, y, w, 384 - y);
    g.fillStyle = roofC; g.beginPath(); g.moveTo(x - 10, y); g.lineTo(x + w / 2, y - 55); g.lineTo(x + w + 10, y); g.fill();
    g.fillStyle = "#4f7ca8"; for (let k = 0; k < 2; k++) g.fillRect(x + 25 + k * 60, y + 30, 30, 42);
    g.fillStyle = "#3f7a4a"; for (let k = 0; k < 2; k++) { g.fillRect(x + 18 + k * 60, y + 30, 7, 42); g.fillRect(x + 55 + k * 60, y + 30, 7, 42); }
  }
});
const clockFace = () => ctex("rt_clock", 256, 256, (g) => {
  g.fillStyle = "#fbf5e6"; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill();
  g.fillStyle = "#2a2230";
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.beginPath(); g.arc(128 + 100 * Math.sin(a), 128 - 100 * Math.cos(a), i % 3 ? 5 : 9, 0, 7); g.fill(); }
});

// ---------------- the world ----------------
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
export class World {
  root = new THREE.Group();
  private pool = new Pool();
  private actors: Actor[] = [];
  private fxs: Fx[] = [];
  private sun = new THREE.DirectionalLight("#ffffff", 2.6);
  private hemi = new THREE.HemisphereLight("#ffffff", "#886655", 0.6);
  private pot = new THREE.Group();
  private stew: THREE.Mesh;
  private pans: THREE.Group[] = [];
  private panFood: THREE.Mesh[] = [];
  private veg: THREE.Group[] = [];
  private board!: THREE.Object3D;
  private hourHand: THREE.Mesh;
  private minHand: THREE.Mesh;

  private add(geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], x: number, y: number, z: number, o: { cast?: boolean; parent?: THREE.Object3D; ry?: number; rx?: number } = {}) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.rotation.set(o.rx ?? 0, o.ry ?? 0, 0);
    m.castShadow = o.cast ?? true; m.receiveShadow = true;
    (o.parent ?? this.root).add(m);
    return m;
  }

  constructor() {
    const R = this.root;
    this.sun.castShadow = true; this.sun.shadow.mapSize.set(4096, 4096);
    R.add(this.sun, this.sun.target, this.hemi);
    // ---- room shell (receives shadows, never casts: the key light comes "through" the ceiling) ----
    const shell = { cast: false };
    this.add(new THREE.PlaneGeometry(8, 7.2), map(rep(checker(), 8 / 2.4, 7.2 / 2.4)), 0, 0, 0.4, { ...shell, rx: -Math.PI / 2 });
    this.add(new THREE.PlaneGeometry(8, 3.2), map(rep(wall(), 8, 1)), 0, 1.6, -3.2, shell);
    this.add(new THREE.PlaneGeometry(7.2, 3.2), map(rep(wall(), 7.2, 1)), -4, 1.6, 0.4, { ...shell, ry: Math.PI / 2 });
    this.add(new THREE.PlaneGeometry(7.2, 3.2), map(rep(wall(), 7.2, 1)), 4, 1.6, 0.4, { ...shell, ry: -Math.PI / 2 });
    this.add(new THREE.PlaneGeometry(8, 7.2), lam("#f3ead8"), 0, 3.2, 0.4, { ...shell, rx: Math.PI / 2 });
    // ---- door (chef's entrance) ----
    const dx = -1.1, frame = lam("#5a3626");
    this.add(new THREE.PlaneGeometry(0.95, 2.1), lam("#3b2a2e"), dx, 1.05, -3.19, shell);
    this.add(box(0.1, 2.2, 0.12), frame, dx - 0.525, 1.1, -3.16, shell);
    this.add(box(0.1, 2.2, 0.12), frame, dx + 0.525, 1.1, -3.16, shell);
    this.add(box(1.15, 0.1, 0.12), frame, dx, 2.2, -3.16, shell);
    // ---- window with painted rooftops ----
    const wx = 0.35;
    const view = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.86), new THREE.MeshBasicMaterial({ map: rooftops(), color: new THREE.Color(1.05, 1.05, 1.05) }));
    view.position.set(wx, 1.68, -3.19); view.layers.set(NOINK); R.add(view);
    const wf = lam("#f4efe2");
    this.add(box(1.27, 0.07, 0.1), wf, wx, 2.13, -3.15, shell);
    this.add(box(1.35, 0.08, 0.22), wf, wx, 1.22, -3.1, shell);
    this.add(box(0.07, 0.94, 0.1), wf, wx - 0.6, 1.68, -3.15, shell);
    this.add(box(0.07, 0.94, 0.1), wf, wx + 0.6, 1.68, -3.15, shell);
    this.add(box(0.05, 0.86, 0.06), wf, wx, 1.68, -3.16, shell);
    this.add(box(1.15, 0.05, 0.06), wf, wx, 1.68, -3.16, shell);
    // ---- back counter, shelf with jars, copper pans on a rail, clock ----
    const counterTop = phong("#b9bcc4", "#ffffff", 70);
    this.add(box(3.4, 0.86, 0.6), lam("#2f5d50"), 2.2, 0.43, -2.9);
    this.add(box(3.5, 0.05, 0.66), counterTop, 2.2, 0.885, -2.88);
    this.add(box(1.5, 0.04, 0.26), map(rep(wood(), 2, 0.4)), 1.85, 1.55, -3.07);
    const jarCols = ["#e8c45a", "#d9643a", "#7da454", "#c9b48a", "#b8323b"];
    for (let i = 0; i < 5; i++) {
      const h = 0.14 + 0.05 * ((i * 7) % 3);
      this.add(new THREE.CylinderGeometry(0.055, 0.055, h, 16), lam(jarCols[i]), 1.25 + i * 0.3, 1.57 + h / 2, -3.06);
      this.add(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), lam("#f4efe2"), 1.25 + i * 0.3, 1.57 + h + 0.015, -3.06);
    }
    const copper = phong("#c8743f", "#ffd2a0", 60);
    this.add(new THREE.CylinderGeometry(0.012, 0.012, 1.6, 8), lam("#3a3440"), -2.7, 2.3, -3.12, { cast: false, rx: 0 }).rotation.z = Math.PI / 2;
    for (let i = 0; i < 4; i++) {
      const r = 0.12 + 0.03 * (i % 2), x = -3.3 + i * 0.4, y = 2.2 - r;
      const pan = this.add(new THREE.CylinderGeometry(r, r, 0.05, 24), copper, x, y, -3.12, { rx: Math.PI / 2, cast: false });
      pan.receiveShadow = true;
      this.add(box(0.03, 0.14, 0.02), copper, x, y + r + 0.05, -3.12, { cast: false });
    }
    this.add(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 40), lam("#2a2230"), CLOCK[0], CLOCK[1], -3.18, { rx: Math.PI / 2, cast: false });
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.21, 40), map(clockFace()));
    face.position.set(CLOCK[0], CLOCK[1], -3.15); R.add(face);
    const handG = (len: number, w: number) => { const g = box(w, len, 0.01); g.translate(0, len / 2 - 0.02, 0); return g; };
    this.hourHand = this.add(handG(0.12, 0.022), lam("#2a2230"), CLOCK[0], CLOCK[1], -3.14, { cast: false });
    this.minHand = this.add(handG(0.18, 0.014), lam("#c0353a"), CLOCK[0], CLOCK[1], -3.135, { cast: false });
    // ---- the island stove ----
    const front = map(islandFront());
    const islandMats = [lam("#b8323b"), lam("#b8323b"), lam("#b8323b"), lam("#b8323b"), front, lam("#b8323b")];
    this.add(box(2.4, 0.9, 0.95), islandMats, 0, 0.45, 0);
    this.add(box(2.5, 0.05, 1.05), phong("#c3c6cd", "#ffffff", 80), 0, 0.925, 0);
    this.add(box(2.5, 0.06, 0.06), lam("#2a2230"), 0, 0.12, 0.505, { cast: false });
    for (const [x, z] of PANS) this.add(new THREE.TorusGeometry(0.11, 0.012, 8, 32), lam("#2a2230"), x, TOP + 0.006, z, { rx: Math.PI / 2, cast: false });
    // cutting board
    this.board = this.add(box(0.7, 0.03, 0.22), map(rep(wood(), 1, 0.5)), BOARD[0], TOP + 0.015, BOARD[2]);
    // ---- the casserole (red enamel) + stew ----
    const potM = phong("#d23a33", "#ffffff", 70);
    const prof: THREE.Vector2[] = [new THREE.Vector2(0, 0), new THREE.Vector2(0.16, 0), new THREE.Vector2(0.17, 0.02), new THREE.Vector2(0.17, 0.2), new THREE.Vector2(0.18, 0.205), new THREE.Vector2(0.16, 0.2), new THREE.Vector2(0.16, 0.02)];
    const potMesh = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), potM);
    potMesh.castShadow = true; potMesh.receiveShadow = true;
    (potM as THREE.Material).side = THREE.DoubleSide;
    this.pot.add(potMesh);
    for (const s of [-1, 1]) this.add(box(0.07, 0.025, 0.05), lam("#2a2230"), s * 0.2, 0.17, 0, { parent: this.pot });
    this.stew = this.add(new THREE.CircleGeometry(0.158, 32), lam("#d8502c"), 0, 0.03, 0, { parent: this.pot, rx: -Math.PI / 2, cast: false });
    this.pot.position.set(POT[0], TOP, POT[2]);
    R.add(this.pot);
    // ---- four pans, one vegetable each ----
    const panM = phong("#3b3d46", "#bbbbbb", 40);
    const vegCol = ["#6b3c8c", "#5f9a3a", "#d9372c", "#e5462f"];
    PANS.forEach(([x, z], k) => {
      const g = new THREE.Group();
      const pp: THREE.Vector2[] = [new THREE.Vector2(0, 0), new THREE.Vector2(0.13, 0), new THREE.Vector2(0.15, 0.05), new THREE.Vector2(0.14, 0.05), new THREE.Vector2(0.12, 0.01)];
      const pm = new THREE.Mesh(new THREE.LatheGeometry(pp, 32), panM); pm.castShadow = pm.receiveShadow = true; g.add(pm);
      (panM as THREE.Material).side = THREE.DoubleSide;
      this.add(box(0.03, 0.02, 0.2), lam("#2a2230"), 0, 0.04, 0.24, { parent: g });
      const food = this.add(new THREE.CircleGeometry(0.115, 24), lam(vegCol[k]), 0, 0.025, 0, { parent: g, rx: -Math.PI / 2, cast: false });
      // little cubes on top so it reads as diced vegetables
      for (let i = 0; i < 7; i++) {
        const a = i * 2.4, rr = 0.03 + 0.05 * ((i * 37) % 10) / 10;
        this.add(box(0.03, 0.025, 0.03), lam(vegCol[k]), rr * Math.cos(a), 0.012, rr * Math.sin(a), { parent: food, cast: false }).rotation.set(Math.PI / 2, 0, a);
      }
      g.position.set(x, TOP + 0.01, z);
      g.rotation.y = (z < 0 ? Math.PI : 0) + PAN_YAW[k]; // handles along z (back row backwards, front row forwards) so they never widen the group
      R.add(g); this.pans.push(g); this.panFood.push(food);
    });
    // ---- the four vegetables (aubergine, courgette, poivron, tomate) ----
    const stem = lam("#3f7a2e");
    const mk = (k: number) => {
      const g = new THREE.Group();
      if (k === 0) { const m = this.add(new THREE.SphereGeometry(0.05, 20, 14), lam("#5b2f7d"), 0, 0.05, 0, { parent: g }); m.scale.set(1.5, 1, 1); this.add(new THREE.ConeGeometry(0.03, 0.05, 8), stem, -0.075, 0.05, 0, { parent: g }).rotation.z = Math.PI / 2; }
      if (k === 1) { this.add(new THREE.CapsuleGeometry(0.03, 0.08, 6, 14), lam("#4f8a32"), 0, 0.035, 0, { parent: g }).rotation.z = Math.PI / 2; }
      if (k === 2) { const m = this.add(new THREE.SphereGeometry(0.055, 18, 14), lam("#d9372c"), 0, 0.055, 0, { parent: g }); m.scale.set(1, 1.15, 1); this.add(new THREE.CylinderGeometry(0.008, 0.01, 0.04, 6), stem, 0, 0.12, 0, { parent: g }); }
      if (k === 3) { const m = this.add(new THREE.SphereGeometry(0.05, 18, 14), lam("#ef4b33"), 0, 0.048, 0, { parent: g }); m.scale.set(1, 0.85, 1); this.add(new THREE.ConeGeometry(0.025, 0.012, 5), stem, 0, 0.094, 0, { parent: g }); }
      R.add(g);
      return g;
    };
    for (let k = 0; k < 4; k++) this.veg.push(mk(k));
  }

  private actor(i: number) { while (this.actors.length <= i) this.actors.push(new Actor(this.root)); return this.actors[i]; }
  private fx(i: number) { while (this.fxs.length <= i) this.fxs.push(new Fx(this.root)); return this.fxs[i]; }

  update(f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) {
    const t = f / FPS, id = shotAt(f).id;
    // ---- camera ----
    const c = camAt(f);
    cam.position.set(...c.pos); cam.up.set(0, 1, 0); cam.lookAt(...c.look); cam.rotateZ(c.roll);
    cam.fov = c.fov; cam.near = 0.05; cam.far = 60; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    cam.layers.enable(NOINK);
    const focus = new THREE.Vector3(...c.look);
    // ---- light rig ----
    this.hemi.color.set(L.sky); this.hemi.groundColor.set(L.ground); this.hemi.intensity = L.hemiI;
    this.sun.color.set(L.sunCol); this.sun.intensity = L.sunI;
    const Rr = 6.5, mid = new THREE.Vector3(0, 0.8, -1);
    this.sun.position.copy(mid).addScaledVector(SUN, 40); this.sun.target.position.copy(mid);
    const sc = this.sun.shadow.camera;
    sc.left = -Rr; sc.right = Rr; sc.top = Rr; sc.bottom = -Rr; sc.near = 5; sc.far = 80; sc.updateProjectionMatrix();
    this.sun.shadow.bias = L.bias; this.sun.shadow.normalBias = 0.01;
    TONE.uLitCol.value.set(...L.lit); TONE.uShadeCol.value.set(...L.shade); TONE.uShadeLift.value.set(...L.lift);
    TONE.uLambert.value = L.lambert; TONE.uSideK.value = L.sideK; TONE.uTerm.value = L.term; TONE.uBounce.value.set(0.03, 0.015, 0); TONE.uSat.value = LOOK.day.sat;
    CHAR.uCharTint.value.set(...L.charTint); CHAR.uCharShade.value = L.charShade; CHAR.uGrad.value = L.charGrad;
    CHAR.uBodyGrad.value = L.bodyGrad; CHAR.uSideTint.value.set(...L.sideTint);
    scene.fog = null; scene.background = new THREE.Color("#2a2230");
    // ---- props ----
    this.pot.visible = potShown(id);
    this.board.visible = !pansShown(id); // no board in the pan shots: it has no role there
    const fill = potFill(id, t);
    this.stew.visible = fill > 0; this.stew.position.y = 0.03 + 0.14 * fill;
    this.pans.forEach((p, k) => { p.visible = pansShown(id); this.panFood[k].visible = panFill(id, t, k); });
    this.veg.forEach((g, k) => {
      const v = vegAt(id, t, k);
      g.visible = v.on && v.s > 0.01;
      g.position.set(...(v.pos as V3)); g.scale.setScalar(Math.max(0.01, v.s)); g.rotation.set(v.spin, v.spin * 0.6, 0);
    });
    // clock: ten past ten, and in shot 14 the hands spin through two hours
    const u = id === 14 ? Math.min(1, Math.max(0, (t - R(40.95)) / 0.55)) : id > 14 ? 1 : 0;
    const e = u * u * (3 - 2 * u);
    this.minHand.rotation.z = -(2 * Math.PI) * (10 / 60) - e * 4 * Math.PI;
    this.hourHand.rotation.z = -(2 * Math.PI) * (10 / 12 + 10 / 720) - e * (Math.PI / 3);
    // ---- cast + effects ----
    const right = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0);
    const st = stage(id, t, { pos: cam.position, right });
    let ai = 0;
    const used: Actor[] = [];
    for (const p of st.places) {
      const a = this.actor(ai++), sc2 = p.scale ?? 1;
      const [w, h, k] = p.size ?? [600, 1000, 1];
      a.r = this.pool.req(p.key, w, h, k, p.draw);
      a.mesh.visible = true;
      a.mesh.position.set(p.x, p.y, p.z);
      a.mesh.rotation.set(0, p.yaw ?? Math.atan2(cam.position.x - p.x, cam.position.z - p.z), p.roll ?? 0);
      a.mesh.scale.set(p.mirror ? -sc2 : sc2, sc2, sc2);
      used.push(a);
    }
    for (let i = ai; i < this.actors.length; i++) this.actors[i].mesh.visible = false;
    let fi = 0;
    const fused: Fx[] = [];
    for (const p of st.fx) {
      const e2 = this.fx(fi++);
      e2.r = this.pool.req(p.key, p.cw, p.ch, 1, p.draw);
      e2.use(!!p.soft);
      e2.mesh.visible = true;
      e2.mesh.position.set(p.x, p.y, p.z);
      if (p.flat) e2.mesh.rotation.set(-Math.PI / 2, 0, p.rot ?? 0);
      else { e2.mesh.quaternion.copy(cam.quaternion); e2.mesh.rotateZ(p.rot ?? 0); }
      e2.mesh.scale.set(p.w, p.h, 1);
      fused.push(e2);
    }
    for (let i = fi; i < this.fxs.length; i++) this.fxs[i].mesh.visible = false;
    this.pool.flush();
    for (const a of used) a.bind();
    for (const e2 of fused) e2.bind();
    return focus;
  }
}
