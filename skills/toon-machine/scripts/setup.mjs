// One-time setup of a Toon Machine studio folder. Safe to run again: it only adds what is missing.
// usage: node <skill>/scripts/setup.mjs [folder]      (default folder: ./toon-studio)
// Does everything on its own:
//   1. checks Node 18+ and finds Python 3,
//   2. copies the starter project, the look kit, the ratatouille example and the scripts into the folder,
//   3. npm install (three.js, React Three Fiber, Remotion, which brings its own ffmpeg and browser),
//   4. pip install numpy + edge-tts (the free voice),
//   5. renders one still of the example to prove the machine works.
// Prints a final line "TOON_READY <folder>" when all is good.
import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.resolve(process.argv[2] || "toon-studio");
const log = (m) => console.log(`\n== ${m}`);
const run = (cmd, opts = {}) => execSync(cmd, { stdio: "inherit", cwd: DIR, ...opts });
const has = (cmd) => spawnSync(cmd, ["--version"], { stdio: "ignore", shell: process.platform === "win32" }).status === 0;

// 1. tools
const major = Number(process.versions.node.split(".")[0]);
if (major < 18) { console.error(`Node ${process.versions.node} is too old: install Node 18+ from https://nodejs.org`); process.exit(1); }
const PY = ["python3", "python", "py"].find((p) => {
  const r = spawnSync(p, ["-c", "import sys; print(sys.version_info[0])"], { encoding: "utf8", shell: process.platform === "win32" });
  return r.status === 0 && r.stdout.trim() === "3";
});
if (!PY) { console.error("Python 3 is missing: install it from https://www.python.org/downloads/ then run this again."); process.exit(1); }
log(`Node ${process.versions.node}, ${PY} OK -> ${DIR}`);

// 2. files (never overwrite the user's work)
const copy = (from, to) => {
  const src = path.join(SKILL, from), dst = path.join(DIR, to);
  if (fs.existsSync(dst)) return console.log(`keep   ${to}`);
  fs.cpSync(src, dst, { recursive: true }); console.log(`added  ${to}`);
};
fs.mkdirSync(DIR, { recursive: true });
for (const f of fs.readdirSync(path.join(SKILL, "templates/project"))) copy(`templates/project/${f}`, f);
copy("templates/look", "src/videos/look");
copy("templates/example-ratatouille", "src/videos/ratatouille");
fs.mkdirSync(path.join(DIR, "scripts"), { recursive: true });
for (const f of fs.readdirSync(path.join(SKILL, "scripts"))) if (f !== "setup.mjs") fs.copyFileSync(path.join(SKILL, "scripts", f), path.join(DIR, "scripts", f));
for (const d of ["public", "out"]) fs.mkdirSync(path.join(DIR, d), { recursive: true });
const gi = path.join(DIR, ".gitignore");
if (!fs.existsSync(gi)) fs.writeFileSync(gi, "node_modules/\nout/\n.env\n");

// 3. node packages
log("npm install (one to three minutes the first time)");
if (!fs.existsSync(path.join(DIR, "node_modules/remotion"))) run("npm install --no-audit --no-fund --loglevel=error");
else console.log("already installed");

// 4. python packages
log("Python packages: numpy, edge-tts (free voice)");
const pip = (extra) => spawnSync(PY, ["-m", "pip", "install", "--quiet", "--disable-pip-version-check", ...extra, "numpy", "edge-tts"], { stdio: "inherit", cwd: DIR, shell: process.platform === "win32" }).status === 0;
if (!(pip([]) || pip(["--user"]) || pip(["--user", "--break-system-packages"]))) {
  console.error(`Could not install numpy and edge-tts. Try: ${PY} -m pip install numpy edge-tts`); process.exit(1);
}

// 5. ffmpeg: a system one is used when present, otherwise Remotion's own copy (npx remotion ffmpeg)
log(has("ffmpeg") ? "ffmpeg: system copy" : "ffmpeg: Remotion's own copy (npx remotion ffmpeg)");

// 6. proof: one still of the example
log("Test still of the example");
if (!process.env.SKIP_STILL) run("node scripts/stills.mjs RatatouilleShort out/test_ 300 0.35");
const ok = process.env.SKIP_STILL || fs.existsSync(path.join(DIR, "out/test_300.jpg"));
if (!ok) { console.error("The test still was not made: see the error above."); process.exit(1); }
fs.writeFileSync(path.join(DIR, ".toon.json"), JSON.stringify({ python: PY, ffmpeg: has("ffmpeg") ? "ffmpeg" : "npx remotion ffmpeg" }, null, 1));
console.log(`\nTOON_READY ${DIR}`);
