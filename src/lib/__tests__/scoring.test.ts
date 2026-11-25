import { describe, expect, it } from "vitest";
import {
  baseValue,
  computeDeltas,
  defaultRuleset,
  deriveState,
  faanValue,
} from "../rules";
import { evaluateHand } from "../tiles";

const classic = defaultRuleset("classic");
const new18 = defaultRuleset("new18");
const taiwan = defaultRuleset("taiwan");

/* ---------------- Half-spicy base table (must match the official 半辣上 chart) ---------------- */
describe("baseValue (半辣上)", () => {
  it("matches the official doubling-then-halving ladder", () => {
    const expectTable = [1, 2, 4, 8, 16, 24, 32, 48, 64, 96, 128, 192, 256, 384];
    expect(expectTable.map((_, f) => baseValue(f, "half_spicy"))).toEqual(expectTable);
  });
  it("full spicy is pure doubling", () => {
    expect([0, 1, 2, 3, 4, 5].map((f) => baseValue(f, "full_spicy"))).toEqual([1, 2, 4, 8, 16, 32]);
  });
  it("linear is 2 per faan (min 2)", () => {
    expect(baseValue(0, "linear")).toBe(2);
    expect(baseValue(3, "linear")).toBe(6);
    expect(baseValue(9, "linear")).toBe(18);
  });
});

describe("faanValue (applies cap + multiplier)", () => {
  it("caps at the table max and applies the multiplier (x2)", () => {
    expect(faanValue(3, classic)).toBe(16); // 8 * 2
    expect(faanValue(13, classic)).toBe(256); // capped to 10 -> 128 * 2
    expect(faanValue(13, new18)).toBe(768); // 13 allowed -> 384 * 2
  });
});

/* ---------------- Payout distribution ---------------- */
describe("computeDeltas", () => {
  it("half gun: winner +2P, discarder -P, others -P/2", () => {
    const d = computeDeltas({ method: "discard", winner: 0, discarder: 2, faan: 3, rules: classic, payRule: "half" });
    expect(d).toEqual([32, -8, -16, -8]);
  });
  it("full gun: discarder pays everything (-2P), winner +2P", () => {
    const d = computeDeltas({ method: "discard", winner: 0, discarder: 2, faan: 3, rules: classic, payRule: "full" });
    expect(d).toEqual([32, 0, -32, 0]);
  });
  it("self-draw: winner +3P, each other -P", () => {
    const d = computeDeltas({ method: "selfdraw", winner: 1, discarder: null, faan: 6, rules: classic, payRule: "half" });
    expect(d).toEqual([-64, 192, -64, -64]);
  });
  it("draw: nobody changes", () => {
    const d = computeDeltas({ method: "draw", winner: null, discarder: null, faan: 0, rules: classic, payRule: "half" });
    expect(d).toEqual([0, 0, 0, 0]);
  });
  it("is always zero-sum (points never created or destroyed)", () => {
    const d = computeDeltas({ method: "discard", winner: 3, discarder: 0, faan: 10, rules: classic, payRule: "half" });
    expect(d.reduce((a, b) => a + b, 0)).toBe(0);
  });
});

/* ---------------- Dealer / wind rotation ---------------- */
describe("deriveState (rotation)", () => {
  it("dealer keeps the seat when they win", () => {
    const s = deriveState([{ method: "discard", winnerSeat: 0 }, { method: "selfdraw", winnerSeat: 0 }]);
    expect(s.dealer).toBe(0);
    expect(s.roundWind).toBe(0);
    expect(s.handNo).toBe(3);
  });
  it("dealer rotates counter-clockwise when another wins", () => {
    const s = deriveState([{ method: "discard", winnerSeat: 1 }, { method: "discard", winnerSeat: 2 }]);
    expect(s.dealer).toBe(2);
  });
  it("a draw keeps the dealer", () => {
    const s = deriveState([{ method: "draw", winnerSeat: null }]);
    expect(s.dealer).toBe(0);
  });
  it("advances the round wind when the dealer wraps back to East", () => {
    const s = deriveState([
      { method: "discard", winnerSeat: 1 },
      { method: "discard", winnerSeat: 2 },
      { method: "discard", winnerSeat: 3 },
      { method: "discard", winnerSeat: 0 },
    ]);
    expect(s.dealer).toBe(0);
    expect(s.roundWind).toBe(1);
  });
});

/* ---------------- Hand evaluation ----------------
   All hands below are REAL winning hands (4 melds + 1 pair),
   so they exercise the scoring, not just the tile-count guard. */

// 4 chows + 1 pair = 14, no kong
const H14 = ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "dR", "dR", "dR", "wE", "wE"];
// 3 chows + 1 kong + 1 pair = 15, one kong
const H15 = ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "dR", "dR", "dR", "dR", "wE", "wE"];
// 4 kongs + 1 pair = 18 (Eighteen Arhats)
const H18 = ["dR", "dR", "dR", "dR", "dG", "dG", "dG", "dG", "dW", "dW", "dW", "dW", "wE", "wE", "wE", "wE", "s9", "s9"];
// Mixed one suit + dragon pung + seat wind (seat 0 = East), 14
const MIX = ["m1", "m2", "m3", "m4", "m5", "m6", "dR", "dR", "dR", "wE", "wE", "wE", "wS", "wS"];
// Mixed terminals, all pungs + pair, 14 (must NOT also count All in Triplets)
const TERM = ["m1", "m1", "m1", "s9", "s9", "s9", "p1", "p1", "p1", "wE", "wE", "wE", "dR", "dR"];
// Seven pairs, 14
const SEVEN = ["m1", "m1", "m3", "m3", "s5", "s5", "s7", "s7", "p2", "p2", "p9", "p9", "wE", "wE"];

