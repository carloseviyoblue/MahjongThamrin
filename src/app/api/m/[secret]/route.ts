import { desc, eq, and } from "drizzle-orm";
import { db } from "@/db";
import { venueTables } from "@/db/schema";
import { loadTableBySecret, publicVenue, rulesOf, tableSnapshot } from "@/lib/game";
import { cleanPlayers } from "@/lib/players";
import { getCurrentUser, jsonError, readJson } from "@/lib/server";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ secret: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { secret } = await ctx.params;
  const res = await loadTableBySecret(secret);
  if ("error" in res) return res.error;
  const { venue, table, list } = res;
  const user = await getCurrentUser();
  return Response.json({
    table: tableSnapshot(table, list),
    venue: publicVenue(venue),
    rules: rulesOf(venue, table.gameType),
    isStaff: !!user && user.venue.id === venue.id,
    lastFinished: table.finalTotals ? { totals: table.finalTotals, players: table.players, endedAt: table.updatedAt.toISOString() } : null,
  });
}

export async function PUT(req: Request, ctx: Ctx) {
  const { secret } = await ctx.params;
  const res = await loadTableBySecret(secret);
  if ("error" in res) return res.error;
  const { venue, table } = res;
  if (table.status === "finished") return jsonError("Meja sudah selesai. Minta staf membuka meja baru.", 409);
  const user = await getCurrentUser();
  const isStaff = !!user && user.venue.id === venue.id;
  if (!venue.playerSelfOpen && !isStaff) return jsonError("Venue ini mewajibkan pendaftaran pemain oleh staf. Minta kasir membuka mejamu.", 403);
  const body = await readJson<{ players?: unknown }>(req);
  const p = await cleanPlayers(venue.id, body?.players);
  if ("error" in p) return jsonError(p.error);
  await db.update(venueTables).set({ players: p.value, status: "playing", updatedAt: new Date() }).where(eq(venueTables.id, table.id));
  return Response.json({ ok: true });
}

export async function POST(req: Request, ctx: Ctx) {
  const { secret } = await ctx.params;
  const res = await loadTableBySecret(secret);
  if ("error" in res) return res.error;
  const { venue, table, list } = res;
  const body = await readJson<{ action?: string }>(req);
  const user = await getCurrentUser();
  const isStaff = !!user && user.venue.id === venue.id;
  if (body?.action === "new") {
    if (!isStaff) return jsonError("Hanya staf yang bisa membuat meja baru. Minta kasir.", 403);
    if (table.status !== "finished") return jsonError("Meja belum selesai.", 409);
    await db.update(venueTables).set({ session: table.session + 1, players: [], status: "open", finalTotals: null, updatedAt: new Date() }).where(eq(venueTables.id, table.id));
    return Response.json({ ok: true });
  }
  if (body?.action === "finish") {
    if (table.status !== "playing") return jsonError("Meja belum dibuka.", 409);
    const s = tableSnapshot(table, list);
    await db.update(venueTables).set({ status: "finished", finalTotals: s.totals, updatedAt: new Date() }).where(eq(venueTables.id, table.id));
    return Response.json({ ok: true, totals: s.totals });
  }
  return jsonError("Aksi tidak dikenal.");
}

/** Owner can rotate the secret if a QR leaks */
export async function PATCH(_req: Request, ctx: Ctx) {
  const { secret } = await ctx.params;
  const res = await loadTableBySecret(secret);
  if ("error" in res) return res.error;
  const user = await getCurrentUser();
  if (!user || user.venue.id !== res.venue.id) return jsonError("Tidak diizinkan.", 403);
  const { tableSecret } = await import("@/lib/server");
  const next = tableSecret();
  await db.update(venueTables).set({ secret: next }).where(and(eq(venueTables.id, res.table.id)));
  void desc;
  return Response.json({ ok: true, secret: next });
}
