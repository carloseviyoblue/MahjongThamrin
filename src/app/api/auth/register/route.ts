import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, venues } from "@/db/schema";
import { createSession, hashPassword, jsonError, readJson, slugify } from "@/lib/server";
import { defaultRuleset } from "@/lib/rules";

export async function POST(req: Request) {
  const b = await readJson<Record<string, string>>(req);
  const venueName = String(b?.venueName ?? "").trim();
  const ownerName = String(b?.ownerName ?? "").trim();
  const username = String(b?.username ?? "").trim().toLowerCase();
  const password = String(b?.password ?? "");
  const preset = b?.preset === "new18" ? "new18" : "classic";
  if (venueName.length < 3) return jsonError("Nama venue minimal 3 karakter.");
  if (ownerName.length < 2) return jsonError("Nama owner wajib diisi.");
  if (!/^[a-z0-9_.]{3,24}$/.test(username)) return jsonError("Username 3–24 karakter: huruf kecil, angka, titik atau underscore.");
  if (password.length < 6) return jsonError("Password minimal 6 karakter.");
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (exists.length) return jsonError("Username sudah dipakai.");
  const base = slugify(b?.slug || venueName) || "venue";
  let slug = base;
  for (let i = 2; i < 100; i++) {
    const taken = await db.select({ id: venues.id }).from(venues).where(eq(venues.slug, slug)).limit(1);
    if (!taken.length) break;
    slug = `${base}-${i}`;
  }
  const shortName = venueName.split(/\s+/)[0].slice(0, 14);
  const [venue] = await db
    .insert(venues)
    .values({ slug, name: venueName, shortName, logoText: venueName.charAt(0).toUpperCase(), rules: defaultRuleset(preset) })
    .returning();
  const [user] = await db.insert(users).values({ venueId: venue.id, name: ownerName, username, passwordHash: hashPassword(password), role: "owner" }).returning();
  await createSession(user.id);
  return Response.json({ ok: true, slug });
}
