import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { jsonError, normalizePhone, readJson, requireUser } from "@/lib/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const b = await readJson<Record<string, string>>(req);
  const name = String(b?.name ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 40) return jsonError("Nama member 2–40 karakter.");
  const phone = normalizePhone(String(b?.phone ?? ""));
  if (!phone) return jsonError("Nomor HP tidak valid. Gunakan format 08xx atau +62.");
  const [dup] = await db.select().from(members).where(and(eq(members.venueId, auth.venue.id), eq(members.phone, phone), ne(members.id, id))).limit(1);
  if (dup) return jsonError(`Nomor ini sudah terdaftar sebagai ${dup.name}.`, 409);
  const [m] = await db
    .update(members)
    .set({ name, phone, note: String(b?.note ?? "").slice(0, 120) })
    .where(and(eq(members.id, id), eq(members.venueId, auth.venue.id)))
    .returning();
  if (!m) return jsonError("Member tidak ditemukan.", 404);
  return Response.json({ ok: true, member: m });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireUser();
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const del = await db.delete(members).where(and(eq(members.id, id), eq(members.venueId, auth.venue.id))).returning({ id: members.id });
  if (!del.length) return jsonError("Member tidak ditemukan.", 404);
  return Response.json({ ok: true });
}
