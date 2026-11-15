# One wav per sentence with ElevenLabs v3, which ACTS the tags in brackets ([whispers], [dramatic], [excited]...).
# usage: ELEVENLABS_API_KEY=... python scripts/tts_eleven.py <lines.txt> <voice_dir> [--voice <voice_id>] [--model eleven_v3] [--only 3,7]
# lines.txt: one sentence per line, each starting with its acting tag, the same file the other voices use.
# Writes s1.wav, s2.wav ... (44.1 kHz mono 16-bit) AND s1.json, s2.json ... with the word timings (Whisper format),
# taken from ElevenLabs' own timing data, so no speech-to-text step is needed for placing. Still listen to every line.
# Default voice: George (JBFqnCBsd6RMkjVDRZzb), a warm storyteller from the ElevenLabs library; it speaks French too.
# Pick another narrator in the ElevenLabs voice library and pass its id with --voice. Never clone a real person.
import argparse, base64, json, os, re, urllib.request, urllib.error, wave

ap = argparse.ArgumentParser()
ap.add_argument("lines"); ap.add_argument("dir"); ap.add_argument("--voice", default="JBFqnCBsd6RMkjVDRZzb")
ap.add_argument("--model", default="eleven_v3"); ap.add_argument("--only", default="")
A = ap.parse_args(); key = os.environ.get("ELEVENLABS_API_KEY") or exit("set ELEVENLABS_API_KEY")
os.makedirs(A.dir, exist_ok=True)
lines = [l.strip() for l in open(A.lines, encoding="utf-8") if l.strip()]
only = {int(x) for x in A.only.split(",") if x}

def words_from(al):
    """characters + times -> spoken words with start/end, skipping the [tags]."""
    chars, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    out, cur, depth = [], None, 0
    for c, s, e in zip(chars, st, en):
        if c == "[": depth += 1
        if depth or c.isspace():
            if cur: out.append(cur); cur = None
        else:
            if cur is None: cur = {"word": " " + c, "start": round(s, 3), "end": round(e, 3)}
            else: cur["word"] += c; cur["end"] = round(e, 3)
        if c == "]": depth = max(0, depth - 1)
    if cur: out.append(cur)
    return [w for w in out if re.search(r"\w", w["word"])]

for i, text in enumerate(lines, 1):
    if only and i not in only: continue
    body = json.dumps({"text": text, "model_id": A.model}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{A.voice}/with-timestamps?output_format=pcm_44100",
        data=body, method="POST", headers={"xi-api-key": key, "Content-Type": "application/json"})
    try:
        res = json.load(urllib.request.urlopen(req, timeout=180))
    except urllib.error.HTTPError as e:
        exit(f"ElevenLabs error {e.code} on line {i}: {e.read().decode()[:300]}")
    pcm = base64.b64decode(res["audio_base64"])
    o = wave.open(os.path.join(A.dir, f"s{i}.wav"), "wb"); o.setnchannels(1); o.setsampwidth(2); o.setframerate(44100); o.writeframes(pcm); o.close()
    ws = words_from(res.get("alignment") or res["normalized_alignment"])
    clean = re.sub(r"\s+", " ", re.sub(r"\[.*?\]", " ", text)).strip()
    json.dump({"text": clean, "segments": [{"text": clean, "words": ws}]}, open(os.path.join(A.dir, f"s{i}.json"), "w"), ensure_ascii=False)
    print(f"s{i}.wav  {len(pcm) / 2 / 44100:.2f} s  {len(ws)} words  {clean[:60]}")
