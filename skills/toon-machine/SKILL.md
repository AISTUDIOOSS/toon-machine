---
name: toon-machine
description: Make a vertical 9:16 cartoon story short (30-70 s) fully in code with three.js + Remotion, with an expressive narrated voice. Use when asked for a cartoon, animated short, "dessin animé", or a story video with cartoon characters.
---

# Toon Machine: cartoon story shorts (three.js + Remotion)

Makes a vertical animated story short, 30-70 s, on the user's own computer, with no AI video generator. 2D cartoon characters live in a 3D set. A narrator tells the story and the picture is cut on the voice.

Proven example: **"La ratatouille du chef"**, a 41 s French short (`templates/example-ratatouille/`). This skill holds every rule learned in eight review rounds on it, written as general rules.

**Process and style are separate.**
- This file is the process and the quality rules. They work for any look.
- The look lives in three places: `references/STYLE.md` (the target values), `templates/look/` (ink, lens blur, grade, lights, painted textures, card shading) and the character drawing in `toon.ts`.
- To make the same kind of short in another style, swap those three and keep everything else. See `references/NEW_STYLE.md`.

## How a run goes (what the user sees)
The user only tells the story. Everything technical is yours: never ask them a technical question.
1. **Setup, on your own, first time only.** If the current folder (or `./toon-studio`) has no `.toon.json`, run
   `node <this skill's folder>/scripts/setup.mjs toon-studio` and wait for the line `TOON_READY`. It checks Node and Python, copies the starter project, the look kit, the example and the scripts, runs `npm install` (three.js, Remotion and its own ffmpeg and browser), installs the free voice, and renders one test still. If it stops, read the error and fix it (install Node 18+ or Python 3 if missing, re-run). Then work inside `toon-studio/`. `.toon.json` there says which command runs Python (`python3`, `python` or `py`) and ffmpeg on this computer: use those in every command below.