const EV = (tiles: string[], extra: Partial<Parameters<typeof evaluateHand>[0]> = {}) =>
  evaluateHand({ tiles, flowers: [], selfDraw: false, concealed: false, seatWind: 0, roundWind: 0, rules: classic, ...extra });
const keysOf = (r: ReturnType<typeof EV>) => r.patterns.map((p) => p.key);

describe("evaluateHand tile-count invariant (14 + kongs, universal across game types)", () => {
  it("accepts 14 tiles with no kong", () => {
    const r = EV(H14);
    expect(r.valid).toBe(true);
    expect(r.physicalTiles).toBe(14);
    expect(r.kongs).toHaveLength(0);
  });
  it("accepts 15 tiles with exactly one kong", () => {
    const r = EV(H15);
    expect(r.valid).toBe(true);
    expect(r.kongs).toEqual(["dR"]);
    expect(r.physicalTiles).toBe(15);
  });
  it("accepts 18 tiles with four kongs (Eighteen Arhats)", () => {
    const r = EV(H18);
    expect(r.valid).toBe(true);
    expect(r.kongs).toHaveLength(4);
    expect(r.physicalTiles).toBe(18);
  });
  it("rejects 15 tiles with no kong", () => {
    expect(EV([...H14, "s9"]).valid).toBe(false);
  });
  it("rejects 16 tiles with only one kong", () => {
    expect(EV([...H15, "s9"]).valid).toBe(false);
  });
  it("rejects a physically impossible 19 tiles", () => {
    expect(EV([...H18, "s8"]).valid).toBe(false);
  });
});

describe("evaluateHand pattern scoring", () => {
  it("scores Mixed One Suit + Dragon Pung + Seat Wind", () => {
    const r = EV(MIX, { seatWind: 0, roundWind: 1 });
    const keys = keysOf(r);
    expect(keys).toContain("mixed_one_suit");
    expect(keys).toContain("dragon_pong");
    expect(keys).toContain("seat_wind");
  });
  it("new18: Mixed Orphans subsumes All in Triplets (no double count of the all-pung structure)", () => {
    const r = evaluateHand({ tiles: TERM, flowers: [], selfDraw: false, concealed: false, seatWind: 0, roundWind: 0, rules: new18 });
    expect(r.valid).toBe(true);
    expect(keysOf(r)).toContain("mixed_orphans");
    expect(keysOf(r)).not.toContain("all_triplets");
  });
  it("classic: Mixed Orphans is a 1-faan bonus stacked on top of All in Triplets", () => {
    const r = EV(TERM);
    expect(r.valid).toBe(true);
    expect(keysOf(r)).toContain("mixed_orphans");
    expect(keysOf(r)).toContain("all_triplets");
  });
  it("scores Seven Pairs", () => {
    const r = EV(SEVEN);
    expect(r.valid).toBe(true);
    expect(keysOf(r)).toContain("seven_pairs");
  });
});

describe("evaluateHand flower rules (the bug that was fixed)", () => {
  it("gives Seat Flower +1 when a single flower matches the seat", () => {
    const r = evaluateHand({ tiles: MIX, flowers: ["f1"], selfDraw: false, concealed: false, seatWind: 0, roundWind: 1, rules: classic });
    expect(keysOf(r)).toContain("seat_flower");
  });
  it("gives Flower Set +2 and does NOT double-count the seat flower inside the set", () => {
    const r = evaluateHand({ tiles: MIX, flowers: ["f1", "f2", "f3", "f4"], selfDraw: false, concealed: false, seatWind: 0, roundWind: 1, rules: classic });
    const keys = keysOf(r);
    expect(keys).toContain("flower_set");
    expect(keys).not.toContain("seat_flower"); // <-- the previously-buggy double count
  });
  it("gives No Flowers +1 when holding none", () => {
    const r = evaluateHand({ tiles: MIX, flowers: [], selfDraw: false, concealed: false, seatWind: 0, roundWind: 1, rules: classic });
    expect(keysOf(r)).toContain("no_flowers");
  });
});

describe("evaluateHand taiwan (same 14+kong structure, different 台 scoring)", () => {
  it("accepts the same 14-tile hand and applies its own faan table", () => {
    const r = evaluateHand({ tiles: MIX, flowers: [], selfDraw: false, concealed: false, seatWind: 0, roundWind: 0, rules: taiwan });
    expect(r.valid).toBe(true);
    expect(r.physicalTiles).toBe(14);
  });
  it("still rejects a 15-tile hand with no kong in taiwan mode", () => {
    const r = evaluateHand({ tiles: [...H14, "s9"], flowers: [], selfDraw: false, concealed: false, seatWind: 0, roundWind: 0, rules: taiwan });
    expect(r.valid).toBe(false);
  });
  it("adds the Taiwan dealer (+1 台) bonus when the dealer wins", () => {
    const r = evaluateHand({ tiles: MIX, flowers: [], selfDraw: false, concealed: false, seatWind: 0, roundWind: 0, rules: taiwan, isDealer: true });
    expect(keysOf(r)).toContain("dealer");
  });
});
