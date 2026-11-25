import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, ensureSeed, jsonError, readJson, verifyPassword } from "@/lib/server";

export async function POST(req: Request) {
  await ensureSeed();
  const body = await readJson<{ username?: string; password?: string }>(req);
  const username = String(body?.username ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  if (!username || !password) return jsonError("Username dan password wajib diisi.");
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  if (!user || !verifyPassword(password, user.passwordHash)) return jsonError("Username atau password salah.", 401);
  if (!user.active) return jsonError("Akun ini dinonaktifkan oleh owner.", 403);
  await createSession(user.id);
  return Response.json({ ok: true });
}
