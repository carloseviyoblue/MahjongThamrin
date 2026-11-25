import { Ruleset } from "./rules";

// Tile codes: m1..m9 (Characters 萬), s1..s9 (Bamboo 索), p1..p9 (Dots 筒),
// wE wS wW wN (Winds), dR dG dW (Dragons), f1..f4 (Flowers), x1..x4 (Seasons)

export const SUITS = [
  { key: "m", name: "Characters", zh: "萬" },
  { key: "s", name: "Bamboos", zh: "索" },
  { key: "p", name: "Dots", zh: "筒" },
] as const;

export const HONOR_CODES = ["wE", "wS", "wW", "wN", "dR", "dG", "dW"];
export const FLOWER_CODES = ["f1", "f2", "f3", "f4"];
export const SEASON_CODES = ["x1", "x2", "x3", "x4"];

export const ALL_TILES: string[] = [
  ...["m", "s", "p"].flatMap((s) => Array.from({ length: 9 }, (_, i) => `${s}${i + 1}`)),
  ...HONOR_CODES,
];

const CN_NUM = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
export const TILE_LABEL: Record<string, { top: string; bottom: string; color: string; name: string }> = {};
for (let i = 1; i <= 9; i++) {
  TILE_LABEL[`m${i}`] = { top: CN_NUM[i - 1], bottom: "萬", color: "text-red-700", name: `${i} Karakter` };
  TILE_LABEL[`s${i}`] = { top: String(i), bottom: "索", color: "text-emerald-700", name: `${i} Bambu` };
  TILE_LABEL[`p${i}`] = { top: String(i), bottom: "筒", color: "text-sky-700", name: `${i} Bulat` };
}
Object.assign(TILE_LABEL, {
  wE: { top: "東", bottom: "E", color: "text-slate-800", name: "Angin Timur" },
  wS: { top: "南", bottom: "S", color: "text-slate-800", name: "Angin Selatan" },
  wW: { top: "西", bottom: "W", color: "text-slate-800", name: "Angin Barat" },
  wN: { top: "北", bottom: "N", color: "text-slate-800", name: "Angin Utara" },
  dR: { top: "中", bottom: "Red", color: "text-red-600", name: "Naga Merah" },
  dG: { top: "發", bottom: "Green", color: "text-emerald-700", name: "Naga Hijau" },
  dW: { top: "白", bottom: "White", color: "text-sky-700", name: "Naga Putih" },
  f1: { top: "梅", bottom: "1", color: "text-rose-600", name: "Bunga Plum" },
  f2: { top: "蘭", bottom: "2", color: "text-rose-600", name: "Bunga Anggrek" },
  f3: { top: "菊", bottom: "3", color: "text-rose-600", name: "Bunga Krisan" },
  f4: { top: "竹", bottom: "4", color: "text-rose-600", name: "Bunga Bambu" },
  x1: { top: "春", bottom: "1", color: "text-amber-600", name: "Musim Semi" },
  x2: { top: "夏", bottom: "2", color: "text-amber-600", name: "Musim Panas" },
  x3: { top: "秋", bottom: "3", color: "text-amber-600", name: "Musim Gugur" },
  x4: { top: "冬", bottom: "4", color: "text-amber-600", name: "Musim Dingin" },
});

const idx = (code: string) => ALL_TILES.indexOf(code);
const isHonor = (i: number) => i >= 27;
const isTerminal = (i: number) => i < 27 && (i % 9 === 0 || i % 9 === 8);
const suitOf = (i: number) => (i < 27 ? Math.floor(i / 9) : -1);
const WIND_IDX = [27, 28, 29, 30];
const DRAGON_IDX = [31, 32, 33];

type Meld = { type: "pong" | "chow"; tile: number };
type Decomp = { pair: number; melds: Meld[] };

function decompose(counts: number[]): Decomp[] {
  const out: Decomp[] = [];
  for (let p = 0; p < 34; p++) {
    if (counts[p] < 2) continue;
    const c = counts.slice();
    c[p] -= 2;
    const res: Meld[][] = [];
    search(c, [], res);
    for (const melds of res) out.push({ pair: p, melds });
  }
  return out;
}

function search(c: number[], acc: Meld[], res: Meld[][]) {
  const i = c.findIndex((v) => v > 0);
  if (i === -1) {
    res.push(acc.slice());
    return;
  }
  if (c[i] >= 3) {
    c[i] -= 3;
    acc.push({ type: "pong", tile: i });
    search(c, acc, res);
    acc.pop();
    c[i] += 3;
  }
  if (!isHonor(i) && i % 9 <= 6 && c[i + 1] > 0 && c[i + 2] > 0) {
    c[i]--; c[i + 1]--; c[i + 2]--;
    acc.push({ type: "chow", tile: i });
    search(c, acc, res);
    acc.pop();
    c[i]++; c[i + 1]++; c[i + 2]++;
  }
}

function limitOfEarly(key: string, rules: Ruleset, pat: (k: string, t?: number) => { key: string; faan: number } | null) {
  const p = pat(key);
  return p ? [{ key, faan: Math.min(p.faan, rules.maxFaan) }] : null;
}

