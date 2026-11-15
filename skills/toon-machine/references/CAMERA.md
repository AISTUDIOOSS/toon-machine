# Camera menu: shots with a filmmaker's eye

Use this file at step 7 of the pipeline, on any story. Don't type positions by feel shot after shot. Each moment of the voice gets an **intention**, the intention picks a **shot** from the menu, the **rules** keep the sequence varied, and the **framing check** places and checks the camera.

```
voice -> 1 sentence or key word = 1 moment -> intention -> shot from the menu -> camera solved from the set -> framing check + stills
```

The helpers (`C`, `mix`, `move`, `cuts`, `orbit`, `hand`, `crash`) live in `templates/example-ratatouille/story.ts`. Every shot of that example is commented with the shot it uses.

## 1. Tag every moment with an intention
Read the script line by line and write one intention next to each shot in `story.ts`:

| Intention | The line... |
|---|---|
| hook | opens on the absurd result |
| arrival | brings in a character or a place |
| detail | is about a small object, an ingredient, a gesture of the hands |
| reveal | names something or someone not yet seen ("the chef behind him") |
| shock | lands on one strong word ("war", "never", "boom") |
| motion | is about something that turns, rolls, flies, repeats, follows a rhythm |
| time | says time passes ("two hours later") |
| small / power | shows a character crushed by the situation, or dominant |
| tension | is stress, panic, effort |
| silence | is a judgement, a pause, a look with no words |
| payoff | ends the story or its twist |

## 2. Pick the shot from the menu

| Intention | Shot | Helper | Notes |
|---|---|---|---|
| hook | **low angle** from the props, foreground object big, character above | `move(C(low pos, …, roll ±4°), …)` | camera ~1 m high, slight roll that straightens |
| arrival | **tracking**: the camera walks beside the character, then settles in front | camera = character position + offset, then `mix` to a fixed framing | the offset follows the character's own path each frame |
| detail | **macro slider** at prop height, shallow focus | `C([x, propTop + 0.15, z + 0.4], …, 40, 3°)` + strong lens blur | slide sideways along the props |
| reveal | **push or pan from one subject to the other**, the focus follows | `mix(A, B, smoother(k))`, k starting on the word | the named thing is sharp and centred when its word is said |
| shock | **crash zoom** on the word | `crash(36, 22, W.word)` as the fov | a fov snap in ~0.2 s, never a "boom" graphic |
| motion | **orbit** round the thing that moves, or **follow** it | `orbit(centre, r, h, ang0, ang1, lookY, fov)` | gets faster and tilts (`roll1` ≈ -9°) when the energy rises |
| time | **crash zoom into a clock** or the object that shows time | `C(pos, CLOCK, 40 - 18 * smooth(…))` | short, 0.5-1 s |
| small | **high angle**, the character small behind his task | camera near the ceiling, wide lens | not straight down (see limits) |
| power | **low angle**, hero framing | camera ~1 m high looking up | |
| tension | **dutch handheld close-up** | `hand(C(…, 34, 7°), t, 0.012)` | tilt 5-8°, tiny wobble, no random numbers |
| silence | **tight close-up**, side or symmetrical, the others hidden or soft | camera on the line through both characters hides the one behind | whole hat visible, crop below the face only |
| payoff | **pull back to wide** on everyone | `move` from close to wide, or a hard cut to a wide that recedes | |

A shot can change inside itself: `cuts([null, A], [W.word - LEAD, B], …)` makes hard cuts on words without new shot ids.

## 3. Filmmaker rules (over the whole sequence)
1. Every shot has a reason: write its intention in the comment above it.
2. Never the same shot type twice in a row (two orbits, two crash zooms...).
3. Alternate sizes: wide, medium, close. Never three close-ups in a row.
4. One "wow" shot (orbit, crash zoom, tracking, reveal) about every 8 s, no more: the rest is calm so the wow works.
5. Every move starts on a word (0-3 frames before it). Hard cuts on a change of place or subject.
6. The camera never stops dead: holds keep a slow drift (`move` adds a little linear drift).
7. Focus has a job: blur the foreground in reveals and details, pull focus to whoever speaks or is named. Blur 0 on wide shots.
8. When the voice names something, it is on screen, sharp, at that moment.

## 4. Place the camera from the set, not by hand
- In `framing.ts`, list what must be seen in each shot (`who()`, `head()`, props, `{start, mid, end}` when the subject changes).
- Write a first camera from the menu, then `node scripts/framing.mjs <framing.ts> --fit 7,10:start` solves a position that keeps your direction and lens. Keep the result only if it stays inside the room.
- For anything that moves (a car round a roundabout, a spinning top, a character walking), compute the camera from the object's position at time `t`, the same way the tracking shot reads Marco's path. The camera then follows it whatever it does.

## 5. Check
- `node scripts/framing.mjs <framing.ts>` until "all shots OK". It checks start, middle and end and handles a tilted (rolled) camera.
- The check does not see the segments of a `cuts()` shot that fall between those three times: render a still inside each segment.
- Render a still at the middle of every shot and look at them side by side: whole hats, nothing touching, nothing cut, the dutch angles readable.

## Limits
- **Never straight down on characters.** They are flat cards that only turn left-right: from above they look sliced and their head leaves the frame. Use a high angle from the front instead.
- Stay inside the room (in the example: x ±4, z -3.2 to 4.0, ceiling 3.2). When a wide shot needs more room, widen the lens (up to ~56) instead of pushing the camera through a wall or the ceiling.
- A prop closer than ~2 m to a moving lens becomes a blob at the frame edge. Check props on every moving shot.
- An orbit must be checked at its start, middle and end: the far props swing out of the frame first. Widen the radius or the lens before shrinking the sweep.
