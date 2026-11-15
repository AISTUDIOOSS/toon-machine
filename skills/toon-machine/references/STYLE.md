# Style: "inked storybook" (2D characters in a 3D world)

Flat 2D cartoon characters with plum ink outlines, shown as cards inside a painted 3D set. The set has black ink lines, warm saturated colour, lens blur on close shots, and gliding cameras.

The values live in `templates/look/` and in the character drawing (`toon.ts`). A second style replaces this file and those files (see `NEW_STYLE.md`).

## Colour and light (`look/lights.ts`, `look/shade.ts`, `look/grade.ts`)
- **Two-tone shading:** a lit side and a shade side. The cool tint goes only in the shade.
  - Day lit [1.58, 1.5, 1.33], shade [.30, .29, .36], lift [.05, .06, .11].
- **Day:**
  - Median brightness ~.57.
  - No crushed blacks: non-ink p5 ~.23.
  - Lit colours fairly rich: C* p90 ~55.
  - Sky top #3e7fd2 → horizon #b8d0ec. Fog = horizon colour.
- **Golden hour:**
  - Low backlit sun. Key toward #FFB36B.
  - Violet-blue shadows, never brown.
  - Peach horizon, sun disc with bloom.
- **Interiors** (the ratatouille kitchen): a warm key light from a window side, the same two-tone shading, the same grade.
- **Albedos:** muted, never neon. Never lemon yellow or lavender on lit faces.

## Ink (`look/ink.ts`)
- World lines: #030303, about 5 px near → 3.3 px far at 1080x1920.
  - Drawn on silhouettes, depth jumps and creases from ~35°.
  - None on flat wall or floor joins.
- Character cards are on layer `NOINK` and carry their own ink: dark plum #241726, thicker on the shadow side.

## Lens blur (`look/lensblur.ts`, `dofAt` in `story.ts`)
- Blur radius at 1080 px (`cInf`):
  - hook close-ups 15-16, close-ups 12-14, medium shots 10-12;
  - wides 0.
- Focus on the eyes of the subject who is talking or being talked about.
- Blur on about a third of the screen time. Wides stay sharp.
- Bloom only on bright emissives (threshold 1.0).

## Post (`Ratatouille.tsx`)
- Chain: ink → lens pre → lens main → bloom (thr 1.0, intensity .5) → NEUTRAL tone map → grade. MSAA 4.
- No film grain: it multiplies the file size and turns to mush on social apps.

## Characters (`toon.ts`, `cast.ts`, `look/cardshade.ts`)
- **Shape:**
  - Bean heads (height/width ~.94).
  - Stick limbs ~.055 of the head width, ink-dot hands.
  - Adults about 3.5 head-heights tall.
- **Face:** eyes .26 of the head width apart. No blush, no eye highlights. 14 expressions.
- **Cards:**
  - 600 px wide design sheet, soles at the bottom.
  - Lit by the scene light, never self-lit.
- **Life:**
  - Blinks every 0.5-2.3 s, lasting 4 frames.
  - Walk bob 3-7 %, lean 1-7°.
- **Shadows:** tight contact shadow under the feet, plus a short sun-direction shadow by day.

## Camera (`story.ts`)
- Cuts on big jumps. Smootherstep glides of 18-40 frames.
- Every hold pushes in 0.15-0.35 % per frame.
- Light flip shakes on impacts, decaying over 7 frames.
- Small rolls, up to 4-5°, on dramatic beats only.
