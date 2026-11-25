// Core Hong Kong Mahjong rules, presets & scoring math.

import { PATTERNS, PATTERN_MAP, type PatternDef } from "./patterns";

export { PATTERNS, PATTERN_MAP } from "./patterns";
export type { PatternCategory, PatternDef } from "./patterns";

export type GameType = "classic" | "new18" | "taiwan" | "basic";

export const GAME_TYPES: GameType[] = ["classic", "new18", "taiwan", "basic"];

export const GAME_TYPE_META: Record<GameType, { label: string; short: string; zh: string; unit: string; handTiles: number; desc: string }> = {
  classic: { label: "Hong Kong Classic", short: "HK Classic", zh: "港式經典", unit: "faan", handTiles: 14, desc: "13 tile + ambil 1 (4 set + 1 pasang). Minimum 3 faan, batas 10 faan." },
  new18: { label: "Hong Kong New 18", short: "HK New 18", zh: "新章十八番", unit: "faan", handTiles: 14, desc: "Aturan 新章 modern sesuai tabel mahjonggame.hk. Minimum 3 faan, batas 13 faan." },
  taiwan: { label: "Taiwan 16 Tile", short: "Taiwan", zh: "台灣十六張", unit: "tai", handTiles: 17, desc: "16 tile + ambil 1 (5 set + 1 pasang), dihitung dengan 台 (tai)." },
  basic: { label: "Basic / Chicken Hand", short: "Basic 雞糊", zh: "雞糊入門", unit: "faan", handTiles: 14, desc: "Untuk pemula: tangan apa pun boleh menang, termasuk Chicken Hand 雞糊 tanpa pola." },
};

export type PatternSetting = { enabled: boolean; faan: number };

export type Ruleset = {
  preset: GameType;
  handTiles: number;
  minFaan: number;
  maxFaan: number;
  payoutTable: "half_spicy" | "full_spicy" | "linear";
  multiplier: number;
  patterns: Record<string, PatternSetting>;
};

export const PRESET_LABEL: Record<GameType, string> = {
  classic: "HK Classic",
  new18: "HK New 18",
  taiwan: "Taiwan 16",
  basic: "Basic 雞糊",
};

export const PAYOUT_LABEL: Record<Ruleset["payoutTable"], string> = {
  half_spicy: "半辣上 Half Spicy",
  full_spicy: "全辣上 Full Spicy",
  linear: "Linear (per faan)",
};

export const PAY_RULE_LABEL: Record<"half" | "full", string> = {
  half: "半銃 · Yang buang bayar dobel",
  full: "全銃 · Yang buang bayar semua",
};

export const PAY_RULE_DESC: Record<"half" | "full", string> = {
  half: "Menang dari buangan: pembuang bayar penuh, 2 pemain lain bayar setengah. Zimo: ketiga pemain bayar penuh.",
  full: "Menang dari buangan: pembuang menanggung semua (2× nilai). Zimo: ketiga pemain bayar penuh.",
};

export function defaultPatterns(preset: GameType): Record<string, PatternSetting> {
  return Object.fromEntries(
    PATTERNS.map((p) => {
      if (preset === "taiwan") {
        return [p.key, { enabled: p.taiwan !== null && p.taiwan > 0, faan: p.taiwan ?? 0 }];
      }
      const v = preset === "new18" ? p.new18 : p.classic;
      // Chicken Hand only scores in Basic mode; in HK modes it is just "no pattern"
      const enabled = p.key === "chicken_hand" ? preset === "basic" : v > 0 || preset === "basic";
      return [p.key, { enabled, faan: v }];
    }),
  );
}

export function defaultRuleset(preset: GameType = "classic"): Ruleset {
  if (preset === "taiwan") {
    return {
      preset,
      handTiles: 14,
      minFaan: 0,
      maxFaan: 16,
      payoutTable: "linear",
      multiplier: 10,
      patterns: defaultPatterns(preset),
    };
  }
  if (preset === "basic") {
    return {
      preset,
      handTiles: 14,
      minFaan: 0,
      maxFaan: 10,
      payoutTable: "half_spicy",
      multiplier: 2,
      patterns: defaultPatterns(preset),
    };
  }
  return {
    preset,
    handTiles: 14,
    minFaan: 3,
    maxFaan: preset === "new18" ? 13 : 10,
    payoutTable: "half_spicy",
    multiplier: 2,
    patterns: defaultPatterns(preset),
  };
}