export type EvalResult = {
  valid: boolean;
  message: string;
  patterns: { key: string; faan: number }[];
  total: number;
  kongs: string[];
  physicalTiles: number;
};

export function evaluateHand(input: {
  tiles: string[];
  flowers: string[];
  selfDraw: boolean;
  concealed: boolean;
  seatWind: number;
  roundWind: number;
  rules: Ruleset;
  isDealer?: boolean;
}): EvalResult {
  const { tiles, flowers, selfDraw, concealed, seatWind, roundWind, rules, isDealer } = input;
  const meldCount = 4; // semua varian menang: 4 set + 1 pasang = 14 + jumlah kong (maks 18)
  const fail = (message: string): EvalResult => ({ valid: false, message, patterns: [], total: 0, kongs: [], physicalTiles: tiles.length });
  // Physical tiles: each kong contributes its 4th copy, so a winning hand is 14 + kongs (max 18).
  const counts = new Array(34).fill(0);
  for (const t of tiles) {
    const i = idx(t);
    if (i < 0) return fail("Ada tile yang tidak dikenal.");
    counts[i]++;
    if (counts[i] > 4) return fail("Ada lebih dari 4 tile yang sama.");
  }
  const kongs: string[] = [];
  const work = counts.slice();
  for (let i = 0; i < 34; i++) {
    if (work[i] === 4) { kongs.push(ALL_TILES[i]); work[i] = 3; }
    else if (work[i] > 4) return fail("Ada lebih dari 4 tile yang sama.");
  }
  const baseTiles = meldCount * 3 + 2;
  if (tiles.length !== baseTiles + kongs.length) {
    return fail(
      kongs.length
        ? `Butuh ${baseTiles + kongs.length} tile (${baseTiles} + ${kongs.length} kong). Sekarang ${tiles.length}.`
        : `Butuh ${baseTiles} tile. Sekarang ${tiles.length}. Kong dihitung 4 tile.`,
    );
  }
  if (kongs.length > 0 && work.filter((c) => c === 2).length === 7) return fail("Kong tidak boleh dipakai pada Seven Pairs.");


  const pat = (key: string, times = 1) => {
    const s = rules.patterns[key];
    if (!s || !s.enabled) return null;
    return { key, faan: s.faan * times };
  };

  // bonus (non hand) faan
  const bonus: { key: string; faan: number }[] = [];
  const pushIf = (p: { key: string; faan: number } | null) => p && p.faan > 0 && bonus.push(p);
  if (selfDraw) pushIf(pat("self_pick"));
  if (concealed && (rules.preset === "taiwan" || !selfDraw)) pushIf(pat("concealed"));
  if (rules.preset === "taiwan" && isDealer) pushIf(pat("dealer"));
  // --- Flowers (FIXED): a completed set of 4 flowers / 4 seasons scores Flower Set
  // and REPLACES the seat flower contained in that set — never both for the same tile.
  const flowerComplete = FLOWER_CODES.every((f) => flowers.includes(f));
  const seasonComplete = SEASON_CODES.every((f) => flowers.includes(f));
  if (flowers.length === 0) pushIf(pat("no_flowers"));
  else {
    const seatNo = String(seatWind + 1);
    const inCompletedSet = (f: string) =>
      (f.startsWith("f") && flowerComplete) || (f.startsWith("x") && seasonComplete);
    const seatFlowers = flowers.filter((f) => f.endsWith(seatNo) && !inCompletedSet(f)).length;
    if (seatFlowers) pushIf(pat("seat_flower", seatFlowers));
    const sets = (flowerComplete ? 1 : 0) + (seasonComplete ? 1 : 0);
    if (sets) pushIf(pat("flower_set", sets));
  }
  // Instant flower wins (checked before hand shape)
  if (flowers.length >= 8) {
    const l = limitOfEarly("eight_flowers", rules, pat);
    if (l) return { valid: true, message: "八仙過海 — 8 bunga/musim, menang instan.", patterns: l, total: Math.min(l[0].faan, rules.maxFaan), kongs, physicalTiles: tiles.length };
  } else if (flowers.length === 7) {
    const l = limitOfEarly("flower_hand", rules, pat);
    if (l) return { valid: true, message: "花糊 — 7 bunga/musim, menang instan.", patterns: l, total: Math.min(l[0].faan, rules.maxFaan), kongs, physicalTiles: tiles.length };
  }

  const present = work.map((c, i) => (c > 0 ? i : -1)).filter((i) => i >= 0);
  const suits = new Set(present.filter((i) => !isHonor(i)).map(suitOf));
  const hasHonor = present.some(isHonor);
  const candidates: { key: string; faan: number }[][] = [];

  const limitOf = (key: string) => {
    const p = pat(key);
    return p ? [{ key, faan: Math.min(p.faan, rules.maxFaan) }] : null;
  };

  // Thirteen orphans
  const orphanIdx = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  if (orphanIdx.every((i) => work[i] >= 1) && present.every((i) => orphanIdx.includes(i))) {
    const l = limitOf("thirteen_orphans");
    if (l) candidates.push(l);
  }

  // Seven pairs (14-tile games only)
  if (work.filter((c) => c === 2).length === 7) {
    const list: { key: string; faan: number }[] = [];
    const sp = pat("seven_pairs");
    if (sp) list.push(sp);
    if (suits.size === 1 && !hasHonor) { const p = pat("all_one_suit"); if (p) list.push(p); }
    if (suits.size === 1 && hasHonor) { const p = pat("mixed_one_suit"); if (p) list.push(p); }
    if (suits.size === 0) { const l = limitOf("all_honors"); if (l) candidates.push(l); }
    if (list.length) candidates.push(list);
  }

  // Nine gates
  if (suits.size === 1 && !hasHonor && concealed) {
    const s = [...suits][0];
    const req = [3, 1, 1, 1, 1, 1, 1, 1, 3];
    const ok = req.every((r, k) => work[s * 9 + k] >= r);
    if (ok) { const l = limitOf("nine_gates"); if (l) candidates.push(l); }
  }

  for (const d of decompose(work)) {
    if (d.melds.length !== meldCount) continue;
    const pongs = d.melds.filter((m) => m.type === "pong");
    const chows = d.melds.filter((m) => m.type === "chow");
    const list: { key: string; faan: number }[] = [];
    const add = (p: { key: string; faan: number } | null) => p && list.push(p);
    const allIdx = present;

    // limits
    if (allIdx.every(isHonor)) { const l = limitOf("all_honors"); if (l) { candidates.push(l); continue; } }
    if (allIdx.every(isTerminal)) { const l = limitOf("pure_orphans"); if (l) { candidates.push(l); continue; } }
    const windPongs = pongs.filter((m) => WIND_IDX.includes(m.tile)).length;
    if (windPongs === meldCount && meldCount >= 4) { const l = limitOf("great_winds"); if (l) { candidates.push(l); continue; } }

    const isSmallWinds = windPongs === 3 && WIND_IDX.includes(d.pair);
    const isMixedOrphans = allIdx.every((i) => isHonor(i) || isTerminal(i)) && hasHonor && allIdx.some(isTerminal);
    const mixedVal = rules.patterns["mixed_orphans"]?.faan ?? 0;

    if (chows.length === meldCount) add(pat("common_hand"));
    // Mixed Terminals (混么九) at 4 already INCLUDES All Pungs — never add both
    if (pongs.length === meldCount && !(isMixedOrphans && mixedVal >= 4)) add(pat("all_triplets"));
    if (suits.size === 1 && !hasHonor) add(pat("all_one_suit"));
    // Half Flush is INCLUDED in Small Winds — never add both
    if (suits.size === 1 && hasHonor && !isSmallWinds) add(pat("mixed_one_suit"));
    if (isMixedOrphans) add(pat("mixed_orphans"));

    const dragonPongs = pongs.filter((m) => DRAGON_IDX.includes(m.tile)).length;
    if (dragonPongs === 3) add(pat("great_dragons"));
    else if (dragonPongs === 2 && DRAGON_IDX.includes(d.pair)) add(pat("small_dragons"));
    else if (dragonPongs > 0) add(pat("dragon_pong", dragonPongs));

    if (isSmallWinds) {
      add(pat("small_winds"));
      // seat / prevailing wind pungs may still be added on top of Small Winds
      if (pongs.some((m) => m.tile === 27 + seatWind)) add(pat("seat_wind"));
      if (pongs.some((m) => m.tile === 27 + roundWind)) add(pat("round_wind"));
    } else {
      if (pongs.some((m) => m.tile === 27 + seatWind)) add(pat("seat_wind"));
      if (pongs.some((m) => m.tile === 27 + roundWind)) add(pat("round_wind"));
    }
    // Chicken Hand: a valid hand with no scoring pattern (Basic mode)
    const handOnly = list.filter((x) => x.faan > 0);
    if (handOnly.length === 0) {
      const ch = pat("chicken_hand");
      if (ch) list.push(ch);
    }
    candidates.push(list);
  }

  if (candidates.length === 0) {
    return { valid: false, message: "Susunan ubin belum menjadi tangan menang (set + pasang).", patterns: [], total: 0, kongs, physicalTiles: tiles.length };
  }

  let best: { key: string; faan: number }[] = [];
  let bestTotal = -1;
  for (const c of candidates) {
    const isLimit = c.length === 1 && ["thirteen_orphans", "nine_gates", "all_honors", "pure_orphans", "great_winds"].includes(c[0].key);
    const full = isLimit ? c : [...c, ...bonus];
    const total = full.reduce((a, b) => a + b.faan, 0);
    if (total > bestTotal) { bestTotal = total; best = full; }
  }
  const total = Math.min(bestTotal, rules.maxFaan);
  const unitName = rules.preset === "taiwan" ? "tai" : "faan";
  return { valid: true, message: total >= rules.minFaan ? "Susunan sah — tangan menang." : `Di bawah minimum ${rules.minFaan} ${unitName}.`, patterns: best, total, kongs, physicalTiles: tiles.length };
}
