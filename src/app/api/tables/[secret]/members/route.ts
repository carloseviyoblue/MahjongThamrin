import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { loadTableBySecret } from "@/lib/game";
import { jsonError, maskPhone } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ secret: string }> }) {
  const { secret } = await ctx.params;
  const res = await loadTableBySecret(secret);
  if ("error" in res) return jsonError("Meja tidak ditemukan.", 404);
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 40);
  if (q.length < 2) return Response.json({ members: [] });
  const digits = q.replace(/\D/g, "");
  const phoneQ = digits.startsWith("0") ? "62" + digits.slice(1) : digits;
  const esc = q.replace(/[%_\\]/g, "\\$&");
  const cond = digits.length >= 4 ? or(ilike(members.name, `%${esc}%`), ilike(members.phone, `%${phoneQ}%`)) : ilike(members.name, `%${esc}%`);
  const rows = await db.select().from(members).where(and(eq(members.venueId, res.venue.id), cond)).limit(8);
  return Response.json({ members: rows.map((m) => ({ id: m.id, name: m.name, phone: maskPhone(m.phone) })) });
}
