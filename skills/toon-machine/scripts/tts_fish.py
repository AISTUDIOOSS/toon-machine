# Generates one wav per sentence with Fish Audio (expressive TTS that understands emotion tags in brackets).
# usage: FISH_API_KEY=... python scripts/tts_fish.py <lines.txt> <voice_dir> --voice <reference_id> [--model s2.1-pro] [--only 3,7]
# lines.txt: one sentence per line, each starting with its tone tag, e.g.
#   [intrigued, like a storyteller hooking you] This cook wanted to make a ratatouille.
#   [dramatic, leaning on it] He almost started a war!
# The tags set the acting and are not spoken. Writes s1.wav, s2.wav ... (44.1 kHz mono). Re-run with --only to redo
# single sentences. Any TTS with tags works the same way (e.g. ElevenLabs v3 audio tags): keep one file per sentence.
import argparse, json, os, urllib.request, io, wave
ap = argparse.ArgumentParser()
ap.add_argument("lines"); ap.add_argument("dir"); ap.add_argument("--voice", required=True)
ap.add_argument("--model", default="s2.1-pro"); ap.add_argument("--only", default="")
A = ap.parse_args(); key = os.environ.get("FISH_API_KEY") or exit("set FISH_API_KEY")
os.makedirs(A.dir, exist_ok=True)
lines = [l.strip() for l in open(A.lines, encoding="utf-8") if l.strip()]
only = {int(x) for x in A.only.split(",") if x}
for i, text in enumerate(lines, 1):
    if only and i not in only: continue
    body = json.dumps({"text": text, "reference_id": A.voice, "format": "wav", "sample_rate": 44100}).encode()
    req = urllib.request.Request("https://api.fish.audio/v1/tts", data=body, method="POST",
                                 headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json", "model": A.model})
    data = urllib.request.urlopen(req, timeout=180).read()
    w = wave.open(io.BytesIO(data))
    if w.getnchannels() != 1:  # keep the left channel
        import numpy as np
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).reshape(-1, w.getnchannels())[:, 0]
        o = wave.open(os.path.join(A.dir, f"s{i}.wav"), "wb"); o.setnchannels(1); o.setsampwidth(2); o.setframerate(w.getframerate()); o.writeframes(a.tobytes()); o.close()
    else:
        open(os.path.join(A.dir, f"s{i}.wav"), "wb").write(data)
    print(f"s{i}.wav  {w.getnframes() / w.getframerate():.2f} s  {text[:60]}")
