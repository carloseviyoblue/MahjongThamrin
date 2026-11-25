import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { rounds, venueTables } from "@/db/schema";
import { publicTable, tableSnapshot } from "@/lib/game";
import { jsonError, readJson, requireUser, tableSecret } from "@/lib/server";
import { GAME_TYPES, type GameType } from "@/lib/rules";

type Ctx = { params: Promise<{ id: string }> };

async function own(id: number, venueId: number) {
  const [t] = await db.select().from(venueTables).where(and(eq(venueTables.id, id), eq(venueTables.venueId, venueId))).limit(1);
  return t ?? null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  const t = await own(Number((await ctx.params).id), auth.venue.id);
  if (!t) return jsonError("Meja tidak ditemukan.", 404);
  const b = await readJson<Record<string, unknown>>(req);
  if (!b) return jsonError("Data tidak valid.");

  if (b.action === "finish" || b.action === "cancel" || b.action === "new") {
    const list = await db.select().from(rounds).where(and(eq(rounds.tableId, t.id), eq(rounds.session, t.session)));
    if (b.action === "new") {
      await db.update(venueTables).set({ session: t.session + 1, players: [], status: "open", finalTotals: null, updatedAt: new Date() }).where(eq(venueTables.id, t.id));
      return Response.json({ ok: true });
    }
    if (t.status !== "playing") return jsonError("Meja tidak sedang bermain.");
    if (b.action === "cancel") {
      await db.delete(rounds).where(and(eq(rounds.tableId, t.id), eq(rounds.session, t.session)));
      await db.update(venueTables).set({ players: [], status: "open", finalTotals: null, updatedAt: new Date() }).where(eq(venueTables.id, t.id));
      return Response.json({ ok: true, cancelled: true });
    }
    const s = tableSnapshot(t, list);
    await db.update(venueTables).set({ status: "finished", finalTotals: s.totals, updatedAt: new Date() }).where(eq(venueTables.id, t.id));
    return Response.json({ ok: true, totals: s.totals });
  }

  if (b.action === "regenerate") {
    await db.update(venueTables).set({ secret: tableSecret() }).where(eq(venueTables.id, t.id));
    return Response.json({ ok: true, secret: (await own(t.id, auth.venue.id))!.secret });
  }

  const patch: Partial<typeof venueTables.$inferInsert> = {};
  if (b.label !== undefined) {
    const label = String(b.label).trim().slice(0, 30);
    if (!label) return jsonError("Nama meja wajib diisi.");
    const [dup] = await db.select({ id: venueTables.id }).from(venueTables).where(and(eq(venueTables.venueId, auth.venue.id), eq(venueTables.label, label), ne(venueTables.id, t.id))).limit(1);
    if (dup) return jsonError("Nama meja sudah dipakai.");
    patch.label = label;
  }
  if (b.area !== undefined) patch.area = String(b.area).trim().slice(0, 30);
  if (b.gameType !== undefined) {
    if (!GAME_TYPES.includes(b.gameType as GameType)) return jsonError("Tipe permainan tidak valid.");
    patch.gameType = b.gameType as GameType;
  }
  if (b.startingPoints !== undefined) {
    const n = Number(b.startingPoints);
    if (!Number.isInteger(n) || n < 0 || n > 1_000_000) return jsonError("Poin awal 0–1.000.000.");
    patch.startingPoints = n;
  }
  if (b.payRule !== undefined) patch.payRule = b.payRule === "full" ? "full" : "half";
  if (typeof b.active === "boolean") {
    if (!b.active && t.status === "playing") return jsonError("Tutup permainan yang sedang berjalan dulu.");
    patch.active = b.active;
  }
  if (!Object.keys(patch).length) return jsonError("Tidak ada perubahan.");
  const [updated] = await db.update(venueTables).set(patch).where(eq(venueTables.id, t.id)).returning();
  return Response.json({ ok: true, table: publicTable(updated) });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  const t = await own(Number((await ctx.params).id), auth.venue.id);
  if (!t) return jsonError("Meja tidak ditemukan.", 404);
  if (t.status === "playing") return jsonError("Meja sedang dipakai. Tutup permainan dulu.");
  await db.delete(venueTables).where(eq(venueTables.id, t.id));
  return Response.json({ ok: true });
}