2. **One question:** « C'est quoi l'histoire que tu veux raconter ? » (in the user's language). One line from them is enough: you pick the tone, the length (30-60 s), the characters and the set. Ask nothing else unless the story is empty.
3. **Script:** write it (Pipeline step 2), show it in the chat, and go on unless they want changes.
4. **Free voice first:** `python scripts/tts_free.py voice/lines.txt voice/free` (no account, no key, word timings included). Build the track with `place_voice.py`, then make the whole video on it and deliver it.
5. **Then offer the better voice,** once, after the first video is delivered: « La voix gratuite est correcte mais plate. Si tu as une clé ElevenLabs ou Fish Audio, colle-la ici et je refais la voix en mieux, qui joue vraiment les émotions. » Save the key in `toon-studio/.env` (`ELEVENLABS_API_KEY=...` or `FISH_API_KEY=...`), never in a file that gets shared, never repeat it in the chat. Re-voice with that provider and re-time the picture on the new voice (see "Re-voicing later"), then re-render.

If `.env` already holds a key, use that provider straight away instead of the free voice.

Each new short is a copy of the example folder, renamed, with its own `<Composition>` in `src/Root.tsx`. Keep the example: it is the reference for every rule below.

## Pipeline
Work in this order. **The voice comes before the picture.**

1. **Story.** Pick one surprising story with a clear physical action, so it is visual. Funny, true or invented, as the user wants. Write `SCRIPT.md` with the facts first.
2. **Script.** About 3.5-4 words per second. Formula:
   - **Hook:** the absurd result in one line, with no setup ("This cook wanted to make a ratatouille. He almost started a war!").
   - **Setting:** place, character, stakes, in 1-2 lines.
   - **Escalation:** 3-4 beats, each a bit bigger.
   - **Turn:** a surprise, often a second character.
   - **Explanation:** the real reason, with an everyday image.
   - **Payoff:** the result, then a last twist that calls back the hook.
   - Never narrate what the picture already shows.
3. **Voice** (see "Voice" below; free voice first, a paid one later if the user gives a key). Output: `voice/voice.wav` and `voice/layout.json`, every word with its time. **This is the clock of the whole video.**
4. **Shot plan** in `story.ts`, written on the voice's words (see "Cutting on the voice").
5. **Set and props:** `kitchen.ts` in the example, your own world file in a new short. Build the set for a vertical frame from the start (see "Set and props").
6. **Characters:** `toon.ts` (drawing) and `cast.ts` (cards in 3D, poses, blinks, effects).
7. **Cameras:** tag each moment of the voice with an intention, pick its shot from the camera menu in `references/CAMERA.md` (low angle, tracking, macro, reveal, crash zoom, orbit, dutch handheld, high angle, pull back...), then `framing.mjs` until every shot passes (see "Framing").
8. **Effects:** steam, splashes, sweat, shakes, at the right scale (see "Effects").
9. **Look:** apply `references/STYLE.md`. The post chain is in the main component (`Ratatouille.tsx`).
10. **Checks:** framing script, stills of every shot, close-ups of every tall shape (see "Checks before showing").
11. **Render and deliver** (see "Render").

After each review, write every piece of feedback as a general rule in "Quality rules" below (or in a project notes file), so it is never repeated.

## Voice
The voice carries the video. A flat voice makes a dead video, whatever the picture.

1. **One file per sentence.** Write `voice/lines.txt` with one sentence per line. Start each line with an acting tag in brackets that says how to say it:
   ```
   [intrigued, like a storyteller hooking you] This cook wanted to make a ratatouille.
   [dramatic, leaning on it] He almost started a war!
   [whispered, low] Behind him... the chef.
   ```
   Vary the tags from line to line: hook, calm setting, rising tension, whisper, punchline. The same file works with every voice below; tags are never spoken.
2. **Generate,** with the best voice available:
   | Voice | Command | Notes |
   |---|---|---|
   | Free (default) | `python scripts/tts_free.py voice/lines.txt voice/free` | No key. Clear but flat: the tag only nudges speed, pitch and loudness. Picks a French or English narrator from the text (`--voice` to change, `python -m edge_tts --list-voices`). |
   | ElevenLabs v3 | `python scripts/tts_eleven.py voice/lines.txt voice/eleven` | Needs `ELEVENLABS_API_KEY`. Acts the tags for real. Default narrator George; `--voice <id>` for another library voice. |
   | Fish Audio | `python scripts/tts_fish.py voice/lines.txt voice/fish --voice <voice_id>` | Needs `FISH_API_KEY`. Acts the tags. Pick a narrator in the Fish library. |
   Load the key from `.env` before running (`set -a; . ./.env; set +a` on Mac/Linux). Never clone a real person's voice without their consent. Redo one sentence with `--only 7`.
3. **Check every sentence.** The free and ElevenLabs scripts write the word timings themselves (`s1.json`...). Fish needs speech-to-text with word timings (any Whisper: `pip install mlx-whisper` on a Mac, `openai-whisper` elsewhere; `--word_timestamps True --output_format json`). Read the words against the text: a wrong, missing or doubled word means regenerating that sentence. Listen for odd noises at the start and end.
4. **Place:** `python scripts/place_voice.py voice/<free|eleven|fish> --keys voice/keys.json`. It:
   - trims every sentence to its speech,
   - drops stray breaths and noise bursts at the edges,
   - adds tiny fades so nothing clicks,
   - joins the sentences with **0.3 s pauses** (`--gaps 13:0.42` for a longer breath before one sentence),
   - writes `voice.wav`, `layout.json` and the total length in frames.
5. **Rhythm rule:** no blank longer than about 0.4 s anywhere. A long pause means the picture waits, and the viewer leaves. If a pause is meant to land a joke, keep it under 0.5 s and give the picture something to do during it.

## Cutting on the voice
- `keys.json` names the words the picture reacts to: `{"jette": [6, "jet", 0], "derriere": [8, "derrière", 0]}`. These are the sentence number, a word stem and the occurrence. `place_voice.py` prints their times, and `story.ts` uses them (`W.jette`, `W.derriere`).
- Shots start on a sentence or a key word. A gesture, prop move or camera move lands 0-3 frames before its word.
- **When the voice names a character, a prop or a place, it is on screen, clear and sharp, at that moment.** If it is behind someone or out of shot, move the camera onto it during the line (a pan or push from one subject to the other), never leave it hidden or blurred.
- The last shot ends exactly at the end of the voice track plus its tail (`TOTAL` frames).
- **Re-voicing later:** keep the old timings and map old time to new time with a monotonic function, as `R()` in the example's `story.ts` does. Its anchors are the first and last word of each sentence plus the key words, kept strictly increasing. Then every shot follows the new voice without being rewritten.

## Set and props
- **Vertical first.** Lay the set out for 9:16: everything the story needs fits in a tall, narrow column. Bring things closer together instead of spreading them as for a horizontal video.
- **Natural placement.** Objects put down by a person (pans, plates, cups, vegetables) look a bit random: small offsets, small turns, never a perfect grid. The group as a whole stays centred.
- **Space between things.** Props side by side never touch or overlap, unless they really are stacked. Check it on a close still, not from the numbers.
- **Every prop has a role.** A prop that does nothing in the story goes. Clutter steals the eye from the action.
- **Scale.** Everything is at real-life scale against the characters: a pan fits a hand, a splash fits its pot.

## Characters
- The drawing sheet is bigger than the character: leave clear space above the tallest point (hat, hair, raised arm) so nothing is sliced flat by the sheet edge. A tall hat must look round on top in a close still.
- A named character is recognisable at a glance: one strong costume shape (a chef's tall hat, a cap, a colour).
- Every character blinks, breathes and reacts. A character standing still for more than 1 s looks frozen.
- Contact shadow under the feet, so characters stand on the floor and do not float.

## Framing
The video is watched on a phone, with the app's buttons and caption on top of it.
- **Safe zone of the 9:16 frame:** x 10-85 %, y 13-78 %. The right side has buttons, the bottom ~22 % has the caption, and the top margin gives hats room to breathe. Everything important is inside it.
- **Centred.** The important group is centred (centre x within 8 % of the middle of the safe zone). If it does not fit, widen the shot, move the camera closer, re-aim it, or bring the elements closer in the set.
- **Nothing important cut.** No head, hat, hand doing the action, or prop of the story is cut by the frame edge. A close-up can crop below the face, never above the head.
- **Check every shot with numbers, not by eye.** `framing.ts` lists the important points of each shot: the top of each tall shape plus both sides of each prop group. Use `{start, end}` when the shot moves from one subject to another. `node scripts/framing.mjs src/videos/<name>/framing.ts` projects them through each camera at the start, middle and end of the shot and lists every point outside the zone. `--fit 4,8:start` proposes a camera that fits the points.
- **The camera always moves a little.** Every hold is a slow drift or push-in (the `move()` helper in the example). A static frame reads as frozen.
- Hard cuts on place or subject changes. Smooth glides of 18-40 frames otherwise.

## Effects
- **Effects are physical, not comic-book.** No "BOOM" bursts, no stars or explosion cards, no kitsch. A steam puff, a drop of sweat or a splash is enough.
- **Liquids stay in their container, at its scale:** a splash rises a few centimetres above the pot and falls back inside, it does not fill the frame.
- **Shakes are light:** a small flip shake that decays over about 7 frames, on real impacts only.
- No on-screen text, captions or labels unless the user asks.

## Sound
- Voice only by default. Add music only if the user picks it; keep it well under the voice.
- No sound effects added "for fun". Add one only for an action the viewer sees, and keep it quiet (10-20 dB under the voice).

## Checks before showing
Run all of these before showing anything to the user:
1. `node scripts/framing.mjs src/videos/<name>/framing.ts` passes for every shot.
2. **Stills of every shot** at its start, middle and end, at half size (`node scripts/stills.mjs <Comp> out/<name>/s_ 12,40,80,... 0.5`). Look at each one for:
   - hats and heads whole and round,
   - props not touching,
   - the named subject visible,
   - no prop cut by an edge,
   - nothing kitsch.
3. A close still (scale 1) of every tall or detailed shape: hats, hands, faces.
4. Listen to `voice.wav` once, start to end: no noise, no long blank, no missing word.
5. After the render: `python scripts/short_qa.py out/<name>/final.mp4 out/<name>/qa shots.json` finds black, white, frozen or popping frames and measures loudness.

Fix, re-check, and only then show it.

## Render
- `node scripts/render.mjs <Comp> out/<name>/video.mp4` renders 1080x1920 h264. Add `0-299` for a part and `1.3333` as the 4th argument for a 2K export (1440x2560). `CONC=4` sets the parallel renders.
- Remotion writes a silent audio track. Add the voice with (`npx remotion ffmpeg` instead of `ffmpeg` if none is installed, see `.toon.json`):
  `ffmpeg -i video.mp4 -i voice/voice.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest final.mp4`
- Name versions `<title> - test N.mp4` and keep the old ones, so the user can compare.

## Quality rules (the short list)
Every rule here came from a real review. Check all of them on every short.
1. Important elements centred in the 9:16 safe zone, nothing on the edges.
2. Nothing important cut: no sliced hat or head, by the frame or by the drawing sheet. Clear space above tall shapes.
3. When the voice names something, it is clearly on screen at that moment.
4. Props never touch or overlap. They are placed naturally, not in a grid, and the group stays centred.
5. No prop without a role.
6. Effects at real scale and inside their container. No kitsch comic effects. Light shakes.
7. Voice first, expressive, with acting tags. Every sentence checked by speech-to-text. Pauses about 0.3 s, no long blanks, no stray noise.
8. The picture follows the voice: cuts, gestures and camera moves land on its words.
9. The camera never fully stops. Every hold creeps in.
10. Check every shot, not a few: numbers for framing, stills for everything else.
11. Every shot has a reason (its intention), never the same shot type twice in a row, sizes alternate, one wow shot about every 8 s (`references/CAMERA.md`).
12. Never a straight top-down shot on the characters: flat cards look sliced from above.

## Technical gotchas
- The ink outline must be its own pass before the lens blur, or the blur wipes it. Chain order: ink → lens blur → bloom → tone map → grade.
- Pixel-sized post settings scale with output height / 1920. Stills at 0.5 still render a full buffer, because R3F keeps dpr ≥ 1.
- Each Remotion bundle copies `public/` into the temp folder and never deletes it. Keep `public/` small, and clear old `remotion-webpack-bundle-*` folders when the temp folder grows.
- In JS strings use `/` in paths: `"\r..."` becomes a carriage return.
- Scratch `.ts` files inside `out/` break `tsc`: name them `.txt`.
- Character cards sit on the `NOINK` layer, so the world outline does not draw around them. They carry their own ink.
- A prop closer than ~2 m to a moving lens becomes a huge blob at the frame edge. Re-check props whenever a camera moves.
- TTS: some voices add a breath or noise at the end of a sentence. `place_voice.py` drops it, but listen anyway.

## Files
| Path | What it is |
|---|---|
| `references/STYLE.md` | The current look ("inked storybook"): colours, ink, lens blur, light, character drawing values |
| `references/CAMERA.md` | Camera menu: intention of each moment -> shot, filmmaker rules, camera placement, limits |
| `references/NEW_STYLE.md` | How to build a second skill with another look by swapping the style files |
| `templates/project/` | Starter Remotion project (package.json, tsconfig, entry, Root) |
| `templates/look/` | Style kit: ink pass, lens blur, grade, lights, two-tone shading, painted textures, card shading |
| `templates/example-ratatouille/` | The proven short: story/cameras, set, characters, framing points, voice lines and layout |
| `scripts/framing.mjs` | Framing check and camera fit for every shot |
| `scripts/place_voice.py` | Builds the voice track from one file per sentence; word timings |
| `scripts/setup.mjs` | One-time automatic setup of the studio folder |
| `scripts/tts_free.py` | Free voice, no key (edge-tts), with word timings |
| `scripts/tts_eleven.py` | ElevenLabs v3 voice that acts the tags, with word timings |
| `scripts/tts_fish.py` | Fish Audio voice that acts the tags |
| `scripts/stills.mjs`, `scripts/render.mjs` | Stills and video render |
| `scripts/short_qa.py` | Frame-by-frame check of the final video |

Skill créé par Slowdoown (AI Studio Club). License: MIT, see `LICENSE`.
