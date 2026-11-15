# Toon Machine

*Skill créé par Slowdoown · AI Studio Club*

Tell Claude a story, get a vertical cartoon short (9:16, 30-60 s) with a narrated voice. Everything is made in code on your own computer, with three.js and Remotion: no AI video generator, no subscription.

Proven on **"La ratatouille du chef"**, a 41 s short. Every fix from its review rounds is written into the skill as a rule: framing for phones, nothing cut, the named subject always on screen, natural props, no kitsch effects, a lively voice, and filmmaker camera angles (low angles, tracking, crash zooms, orbits, reveals).

## Install in one paste

Open **Claude Code** in any folder and paste this:

```
Install this skill and set it up: https://github.com/AISTUDIOOSS/toon-machine
```

That's it. Claude installs the skill, then the studio (three.js, Remotion, the free voice) and checks it works. Then it asks you one thing: **what story do you want to tell?**

Other ways, if you prefer:
- Claude Code plugin: `/plugin marketplace add AISTUDIOOSS/toon-machine` then `/plugin install toon-machine@toon-machine`
- Any agent that reads skills: `npx skills add AISTUDIOOSS/toon-machine`

You need [Node.js 18+](https://nodejs.org) and [Python 3](https://www.python.org/downloads/). Everything else installs itself.

## What happens next

1. You tell the story in one line.
2. Claude writes the script and shows it to you.
3. It makes the voice with a **free voice** (no account, no key) and builds the whole video on it: set, characters, camera, render.
4. Then it asks if you have an **ElevenLabs** or **Fish Audio** key. Paste it and it redoes the voice with one that really acts the emotions (whispers, drama, excitement), and re-times the picture on it.

Your key stays in a `.env` file on your computer.

## For AI agents: how to install

When a user pastes this repository's link and asks to install it, do this without asking them technical questions:

1. Clone the repository: `git clone --depth 1 https://github.com/AISTUDIOOSS/toon-machine.git` into a temporary folder.
2. Copy its `skills/toon-machine` folder to `~/.claude/skills/toon-machine` (on Windows `%USERPROFILE%\.claude\skills\toon-machine`). If it already exists, replace it (it holds no user data).
3. Run the setup in the user's current folder: `node ~/.claude/skills/toon-machine/scripts/setup.mjs toon-studio`. Wait for the line `TOON_READY`. If Node 18+ or Python 3 is missing, tell the user in plain words which one to install, with its download link, then run it again.
4. Read `~/.claude/skills/toon-machine/SKILL.md` and follow "How a run goes": ask the user what story they want to tell.

## What's inside

| Path | What it is |
|---|---|
| `skills/toon-machine/SKILL.md` | The process and every quality rule |
| `skills/toon-machine/references/CAMERA.md` | Camera menu: which shot for which moment, filmmaker rules |
| `skills/toon-machine/references/STYLE.md` | The look: colours, ink, blur, light, characters |
| `skills/toon-machine/references/NEW_STYLE.md` | How to make the same machine in another style |
| `skills/toon-machine/templates/` | Starter project, style kit, the full ratatouille example |
| `skills/toon-machine/scripts/` | Setup, voices (free, ElevenLabs, Fish), framing check, stills, render, QA |

## Change the style

The process and the look are separate. Replace `references/STYLE.md`, `templates/look/` and the character drawing (`toon.ts`); the script, voice, framing and checks stay the same. See `references/NEW_STYLE.md`.

## License

MIT (see `LICENSE`). Copyright (c) 2026 Nicolas / AI Studio Club.

Skill créé par Slowdoown. Author: Slowdoown / AI Studio Club.
