# Free voice, no account and no key: one wav per sentence with Microsoft Edge's online voices (edge-tts).
# usage: python scripts/tts_free.py <lines.txt> <voice_dir> [--voice fr-FR-RemyMultilingualNeural] [--only 3,7]
# lines.txt: one sentence per line, each starting with its acting tag in brackets, the same file the paid voices use:
#   [intrigued, like a storyteller hooking you] This cook wanted to make a ratatouille.
# This voice can't act the tags, so the tag only nudges speed, pitch and loudness (whisper = slower and softer,
# panic = faster and higher...). It is never spoken.
# Writes s1.wav, s2.wav ... (44.1 kHz mono 16-bit) AND s1.json, s2.json ... with the word timings in Whisper format,
# so no speech-to-text step is needed with this voice. Needs: pip install edge-tts (setup.mjs does it).
# Voice by default: French text -> fr-FR-RemyMultilingualNeural, anything else -> en-US-AndrewMultilingualNeural.
# List all voices: python -m edge_tts --list-voices
import argparse, asyncio, json, os, re, subprocess, tempfile
import edge_tts, shutil
FFMPEG = ["ffmpeg"] if shutil.which("ffmpeg") else ["npx", "remotion", "ffmpeg"]  # Remotion ships its own ffmpeg

ap = argparse.ArgumentParser()
ap.add_argument("lines"); ap.add_argument("dir"); ap.add_argument("--voice"); ap.add_argument("--only", default="")
A = ap.parse_args()
os.makedirs(A.dir, exist_ok=True)
lines = [l.strip() for l in open(A.lines, encoding="utf-8") if l.strip()]
only = {int(x) for x in A.only.split(",") if x}

FR = {"le", "la", "les", "un", "une", "des", "et", "est", "il", "elle", "pas", "que", "qui", "dans", "sur", "avec", "mais", "son", "sa"}
def pick_voice():
    words = re.findall(r"[a-zàâçéèêëîïôûùüÿœ']+", " ".join(re.sub(r"\[.*?\]", "", l) for l in lines).lower())
    fr = sum(w in FR for w in words)
    return "fr-FR-RemyMultilingualNeural" if fr > len(words) * 0.08 else "en-US-AndrewMultilingualNeural"
VOICE = A.voice or pick_voice()

# acting tag -> (rate %, pitch Hz, volume %)
MOODS = [
    (("whisper", "chuchot", "murmur", "low", "bas"), (-12, -6, -25)),
    (("panic", "panique", "excited", "fast", "rapide", "urgent", "shout", "cri"), (12, 8, 10)),
    (("dramatic", "dramati", "leaning", "slow", "lent", "solemn", "grave"), (-8, -4, 0)),
    (("happy", "joy", "amused", "funny", "drôle", "malicious", "malicieux", "triumph"), (4, 5, 5)),
    (("intrigued", "hook", "storyteller", "conteur", "mysterious", "mystér"), (-3, 0, 0)),
]
def prosody(tag):
    t = tag.lower()
    for keys, val in MOODS:
        if any(k in t for k in keys): return val
    return (0, 0, 0)
sgn = lambda v: f"+{v}" if v >= 0 else str(v)

async def one(i, line):
    tags = re.findall(r"\[(.*?)\]", line)
    tag = tags[0] if tags else ""
    text = re.sub(r"\s+", " ", re.sub(r"\[.*?\]", " ", line)).strip()  # tags anywhere in the line are never spoken
    r, p, v = prosody(tag); r += 6  # these voices are a bit slow for a short: +6 % everywhere
    com = edge_tts.Communicate(text, VOICE, rate=f"{sgn(r)}%", pitch=f"{sgn(p)}Hz", volume=f"{sgn(v)}%", boundary="WordBoundary")
    mp3 = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False).name
    words = []
    with open(mp3, "wb") as f:
        async for c in com.stream():
            if c["type"] == "audio": f.write(c["data"])
            elif c["type"] == "WordBoundary":
                s = c["offset"] / 1e7; words.append({"word": " " + c["text"], "start": round(s, 3), "end": round(s + c["duration"] / 1e7, 3)})
    wav = os.path.join(A.dir, f"s{i}.wav")
    subprocess.run(FFMPEG + ["-y", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", "44100", "-sample_fmt", "s16", wav], check=True)
    os.unlink(mp3)
    json.dump({"text": text, "segments": [{"text": text, "words": words}]}, open(os.path.join(A.dir, f"s{i}.json"), "w"), ensure_ascii=False)
    print(f"s{i}.wav  {len(words)} words  ({sgn(r)}% {sgn(p)}Hz)  {text[:60]}")

async def main():
    print("voice:", VOICE)
    for i, line in enumerate(lines, 1):
        if only and i not in only: continue
        for attempt in range(3):
            try: await one(i, line); break
            except Exception as e:
                if attempt == 2: raise
                print(f"s{i}: retry ({e})")
asyncio.run(main())