/** Effective rules for a room's game type, based on the venue's stored rules */
export function rulesForGameType(base: Ruleset | null | undefined, gameType: GameType): Ruleset {
  const normalized = normalizeRules(base ?? undefined);
  if (normalized.preset === gameType) return normalized;
  return defaultRuleset(gameType);
}

export function unitLabel(rules: Ruleset) {
  return rules.preset === "taiwan" ? "tai" : "faan";
}

export function normalizeRules(r: Partial<Ruleset> | null | undefined): Ruleset {
  const preset = (r?.preset ?? "classic") as GameType;
  const base = defaultRuleset(GAME_TYPES.includes(preset) ? preset : "classic");
  const merged: Ruleset = { ...base, ...(r ?? {}), preset: base.preset, handTiles: base.handTiles, patterns: { ...base.patterns } };
  if (r?.patterns) {
    for (const k of Object.keys(base.patterns)) {
      if (r.patterns[k]) merged.patterns[k] = { ...base.patterns[k], ...r.patterns[k] };
    }
  }
  return merged;
}

export function baseValue(faan: number, table: Ruleset["payoutTable"]): number {
  const f = Math.max(0, Math.floor(faan));
  if (table === "linear") return Math.max(1, f) * 2;
  if (table === "full_spicy") return Math.pow(2, f);
  if (f <= 4) return Math.pow(2, f);
  const steps = f - 4;
  const pairs = Math.floor(steps / 2);
  const base = 16 * Math.pow(2, pairs);
  return steps % 2 === 1 ? base * 1.5 : base;
}

export function faanValue(faan: number, rules: Ruleset): number {
  const capped = Math.min(faan, rules.maxFaan);
  if (rules.preset === "taiwan") return capped * rules.multiplier;
  return baseValue(capped, rules.payoutTable) * rules.multiplier;
}

export function computeDeltas(params: {
  method: "discard" | "selfdraw" | "draw";
  winner: number | null;
  discarder: number | null;
  faan: number;
  rules: Ruleset;
  payRule: "half" | "full";
}): number[] {
  const d = [0, 0, 0, 0];
  const { method, winner, discarder, faan, rules, payRule } = params;
  if (method === "draw" || winner === null) return d;
  const P = faanValue(faan, rules);
  if (method === "selfdraw") {
    for (let i = 0; i < 4; i++) if (i !== winner) d[i] -= P;
    d[winner] += P * 3;
    return d.map(round2);
  }
  if (discarder === null || discarder === winner) return d;
  if (payRule === "full") {
    d[discarder] -= P * 2;
    d[winner] += P * 2;
  } else {
    for (let i = 0; i < 4; i++) {
      if (i === winner) continue;
      d[i] -= i === discarder ? P : P / 2;
    }
    d[winner] += P * 2;
  }
  return d.map(round2);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export const WINDS = ["East", "South", "West", "North"] as const;
export const WINDS_ID = ["Timur", "Selatan", "Barat", "Utara"] as const;
export const WINDS_ZH = ["東", "南", "西", "北"] as const;

export type GameState = {
  dealer: number;
  roundWind: number;
  handNo: number;
  finished: boolean;
};

export function deriveState(history: { method: string; winnerSeat: number | null }[]): GameState {
  let dealer = 0;
  let roundWind = 0;
  let handNo = 1;
  let finished = false;
  for (const r of history) {
    handNo++;
    const dealerKeeps = r.method === "draw" || r.winnerSeat === dealer;
    if (!dealerKeeps) {
      dealer = (dealer + 1) % 4;
      if (dealer === 0) {
        roundWind++;
        if (roundWind > 3) {
          roundWind = 3;
          finished = true;
        }
      }
    }
  }
  return { dealer, roundWind, handNo, finished };
}

export function seatWindOf(seat: number, dealer: number) {
  return (seat - dealer + 4) % 4;
}

export function fmtPts(n: number) {
  const v = Math.round(n * 100) / 100;
  const s = Number.isInteger(v) ? v.toLocaleString("id-ID") : v.toLocaleString("id-ID", { maximumFractionDigits: 2 });
  return v > 0 ? `+${s}` : s;
}

export function payoutRows(rules: Ruleset) {
  const rows: { faan: number; discard: number; self: number }[] = [];
  for (let f = 0; f <= rules.maxFaan; f++) {
    const P = rules.preset === "taiwan" ? f * rules.multiplier : baseValue(f, rules.payoutTable) * rules.multiplier;
    rows.push({ faan: f, discard: P, self: P });
  }
  return rows;
}
