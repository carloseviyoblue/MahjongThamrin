import "server-only";
import { cookies, headers } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { and, asc, desc, eq, gt, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/db";
import {
  authSessions,
  members,
  rounds,
  users,
  venueTables,
  venues,
  type Round,
  type SeatPlayer,
} from "@/db/schema";
import { computeDeltas, defaultRuleset, normalizeRules, type GameType } from "./rules";

export const SESSION_COOKIE = "wm_session";

// ---------------- Password & session
export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(pw, salt, 64).toString("hex")}`;
}

export function verifyPassword(pw: string, stored: string) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(pw, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSession(userId: number) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  await db.insert(authSessions).values({ id, userId, expiresAt });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (id) await db.delete(authSessions).where(eq(authSessions.id, id));
  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const rows = await db
    .select({ user: users, venue: venues })
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .innerJoin(venues, eq(venues.id, users.venueId))
    .where(and(eq(authSessions.id, id), gt(authSessions.expiresAt, new Date())))
    .limit(1);
  const row = rows[0];
  if (!row || !row.user.active) return null;
  return { user: row.user, venue: { ...row.venue, rules: normalizeRules(row.venue.rules) } };
}

export type AuthCtx = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser(ownerOnly = false): Promise<AuthCtx | Response> {
  const ctx = await getCurrentUser();
  if (!ctx) return jsonError("Sesi berakhir, silakan masuk lagi.", 401);
  if (ownerOnly && ctx.user.role !== "owner")
    return jsonError("Hanya owner yang dapat melakukan aksi ini.", 403);
  return ctx;
}

export function jsonError(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return Response.json({ error: message, ...extra }, { status });
}

export async function readJson<T = Record<string, unknown>>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export async function siteOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto.split(",")[0]}://${host.split(",")[0]}`;
}

// ---------------- Phone normalization & masking
export function normalizePhone(raw: string): string | null {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  if (!d.startsWith("62")) return null;
  if (d.length < 10 || d.length > 15) return null;
  return d;
}

export function maskPhone(p: string) {
  if (!p) return "";
  const local = p.startsWith("62") ? "0" + p.slice(2) : p;
  return local.slice(0, 4) + "****" + local.slice(-3);
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Unpredictable path segment so a player cannot guess another table's URL */
export function tableSecret() {
  return randomBytes(12).toString("base64url").replace(/[-_]/g, "").slice(0, 14);
}
export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

// ---------------- Leaderboard builder
export type LeaderRow = {
  key: string;
  name: string;
  memberId: number | null;
  points: number;
  games: number;
  rounds: number;
  wins: number;
  maxFaan: number;
};

export function buildLeaderboard(list: Round[]): LeaderRow[] {
  const map = new Map<string, LeaderRow & { tableSet: Set<number> }>();
  for (const r of list) {
    r.players.forEach((p, seat) => {
      if (!p?.name) return;
      const key = p.memberId ? `m${p.memberId}` : `g:${p.name.trim().toLowerCase()}`;
      let row = map.get(key);
      if (!row) {
        row = {
          key,
          name: p.name.trim(),
          memberId: p.memberId,
          points: 0,
          games: 0,
          rounds: 0,
          wins: 0,
          maxFaan: 0,
          tableSet: new Set(),
        };
        map.set(key, row);
      }
      row.points += r.deltas[seat] ?? 0;
      row.rounds++;
      row.tableSet.add(r.tableId);
      if (r.winnerSeat === seat && r.method !== "draw") {
        row.wins++;
        row.maxFaan = Math.max(row.maxFaan, r.faan);
      }
    });
  }
  return [...map.values()]
    .map(({ tableSet, ...rest }) => ({
      ...rest,
      games: tableSet.size,
      points: Math.round(rest.points * 100) / 100,
    }))
    .sort((a, b) => b.points - a.points || b.wins - a.wins);
}

export function periodRange(period: string): { start: Date | null; end: Date | null } {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));

  if (period === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return { start: d, end: null };
  }
  if (period === "week") return { start: weekStart, end: null };
  if (period === "lastweek") {
    const s = new Date(weekStart);
    s.setDate(s.getDate() - 7);
    return { start: s, end: weekStart };
  }
  if (period === "month") return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: null };
  if (period === "lastmonth") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 1),
    };
  }
  return { start: null, end: null };
}

export async function venueLeaderboard(venueId: number, period: string, gameType?: string) {
  const { start, end } = periodRange(period);
  let list = await db.select().from(rounds).where(eq(rounds.venueId, venueId));
  if (gameType && gameType !== "all") {
    const tables = await db.select({ id: venueTables.id, gameType: venueTables.gameType }).from(venueTables).where(eq(venueTables.venueId, venueId));
    const ids = new Set(tables.filter((t) => t.gameType === gameType).map((t) => t.id));
    list = list.filter((r) => ids.has(r.tableId));
  }
  if (start) list = list.filter((r) => r.createdAt >= start);
  if (end) list = list.filter((r) => r.createdAt < end);
  return buildLeaderboard(list);
}

