import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword, jsonError, readJson, requireUser } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireUser();
  if (ctx instanceof Response) return ctx;
  const list = await db.select().from(users).where(eq(users.venueId, ctx.venue.id)).orderBy(asc(users.createdAt));
  return Response.json({
    staff: list.map((u) => ({ id: u.id, name: u.name, username: u.username, role: u.role, active: u.active, createdAt: u.createdAt.toISOString() })),
  });
}

export async function POST(req: Request) {
  const ctx = await requireUser(true);
  if (ctx instanceof Response) return ctx;
  const b = await readJson<Record<string, string>>(req);
  const name = String(b?.name ?? "").trim();
  const username = String(b?.username ?? "").trim().toLowerCase();
  const password = String(b?.password ?? "");
  if (name.length < 2) return jsonError("Nama staf wajib diisi.");
  if (!/^[a-z0-9_.]{3,24}$/.test(username)) return jsonError("Username 3–24 karakter: huruf kecil, angka, titik atau underscore.");
  if (password.length < 6) return jsonError("Password minimal 6 karakter.");
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (exists) return jsonError("Username sudah dipakai.");
  await db.insert(users).values({ venueId: ctx.venue.id, name, username, passwordHash: hashPassword(password), role: b?.role === "owner" ? "owner" : "staff" });
  return Response.json({ ok: true });
}
