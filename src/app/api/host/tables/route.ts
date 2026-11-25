import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { rounds, venueTables } from "@/db/schema";
import { publicTable, rulesOf, tableSnapshot } from "@/lib/game";
import { jsonError, readJson, requireUser, tableSecret } from "@/lib/server";
import { GAME_TYPES, type GameType } from "@/lib/rules";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  const tables = await db.select().from(venueTables).where(eq(venueTables.venueId, auth.venue.id)).orderBy(asc(venueTables.sortOrder), asc(venueTables.id));
  const ids = tables.map((t) => t.id);
  const rr = ids.length ? await db.select().from(rounds).where(inArray(rounds.tableId, ids)).orderBy(asc(rounds.createdAt), asc(rounds.id)) : [];
  const counts = ids.length ? await db.select({ tableId: rounds.tableId, n: sql<number>`count(*)::int`, last: sql<Date>`max(created_at)` }).from(rounds).where(inArray(rounds.tableId, ids)).groupBy(rounds.tableId) : [];
  return Response.json({
    tables: tables.map((t) => {
      const c = counts.find((x) => x.tableId === t.id);
      const snap = tableSnapshot(t, rr.filter((r) => r.tableId === t.id && r.session === t.session));
      return {
        ...publicTable(t), totalSessions: Number(c?.n ?? 0) > 0 ? 1 : 0, totalRounds: Number(c?.n ?? 0),
        lastActivity: c?.last ? new Date(c.last).toISOString() : null,
        rules: rulesOf(auth.venue, t.gameType),
        game: snap.status === "playing" ? { ...snap, rounds: snap.rounds.slice(-3) } : snap.status === "finished" ? { ...snap, rounds: [] } : null,
      };
    }),
  });
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  const b = await readJson<{ label?: string; area?: string; count?: number; prefix?: string; gameType?: string; startingPoints?: number; payRule?: string }>(req);
  const existing = await db.select({ label: venueTables.label, sortOrder: venueTables.sortOrder }).from(venueTables).where(eq(venueTables.venueId, auth.venue.id));
  if (existing.length >= 100) return jsonError("Maksimal 100 meja per venue.");
  const gameType = GAME_TYPES.includes(b?.gameType as GameType) ? (b?.gameType as GameType) : auth.venue.defaultGameType;
  const sp = Number(b?.startingPoints ?? auth.venue.defaultStartingPoints);
  if (!Number.isInteger(sp) || sp < 0 || sp > 1_000_000) return jsonError("Poin awal 0–1.000.000.");
  const payRule: "half" | "full" = b?.payRule === "full" ? "full" : "half";
  const area = String(b?.area ?? "").trim().slice(0, 30);
  let order = existing.reduce((a, t) => Math.max(a, t.sortOrder), -1) + 1;
  const labels: string[] = [];
  if (b?.count !== undefined) {
    const n = Number(b.count);
    if (!Number.isInteger(n) || n < 1 || n > 30) return jsonError("Jumlah meja sekaligus 1–30.");
    if (existing.length + n > 100) return jsonError("Melebihi batas 100 meja.");
    const prefix = String(b?.prefix ?? "Meja").trim().slice(0, 16) || "Meja";
    const taken = new Set(existing.map((t) => t.label.toLowerCase()));
    let i = 1;
    while (labels.length < n) { const l = `${prefix} ${i++}`; if (!taken.has(l.toLowerCase())) labels.push(l); }
  } else {
    const label = String(b?.label ?? "").trim().slice(0, 30);
    if (!label) return jsonError("Nama meja wajib diisi.");
    if (existing.some((t) => t.label.toLowerCase() === label.toLowerCase())) return jsonError("Nama meja sudah dipakai.");
    labels.push(label);
  }
  const created = await db.insert(venueTables).values(labels.map((label) => ({ venueId: auth.venue.id, label, area, secret: tableSecret(), gameType, startingPoints: sp, payRule, sortOrder: order++ }))).returning();
  return Response.json({ ok: true, tables: created.map(publicTable) });
}
