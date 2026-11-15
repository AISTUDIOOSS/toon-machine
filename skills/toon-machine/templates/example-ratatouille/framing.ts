// What must be on screen in each shot, for scripts/framing.mjs. One entry per shot id:
// a list of [label, [x, y, z]] points (checked at start, middle and end), or {start, mid, end} when the shot moves
// from one subject to another. Put the TOP of every tall shape (hat, hair, raised arm) and a point on each side of
// every prop group: the check then catches a cut hat or a prop sliced by the frame edge.
import { SHOTS, MARCO, CHEF_DOOR, CHEF_ISLAND, POT, PANS, BOARD, SLOT, CLOCK, TOP, V3 } from "./story";
export { SHOTS };
type Pt = [string, V3];
// measured on stills: chef eyes ~1.48 m, toque top ~2.15 m; Marco eyes ~1.42 m, toque top ~1.97 m (+10 cm margin)
const HAT = { chef: 2.25, Marco: 1.99 }, EYE = { chef: 1.48, Marco: 1.42 };
const who = (n: "chef" | "Marco", x: number, z: number): Pt[] => [[`${n} hat top`, [x, HAT[n], z]], [`${n} face`, [x, EYE[n], z]], [`${n} left shoulder`, [x - 0.2, 1.15, z]], [`${n} right shoulder`, [x + 0.2, 1.15, z]]];
const head = (n: "chef" | "Marco", x: number, z: number): Pt[] => [[`${n} hat top`, [x, HAT[n], z]], [`${n} chin`, [x, EYE[n] - 0.2, z]]];
const pans: Pt[] = PANS.flatMap(([x, z], k) => [[`pan ${k + 1} L`, [x - 0.15, TOP + 0.05, z]], [`pan ${k + 1} R`, [x + 0.15, TOP + 0.05, z]], [`handle ${k + 1}`, [x, TOP + 0.05, z + (z < 0 ? -0.36 : 0.36)]]] as Pt[]);
const pot: Pt[] = [["pot L", [POT[0] - 0.18, TOP + 0.2, POT[2]]], ["pot R", [POT[0] + 0.18, TOP + 0.2, POT[2]]], ["splash top", [POT[0], TOP + 0.45, POT[2]]]];
const board: Pt[] = [["board L", [BOARD[0] + SLOT[0], TOP + 0.05, BOARD[2]]], ["board R", [BOARD[0] + SLOT[3], TOP + 0.05, BOARD[2]]]];
const notes: Pt[] = PANS.map(([x, z], k) => [`notes ${k + 1}`, [x, TOP + 0.65, z]] as Pt);
const M = (f: typeof who) => f("Marco", MARCO[0], MARCO[2]);
export const FRAMING: Record<number, Pt[] | { start?: Pt[]; mid?: Pt[]; end?: Pt[] }> = {
  1: [...M(who), ...pot, ...board], 2: head("chef", CHEF_DOOR[0], CHEF_DOOR[2]),
  3: [...pot, ...board], 4: { end: M(who) }, 5: [], 6: [...M(who), ...pot, ...board],
  7: [...M(head), ["steam", [POT[0], TOP + 0.5, POT[2]]]],
  8: { start: M(head), end: [...head("chef", CHEF_DOOR[0], CHEF_DOOR[2]), ["chef arms", [CHEF_DOOR[0], 1.0, CHEF_DOOR[2]]]] },
  9: head("chef", CHEF_DOOR[0], CHEF_DOOR[2]), 10: { start: [...who("chef", CHEF_ISLAND[0], CHEF_ISLAND[2]), ...pans], mid: pans, end: [...who("chef", CHEF_ISLAND[0], CHEF_ISLAND[2]), ...pans] },
  11: [...who("chef", CHEF_ISLAND[0], CHEF_ISLAND[2]), ["plate", [CHEF_ISLAND[0], 1.08, CHEF_ISLAND[2] + 0.25]]], 12: [...pans, ...notes], 13: [...M(who), ...pans],
  14: [["clock", CLOCK]], 15: [...M(head), ["sweat", [MARCO[0] + 0.24, 1.85, MARCO[2]]]],
  16: { start: [...who("chef", -0.22, CHEF_ISLAND[2]), ...who("Marco", 0.3, MARCO[2])], end: [...who("chef", -0.22, CHEF_ISLAND[2]), ...who("Marco", 0.3, MARCO[2])] },
};
