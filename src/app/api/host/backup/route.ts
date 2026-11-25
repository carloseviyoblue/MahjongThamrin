import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members, rounds, venueTables } from "@/db/schema";
import { requireUser } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireUser(true);
  if (ctx instanceof Response) return ctx;
  const format = new URL(req.url).searchParams.get("format") ?? "json";
  const vId = ctx.venue.id;
  const [m, t, rr] = await Promise.all([
    db.select().from(members).where(eq(members.venueId, vId)),
    db.select().from(venueTables).where(eq(venueTables.venueId, vId)),
    db.select().from(rounds).where(eq(rounds.venueId, vId)),
  ]);
  const date = new Date().toISOString().slice(0, 10);
  if (format === "csv") {
    const tableName = new Map(t.map((x) => [x.id, x.label]));
    const esc = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const lines = ["waktu,meja,id_meja,sesi,metode,faan,pemain_timur,pemain_selatan,pemain_barat,pemain_utara,delta_timur,delta_selatan,delta_barat,delta_utara"];
    for (const x of rr) {
      lines.push([esc(x.createdAt.toISOString()), esc(tableName.get(x.tableId) ?? ""), x.tableId, x.session, x.method, x.faan, ...x.players.map((p) => esc(p.name)), ...x.deltas].join(","));
    }
    return new Response("\uFEFF" + lines.join("\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="winmahjong-${ctx.venue.slug}-rounds-${date}.csv"` },
    });
  }
  const payload = { exportedAt: new Date().toISOString(), venue: ctx.venue, members: m, tables: t, rounds: rr };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="winmahjong-${ctx.venue.slug}-backup-${date}.json"` },
  });
}
