import "server-only";
import { and, asc, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import { rounds, venueTables, venues } from "@/db/schema";
import type { Round, RoundDetails, Venue } from "@/db/schema";
type GameTable = typeof venueTables.$inferSelect;
import { computeDeltas, deriveState, normalizeRules, rulesForGameType, type GameType, type Ruleset } from "./rules";
import type { SeatPlayer } from "@/db/schema";
import { buildLeaderboard, ensureSeed, jsonError, periodRange, tableSecret } from "./server";

export type VenueFull = Venue & { rules: Ruleset };

export function publicVenue(v: VenueFull) {
  return {
    id: v.id, slug: v.slug, name: v.name, shortName: v.shortName, logoText: v.logoText, logoSubText: v.logoSubText,
    logoUrl: v.logoUrl, social: v.social, primaryColor: v.primaryColor, accentColor: v.accentColor,
    surfaceMode: v.surfaceMode, radiusMode: v.radiusMode, cardStyle: v.cardStyle, fontPair: v.fontPair,
    leaderboardStyle: v.leaderboardStyle, tagline: v.tagline, address: v.address, rules: v.rules,
    defaultGameType: v.defaultGameType, defaultStartingPoints: v.defaultStartingPoints, defaultPayRule: v.defaultPayRule,
    playerSelfOpen: v.playerSelfOpen,
  };
}

export function roundView(r: Round) {
  return { id: r.id, method: r.method, winnerSeat: r.winnerSeat, discarderSeat: r.discarderSeat, faan: r.faan, details: r.details, deltas: r.deltas, players: r.players, createdAt: r.createdAt.toISOString() };
}

export function tableSnapshot(t: GameTable, list: Round[]) {
  const totals = [0, 1, 2, 3].map((s) => Math.round((t.startingPoints + list.reduce((a, r) => a + (r.deltas[s] ?? 0), 0)) * 100) / 100);
  return {
    id: t.id, label: t.label, area: t.area, secret: t.secret, gameType: t.gameType, status: t.status,
    players: t.players, startingPoints: t.startingPoints, payRule: t.payRule, totals, state: deriveState(list),
    roundCount: list.length, rounds: list.map(roundView), updatedAt: t.updatedAt.toISOString(), active: t.active,
  };
}

export function rulesOf(v: VenueFull, gameType: GameType): Ruleset {
  return rulesForGameType(v.rules, gameType);
}

export function publicTable(t: GameTable) {
  return { id: t.id, label: t.label, area: t.area, secret: t.secret, gameType: t.gameType, active: t.active, status: t.status, sortOrder: t.sortOrder, startingPoints: t.startingPoints, payRule: t.payRule };
}

export async function getVenueById(id: number): Promise<VenueFull | null> {
  const [v] = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
  return v ? { ...v, rules: normalizeRules(v.rules) } : null;
}

/** Player loader: alamat rahasia */
export async function loadTableBySecret(secret: string) {
  await ensureSeed();
  const rows = await db
    .select({ table: venueTables, venue: venues })
    .from(venueTables)
    .innerJoin(venues, eq(venues.id, venueTables.venueId))
    .where(eq(venueTables.secret, secret.trim()))
    .limit(1);
  if (!rows[0]) return { error: jsonError("Meja tidak ditemukan. Scan ulang QR-nya.", 404) } as const;
  const venue = { ...rows[0].venue, rules: normalizeRules(rows[0].venue.rules) } as VenueFull;
  const table = rows[0].table;
  const list = await tableRounds(table.id, table.session);
  return { venue, table, list } as const;
}

export async function tableRounds(tableId: number, session: number) {
  return db
    .select()
    .from(rounds)
    .where(and(eq(rounds.tableId, tableId), eq(rounds.session, session)))
    .orderBy(asc(rounds.createdAt), asc(rounds.id));
}

export async function tableFloor(venueId: number) {
  const tables = await db
    .select()
    .from(venueTables)
    .where(and(eq(venueTables.venueId, venueId), eq(venueTables.active, true)))
    .orderBy(asc(venueTables.sortOrder), asc(venueTables.id));
  const ids = tables.map((t) => t.id);
  const list = ids.length ? await db.select().from(rounds).where(inArray(rounds.tableId, ids)).orderBy(asc(rounds.createdAt), asc(rounds.id)) : [];
  return { tables, rounds: list };
}

export async function venueOverview(venue: VenueFull, period: string, gameType: string) {
  const { tables, rounds: all } = await tableFloor(venue.id);
  const live = tables.filter((t) => t.active).map((t) => {
    const snap = tableSnapshot(t, all.filter((r) => r.tableId === t.id && r.session === t.session));
    return { ...snap, rounds: snap.rounds.slice(-6) };
  });
  const { start, end } = periodRange(period);
  let board = all;
  if (gameType && gameType !== "all") board = board.filter((r) => live.some((t) => t.id === r.tableId && t.gameType === gameType));
  if (start) board = board.filter((r) => r.createdAt >= start);
  if (end) board = board.filter((r) => r.createdAt < end);
  return { venue: publicVenue(venue), tables: live, board: buildLeaderboard(board), period };
}

export async function finishedSessions(venueId: number, period: string) {
  const { start, end } = periodRange(period);
  const tables = await db.select().from(venueTables).where(eq(venueTables.venueId, venueId));
  const ids = tables.map((t) => t.id);
  let list = ids.length ? await db.select().from(rounds).where(inArray(rounds.tableId, ids)).orderBy(asc(rounds.createdAt), asc(rounds.id)) : [];
  if (start) list = list.filter((r) => r.createdAt >= start);
  if (end) list = list.filter((r) => r.createdAt < end);
  return tables
    .filter((t) => t.status === "finished")
    .map((t) => {
      const rs = list.filter((r) => r.tableId === t.id && r.session === t.session);
      return { table: t, rounds: rs };
    })
    .filter((x) => x.rounds.length > 0)
    .sort((a, b) => (b.table.updatedAt?.getTime() ?? 0) - (a.table.updatedAt?.getTime() ?? 0));
}

export type RoundInput = { method: "discard" | "selfdraw" | "draw"; winnerSeat: number | null; discarderSeat: number | null; faan: number; details: RoundDetails };

const TILE_RE = /^([msp][1-9]|w[ESWN]|d[RGW]|[fx][1-4])$/;

export function validateRound(body: unknown, rules: Ruleset): { error: string } | { value: RoundInput } {
  const b = (body ?? {}) as Record<string, unknown>;
  const method = b.method;
  if (method !== "discard" && method !== "selfdraw" && method !== "draw") return { error: "Hasil hand tidak valid." };
  const seat = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 3 ? v : null);
  const winnerSeat = method === "draw" ? null : seat(b.winnerSeat);
  const discarderSeat = method === "discard" ? seat(b.discarderSeat) : null;
  if (method !== "draw" && winnerSeat === null) return { error: "Pilih pemenang." };
  if (method === "discard" && (discarderSeat === null || discarderSeat === winnerSeat)) return { error: "Pilih pemain yang membuang tile (bukan pemenang)." };

  const d0 = (b.details ?? {}) as Partial<RoundDetails>;
  const hasTiles = Array.isArray(d0.tiles) && d0.tiles.length > 0;

  let faan = method === "draw" ? 0 : Number(b.faan);
  if (!Number.isFinite(faan) || faan < 0) return { error: "Jumlah faan tidak valid." };
  faan = Math.floor(faan);
  if (method !== "draw" && !hasTiles && faan < rules.minFaan)
    return { error: `Minimal ${rules.minFaan} ${rules.preset === "taiwan" ? "tai" : "faan"} untuk menang (aturan meja).` };

  const patterns = Array.isArray(d0.patterns)
    ? d0.patterns.filter((p) => p && typeof p.key === "string" && Number.isFinite(Number(p.faan))).slice(0, 30).map((p) => ({ key: String(p.key).slice(0, 40), faan: Math.max(0, Math.floor(Number(p.faan))) }))
    : [];
  const strArr = (a: unknown) => (Array.isArray(a) ? a.filter((x): x is string => typeof x === "string" && TILE_RE.test(x)).slice(0, 22) : undefined);
  const details: RoundDetails = {
    mode: d0.mode === "tiles" ? "tiles" : "manual",
    patterns: method === "draw" ? [] : patterns,
    tiles: d0.mode === "tiles" ? strArr(d0.tiles) : undefined,
    flowers: d0.mode === "tiles" ? strArr(d0.flowers) : undefined,
    note: typeof d0.note === "string" && d0.note.trim() ? d0.note.trim().slice(0, 200) : undefined,
  };
  return { value: { method, winnerSeat, discarderSeat, faan: Math.min(faan, rules.maxFaan), details } };
}

export function deltasFor(v: RoundInput, rules: Ruleset, payRule: "half" | "full") {
  return computeDeltas({ method: v.method, winner: v.winnerSeat, discarder: v.discarderSeat, faan: v.faan, rules, payRule });
}
