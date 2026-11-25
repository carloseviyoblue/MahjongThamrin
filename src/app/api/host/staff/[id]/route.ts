import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { authSessions, users } from "@/db/schema";
import { hashPassword, jsonError, readJson, requireUser } from "@/lib/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireUser(true);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  const b = await readJson<{ active?: boolean; password?: string; name?: string }>(req);
  const patch: Partial<typeof users.$inferInsert> = {};
  if (typeof b?.active === "boolean") {
    if (id === auth.user.id && !b.active) return jsonError("Tidak bisa menonaktifkan akun sendiri.");
    patch.active = b.active;
  }
  if (b?.password !== undefined) {
    if (String(b.password).length < 6) return jsonError("Password minimal 6 karakter.");
    patch.passwordHash = hashPassword(String(b.password));
  }
  if (b?.name !== undefined) {
    if (String(b.name).trim().length < 2) return jsonError("Nama minimal 2 karakter.");
    patch.name = String(b.name).trim();
  }
  if (!Object.keys(patch).length) return jsonError("Tidak ada perubahan.");
  const [u] = await db.update(users).set(patch).where(and(eq(users.id, id), eq(users.venueId, auth.venue.id))).returning();
  if (!u) return jsonError("Staf tidak ditemukan.", 404);
  if (patch.active === false || patch.passwordHash) await db.delete(authSessions).where(eq(authSessions.userId, id));
  return Response.json({ ok: true });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireUser(true);
  if (auth instanceof Response) return auth;
  const id = Number((await ctx.params).id);
  if (id === auth.user.id) return jsonError("Tidak bisa menghapus akun sendiri.");
  const del = await db.delete(users).where(and(eq(users.id, id), eq(users.venueId, auth.venue.id))).returning({ id: users.id });
  if (!del.length) return jsonError("Staf tidak ditemukan.", 404);
  return Response.json({ ok: true });
}
