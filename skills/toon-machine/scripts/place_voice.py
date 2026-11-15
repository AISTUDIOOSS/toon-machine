# Builds the final voice track from one audio file per sentence, with short even pauses, and writes the word timings
# the picture is cut on.
# usage: python scripts/place_voice.py <voice_dir> [--gap 0.3] [--gaps 13:0.42,7:0.2] [--lead 0.35] [--tail 0.7]
#                                      [--gate -52] [--keys keys.json]
# <voice_dir> holds s1.wav, s2.wav ... (mono 16-bit, one per sentence) and s1.json, s2.json ... (speech-to-text with
# word timestamps, Whisper format: {"segments": [{"words": [{"word", "start", "end"}]}]}).
# Writes <voice_dir>/voice.wav and <voice_dir>/layout.json ({n: {start, end, words: [[word, time], ...]}}).
# keys.json (optional): {"name": [sentence, "word stem", occurrence]} -> prints {"name": seconds} for story.ts.
# What it does to each sentence:
#   - finds the speech on 20 ms frames above the gate (-52 dB keeps soft word endings), joins gaps under 0.2 s;
#   - drops a short burst (<= 0.4 s) sitting alone after >= 0.24 s of silence at either end: TTS breaths, clicks and
#     noise, not words (one of these was heard as a "noise" in a test);
#   - keeps 30 ms before and 60 ms after the speech, fades 10 ms in and 40 ms out (no dry cut, no click);
#   - places sentences end to end with the pause given (default 0.3 s: no long blank, the video stays lively).
import argparse, json, os, wave
import numpy as np
ap = argparse.ArgumentParser()
ap.add_argument("dir"); ap.add_argument("--gap", type=float, default=0.3); ap.add_argument("--gaps", default="")
ap.add_argument("--lead", type=float, default=0.35); ap.add_argument("--tail", type=float, default=0.7)
ap.add_argument("--gate", type=float, default=-52); ap.add_argument("--keys")
A = ap.parse_args(); D = A.dir
GAP = {int(k): float(v) for k, v in (p.split(":") for p in A.gaps.split(",") if p)}
n_sent = 0
while os.path.exists(os.path.join(D, f"s{n_sent + 1}.wav")): n_sent += 1
if not n_sent: raise SystemExit(f"no s1.wav in {D}")
def load(i):
    w = wave.open(os.path.join(D, f"s{i}.wav")); assert w.getnchannels() == 1 and w.getsampwidth() == 2, f"s{i}.wav must be mono 16-bit"
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.int32), w.getframerate()
def speech(a, sr, i):
    F = int(0.02 * sr); n = len(a) // F
    rms = np.sqrt((a[:n * F].astype(np.float64).reshape(n, F) ** 2).mean(1)); on = rms > 32768 * 10 ** (A.gate / 20)
    runs, k = [], 0
    while k < n:
        if on[k]:
            j = k
            while j < n and on[j]: j += 1
            if runs and k - runs[-1][1] < 10: runs[-1][1] = j
            else: runs.append([k, j])
            k = j
        else: k += 1
    if not runs: raise SystemExit(f"s{i}.wav: no speech found (lower --gate?)")
    while len(runs) > 1 and runs[-1][1] - runs[-1][0] <= 20 and runs[-1][0] - runs[-2][1] >= 12: print(f"  s{i}: dropped a noise at the end ({runs.pop()[0] * F / sr:.2f} s)")
    while len(runs) > 1 and runs[0][1] - runs[0][0] <= 20 and runs[1][0] - runs[0][1] >= 12: print(f"  s{i}: dropped a noise at the start ({runs.pop(0)[0] * F / sr:.2f} s)")
    return runs[0][0] * F, runs[-1][1] * F
SR = load(1)[1]; out = np.zeros(int(600 * SR), dtype=np.int32); layout = {}; t = A.lead; end = 0
for i in range(1, n_sent + 1):
    a, sr = load(i); assert sr == SR, "all sentences need the same sample rate"
    s0, s1 = speech(a, sr, i); s0 = max(0, s0 - int(0.03 * SR)); s1 = min(len(a), s1 + int(0.06 * SR))
    if i > 1: t = end + GAP.get(i, A.gap)
    seg = a[s0:s1].astype(np.float64); fi, fo = int(0.01 * SR), int(0.04 * SR)
    seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo)
    p = int(t * SR); out[p:p + len(seg)] += seg.astype(np.int32); end = t + len(seg) / SR
    js = os.path.join(D, f"s{i}.json")
    ws = [(w["word"].strip(), round(t + w["start"] - s0 / SR, 3)) for sg in json.load(open(js))["segments"] for w in sg.get("words", [])] if os.path.exists(js) else []
    if not ws: print(f"  s{i}: no word timings ({js} missing or empty)")
    layout[i] = {"start": round(t, 3), "end": round(end, 3), "words": ws}
total = end + A.tail
o = wave.open(os.path.join(D, "voice.wav"), "wb"); o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR)
o.writeframes(np.clip(out[:int(total * SR)], -32768, 32767).astype(np.int16).tobytes()); o.close()
json.dump(layout, open(os.path.join(D, "layout.json"), "w"), ensure_ascii=False, indent=1)
res = {"total_s": round(total, 3), "frames_30fps": round(total * 30)}
if A.keys:
    W = {}
    for k, (s, stem, occ) in json.load(open(A.keys)).items():
        hits = [tt for w, tt in layout[s]["words"] if stem.lower() in w.lower()]
        W[k] = hits[occ] if len(hits) > occ else None
        if W[k] is None: print(f"  key {k}: '{stem}' not found in sentence {s}")
    res["W"] = W
print(json.dumps(res, ensure_ascii=False))
