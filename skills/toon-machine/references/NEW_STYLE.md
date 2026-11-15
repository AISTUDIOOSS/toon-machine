# Making the same skill in another style

The process (`SKILL.md`: script, voice, cutting on the voice, framing, checks, quality rules) never changes. Only the look does.

## What to swap
| Keep as is | Replace for the new style |
|---|---|
| `SKILL.md` pipeline and quality rules | `references/STYLE.md`: the new target values |
| `scripts/` (framing, voice, render, QA) | `templates/look/`: ink or no ink, lens blur, grade, lights, textures, card shading |
| `story.ts` structure (shots, `push()`, keys, `R()`) | `toon.ts`: how characters are drawn (shape, outline, faces) |
| `framing.ts` and the safe zone | The set's materials and textures in the world file |

## Steps
1. **Copy this whole skill folder under a new name.** Change `name` and `description` in the frontmatter so each skill is called for its own look.
2. **Pick 4-8 reference images** of the new look: your own drawings, or generated images. Never ship someone else's frames in the skill.
3. **Measure them** and write numbers, not adjectives, in the new `STYLE.md`:
   - outline colour and width in px at 1080 wide (or "no outline"),
   - median brightness, shadow colour, saturation,
   - texture (flat, paper grain, clay, painted),
   - blur amount, character proportions, face style.
4. **Change the look files one area at a time**:
   - outline (`ink.ts`),
   - colour and grade (`lights.ts`, `shade.ts`, `grade.ts`),
   - textures (`paint.ts`),
   - characters (`toon.ts`, `cardshade.ts`),
   - blur (`lensblur.ts`).
   After each area, render the same 3-4 stills of the example and compare them side by side with the references.
5. **Score each area out of 10 against the references** (colour, light, outline, texture, characters, depth). Fix the lowest first. Stop when every area is at 7 or more.
6. **Re-render the example in the new look and run every check in `SKILL.md`.** A new look must not break the framing or the "nothing cut" rules: thicker outlines or bigger heads change what fits in the frame.
7. **Update the `Files` table and the example name** in the new `SKILL.md`.

Tip: run the areas in parallel, one agent per file group, each on its own copy of the example folder. Then merge only the files each agent owns.