// ---------------- Seed demo data (Lotus Mahjong Club)
let seeded: Promise<void> | null = null;
export function ensureSeed() {
  if (!seeded) {
    seeded = runSeed().catch((e) => {
      seeded = null;
      console.error("seed failed", e);
    });
  }
  return seeded;
}

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function runSeed() {
  const any = await db.select({ id: venues.id }).from(venues).limit(1);
  if (any.length) return;
  const rules = defaultRuleset("classic");
  const [venue] = await db
    .insert(venues)
    .values({
      slug: "lotus", name: "Lotus Mahjong Club", shortName: "Lotus", logoText: "麻", logoSubText: "中",
      social: "@lotusmahjong", primaryColor: "#0f5132", accentColor: "#d4a73d",
      tagline: "Klub Mahjong Hong Kong", address: "Jl. Mangga Besar Raya No. 88, Jakarta",
      rules, defaultGameType: "classic", defaultStartingPoints: 1000, defaultPayRule: "half", playerSelfOpen: true,
    })
    .onConflictDoNothing()
    .returning();
  if (!venue) return;
  await db.insert(users).values([
    { venueId: venue.id, name: "Admin Naga", username: "lotus", passwordHash: hashPassword("lotus123"), role: "owner" },
    { venueId: venue.id, name: "Stephanie", username: "stephanie", passwordHash: hashPassword("staff123"), role: "staff" },
  ]);
  const names: [string, string][] = [
    ["Rudy Hartono", "082133015488"], ["Cindy Tan", "081511237788"], ["Hendra Kusuma", "087812349002"], ["Wati Lestari", "081377712190"],
    ["Budi Santoso", "081234561548"], ["Kevin Wijaya", "085611451688"], ["Lina Hartono", "081288824326"], ["Citra Dewi", "081944571130"],
    ["Agus Salim", "081320032291"], ["Andre Gunawan", "082123222115"], ["Fajar Nugroho", "081399887766"], ["Maya Sari", "085722334455"],
  ];
  const mem = await db.insert(members).values(names.map(([name, phone]) => ({ venueId: venue.id, name, phone: normalizePhone(phone)! }))).returning();
  const rnd = mulberry32(7788);
  const now = Date.now();
  const tdefs: { label: string; area: string; gameType: GameType; playing: boolean }[] = [
    { label: "Meja 1", area: "Lantai 1", gameType: "classic", playing: true },
    { label: "Meja 2", area: "Lantai 1", gameType: "classic", playing: true },
    { label: "Meja 3", area: "Lantai 1", gameType: "new18", playing: false },
    { label: "Meja 4", area: "Lantai 2", gameType: "new18", playing: false },
    { label: "VIP 1", area: "Ruang VIP", gameType: "taiwan", playing: true },
    { label: "VIP 2", area: "Ruang VIP", gameType: "basic", playing: false },
  ];
  for (let i = 0; i < tdefs.length; i++) {
    const d = tdefs[i];
    const trules = defaultRuleset(d.gameType);
    const pool = [...mem].sort(() => rnd() - 0.5).slice(0, 4);
    const players: SeatPlayer[] = d.playing ? pool.map((m) => ({ name: m.name.split(" ")[0], memberId: m.id })) : [];
    const [table] = await db.insert(venueTables).values({
      venueId: venue.id, label: d.label, area: d.area, secret: tableSecret(), gameType: d.gameType,
      startingPoints: 1000, payRule: "half", status: d.playing ? "playing" : "open", players, sortOrder: i,
    }).returning();
    if (!d.playing) continue;
    const count = d.gameType === "basic" ? 4 : 7 + Math.floor(rnd() * 4);
    const vals = [];
    for (let k = 0; k < count; k++) {
      const roll = rnd();
      const method = (roll < 0.08 ? "draw" : roll < 0.4 ? "selfdraw" : "discard") as "draw" | "selfdraw" | "discard";
      const winner = method === "draw" ? null : Math.floor(rnd() * 4);
      const discarder = method === "discard" && winner !== null ? (winner + 1 + Math.floor(rnd() * 3)) % 4 : null;
      const faan = method === "draw" ? 0 : trules.minFaan + Math.floor(Math.pow(rnd(), 1.6) * (trules.maxFaan - trules.minFaan + 1) * 0.5);
      vals.push({
        venueId: venue.id, tableId: table.id, session: 1, method, winnerSeat: winner, discarderSeat: discarder, faan,
        details: { patterns: method === "draw" ? [] : [{ key: faan >= 7 ? "all_one_suit" : faan >= 4 ? "mixed_one_suit" : "common_hand", faan: Math.max(1, Math.min(faan, 3)) }], mode: "manual" as const },
        deltas: computeDeltas({ method, winner, discarder, faan, rules: trules, payRule: "half" }),
        players, createdAt: new Date(now - (count - k) * 9 * 60000),
      });
    }
    if (vals.length) await db.insert(rounds).values(vals);
  }
}
