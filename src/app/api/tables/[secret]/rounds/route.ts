import { eq } from "drizzle-orm";
import { db } from "@/db";
import { rounds, venueTables } from "@/db/schema";
import { deltasFor, loadTableBySecret, rulesOf, tableSnapshot, validateRound } from "@/lib/game";
import { jsonError, readJson } from "@/lib/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ secret: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { secret } = await ctx.params;
  const res = await loadTableBySecret(secret);
  if ("error" in res) return res.error;
  const { venue, table, list } = res;
  if (table.status !== "playing" || table.players.length !== 4) return jsonError("Buka meja dan isi 4 pemain terlebih dahulu.", 409);
  const rules = rulesOf(venue, table.gameType);
  const body = await readJson<Record<string, unknown>>(req);
  const v = validateRound(body, rules);
  if ("error" in v) return jsonError(v.error);
  const d = (body?.details ?? {}) as { tiles?: unknown; flowers?: unknown; concealed?: boolean };
  if (Array.isArray(d.tiles) && d.tiles.length) {
    const { evaluateHand } = await import("@/lib/tiles");
    const st = tableSnapshot(table, list).state;
    const seat = v.value.winnerSeat ?? 0;
    const ev = evaluateHand({
      tiles: d.tiles as string[], flowers: Array.isArray(d.flowers) ? (d.flowers as string[]) : [],
      selfDraw: v.value.method === "selfdraw", concealed: !!d.concealed,
      seatWind: (seat - st.dealer + 4) % 4, roundWind: st.roundWind, rules,
    });
    if (!ev.valid) return jsonError(`Susunan ubin belum menjadi tangan menang: ${ev.message}`);
    v.value.details = { ...v.value.details, mode: "tiles", patterns: ev.patterns, tiles: d.tiles as string[], flowers: Array.isArray(d.flowers) ? (d.flowers as string[]) : undefined };
    v.value.faan = ev.total;
  }
  const [row] = await db
    .insert(rounds)
    .values({
      venueId: venue.id, tableId: table.id, session: table.session, method: v.value.method, winnerSeat: v.value.winnerSeat,
      discarderSeat: v.value.discarderSeat, faan: v.value.faan, details: v.value.details,
      deltas: deltasFor(v.value, rules, table.payRule), players: table.players,
    })
    .returning();
  await db.update(venueTables).set({ updatedAt: new Date() }).where(eq(venueTables.id, table.id));
  return Response.json({ ok: true, round: { id: row.id, deltas: row.deltas } });
}

/** EDIT FAAN — pemenang, cara menang & pembuang terkunci */
export async function PATCH(req: Request, ctx: Ctx) {
  const { secret } = await ctx.params;
  const res = await loadTableBySecret(secret);
  if ("error" in res) return res.error;
  const { venue, table, list } = res;
  if (table.status !== "playing") return jsonError("Meja sudah selesai — round terkunci.", 403);
  const body = await readJson<{ id?: unknown; faan?: unknown; patterns?: unknown }>(req);
  const round = list.find((r) => r.id === Number(body?.id));
  if (!round) return jsonError("Round tidak ditemukan.", 404);
  const rules = rulesOf(venue, table.gameType);
  const merged = { method: round.method, winnerSeat: round.winnerSeat, discarderSeat: round.discarderSeat, faan: Number(body?.faan ?? round.faan), details: { ...round.details, patterns: Array.isArray(body?.patterns) ? (body?.patterns as { key: string; faan: number }[]) : round.details.patterns } };
  const v = validateRound(merged, rules);
  if ("error" in v) return jsonError(v.error);
  await db.update(rounds).set({ faan: v.value.faan, details: v.value.details, deltas: deltasFor(v.value, rules, table.payRule) }).where(eq(rounds.id, round.id));
  await db.update(venueTables).set({ updatedAt: new Date() }).where(eq(venueTables.id, table.id));
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: Ctx) {
  const { secret } = await ctx.params;
  const res = await loadTableBySecret(secret);
  if ("error" in res) return res.error;
  const { table, list } = res;
  if (table.status !== "playing") return jsonError("Meja tidak sedang bermain.", 409);
  const last = list[list.length - 1];
  if (!last) return jsonError("Belum ada round untuk di-undo.");
  // Undo-only rule: a hand in the middle of history cannot be deleted.
  const body = await readJson<{ id?: unknown }>(req);
  if (body?.id !== undefined && Number(body.id) !== last.id) {
    return jsonError("Hand lama tidak bisa dihapus. Gunakan Undo untuk hand terakhir.", 409);
  }
  await db.delete(rounds).where(eq(rounds.id, last.id));
  await db.update(venueTables).set({ updatedAt: new Date() }).where(eq(venueTables.id, table.id));
  return Response.json({ ok: true, removedId: last.id });
}
