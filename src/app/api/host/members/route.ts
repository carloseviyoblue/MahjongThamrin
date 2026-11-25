import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { members, rounds } from "@/db/schema";
import { jsonError, normalizePhone, readJson, requireUser } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireUser();
  if (ctx instanceof Response) return ctx;
  const list = await db.select().from(members).where(eq(members.venueId, ctx.venue.id)).orderBy(desc(members.createdAt));
  const rr = await db.select({ players: rounds.players, deltas: rounds.deltas, tableId: rounds.tableId, createdAt: rounds.createdAt }).from(rounds).where(eq(rounds.venueId, ctx.venue.id));
  const stats = new Map<number, { points: number; tables: Set<number>; last: Date | null }>();
  for (const r of rr) {
    r.players.forEach((p, seat) => {
      if (!p.memberId) return;
      const s = stats.get(p.memberId) ?? { points: 0, tables: new Set<number>(), last: null };
      s.points += r.deltas[seat] ?? 0;
      s.tables.add(r.tableId);
      if (!s.last || r.createdAt > s.last) s.last = r.createdAt;
      stats.set(p.memberId, s);
    });
  }
  return Response.json({
    members: list.map((m) => {
      const s = stats.get(m.id);
      return {
        id: m.id, name: m.name, phone: m.phone, note: m.note, createdAt: m.createdAt.toISOString(),
        games: s?.tables.size ?? 0, points: Math.round((s?.points ?? 0) * 100) / 100, lastPlayed: s?.last?.toISOString() ?? null,
      };
    }),
  });
}

export async function POST(req: Request) {
  const ctx = await requireUser();
  if (ctx instanceof Response) return ctx;
  const b = await readJson<Record<string, string>>(req);
  const name = String(b?.name ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) return jsonError("Nama member 2–40 karakter.");
  const phone = normalizePhone(String(b?.phone ?? ""));
  if (!phone) return jsonError("Nomor HP tidak valid. Gunakan format 08xx atau +62.");
  const [dup] = await db.select().from(members).where(and(eq(members.venueId, ctx.venue.id), eq(members.phone, phone))).limit(1);
  if (dup) return Response.json({ error: `Nomor ini sudah terdaftar sebagai ${dup.name}.`, duplicate: { id: dup.id, name: dup.name } }, { status: 409 });
  const [m] = await db.insert(members).values({ venueId: ctx.venue.id, name, phone, note: String(b?.note ?? "").slice(0, 120) }).returning();
  return Response.json({ ok: true, member: m });
}
