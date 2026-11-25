import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { jsonError, readJson, requireUser, slugify } from "@/lib/server";
import { normalizeRules, PATTERNS, GAME_TYPES, type GameType, type Ruleset } from "@/lib/rules";
import { CARDS, FONT_PAIRS, LEADERBOARD_STYLES, RADII, SURFACES } from "@/lib/theme";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await requireUser();
  if (ctx instanceof Response) return ctx;
  return Response.json({ venue: ctx.venue });
}

export async function PUT(req: Request) {
  const ctx = await requireUser(true);
  if (ctx instanceof Response) return ctx;
  const b = await readJson<Record<string, unknown>>(req);
  if (!b) return jsonError("Data tidak valid.");
  const patch: Partial<typeof venues.$inferInsert> = {};

  if (b.name !== undefined) {
    const v = String(b.name).trim();
    if (v.length < 3 || v.length > 60) return jsonError("Nama venue 3–60 karakter.");
    patch.name = v;
  }
  if (b.shortName !== undefined) {
    const v = String(b.shortName).trim();
    if (v.length < 2 || v.length > 16) return jsonError("Nama pendek 2–16 karakter.");
    patch.shortName = v;
  }
  if (b.slug !== undefined) {
    const v = slugify(String(b.slug));
    if (v.length < 3) return jsonError("Slug URL minimal 3 karakter.");
    const [taken] = await db.select({ id: venues.id }).from(venues).where(and(eq(venues.slug, v), ne(venues.id, ctx.venue.id))).limit(1);
    if (taken) return jsonError("Slug URL sudah dipakai venue lain.");
    patch.slug = v;
  }
  if (b.logoText !== undefined) {
    const v = String(b.logoText).trim();
    if (!v || [...v].length > 2) return jsonError("Huruf ikon logo 1–2 karakter.");
    patch.logoText = v;
  }
  if (b.logoSubText !== undefined) {
    const v = String(b.logoSubText).trim();
    if ([...v].length > 2) return jsonError("Huruf kecil di logo maks 2 karakter.");
    patch.logoSubText = v;
  }
  if (b.logoUrl !== undefined) {
    const v = b.logoUrl === null ? null : String(b.logoUrl);
    if (v && !/^data:image\/(png|jpeg|webp|svg\+xml);base64,/.test(v)) return jsonError("Logo harus PNG/JPG/WEBP/SVG.");
    if (v && v.length > 400_000) return jsonError("Ukuran logo terlalu besar (maks ±300KB).");
    patch.logoUrl = v;
  }
  if (b.social !== undefined) patch.social = String(b.social).trim().slice(0, 60);
  if (b.tagline !== undefined) patch.tagline = String(b.tagline).trim().slice(0, 100);
  if (b.address !== undefined) patch.address = String(b.address).trim().slice(0, 160);
  if (b.primaryColor !== undefined) {
    const v = String(b.primaryColor);
    if (!/^#[0-9a-fA-F]{6}$/.test(v)) return jsonError("Warna utama harus hex, mis. #0f5132.");
    patch.primaryColor = v;
  }
  if (b.accentColor !== undefined) {
    const v = String(b.accentColor);
    if (!/^#[0-9a-fA-F]{6}$/.test(v)) return jsonError("Warna aksen harus hex, mis. #d4a73d.");
    patch.accentColor = v;
  }
  if (b.fontPair !== undefined) {
    const v = String(b.fontPair);
    if (!FONT_PAIRS.some((f) => f.key === v)) return jsonError("Pilihan font tidak dikenal.");
    patch.fontPair = v;
  }
  if (b.leaderboardStyle !== undefined) {
    const v = String(b.leaderboardStyle);
    if (!LEADERBOARD_STYLES.some((x) => x.key === v)) return jsonError("Gaya leaderboard tidak dikenal.");
    patch.leaderboardStyle = v;
  }
  if (b.defaultStartingPoints !== undefined) {
    const n = Number(b.defaultStartingPoints);
    if (!Number.isInteger(n) || n < 0 || n > 1_000_000) return jsonError("Poin awal default 0–1.000.000.");
    patch.defaultStartingPoints = n;
  }
  if (b.defaultPayRule !== undefined) patch.defaultPayRule = b.defaultPayRule === "full" ? "full" : "half";
  if (b.playerSelfOpen !== undefined) patch.playerSelfOpen = !!b.playerSelfOpen;
  if (b.surfaceMode !== undefined) {
    if (!SURFACES.some((x) => x.key === b.surfaceMode)) return jsonError("Mode tampilan tidak dikenal.");
    patch.surfaceMode = String(b.surfaceMode);
  }
  if (b.radiusMode !== undefined) {
    if (!RADII.some((x) => x.key === b.radiusMode)) return jsonError("Mode sudut tidak dikenal.");
    patch.radiusMode = String(b.radiusMode);
  }
  if (b.cardStyle !== undefined) {
    if (!CARDS.some((x) => x.key === b.cardStyle)) return jsonError("Gaya kartu tidak dikenal.");
    patch.cardStyle = String(b.cardStyle);
  }
  if (b.defaultGameType !== undefined) {
    if (!GAME_TYPES.includes(b.defaultGameType as GameType)) return jsonError("Tipe permainan tidak valid.");
    patch.defaultGameType = b.defaultGameType as GameType;
  }

  if (b.rules !== undefined) {
    const r = b.rules as Partial<Ruleset>;
    if (r.preset !== undefined && !GAME_TYPES.includes(r.preset as GameType)) return jsonError("Tipe permainan tidak valid.");
    const rules = normalizeRules({ ...r, preset: (r.preset as GameType) ?? ctx.venue.rules.preset });
    const minF = Number(rules.minFaan), maxF = Number(rules.maxFaan), mult = Number(rules.multiplier);
    if (!Number.isInteger(minF) || minF < 0 || minF > 16) return jsonError("Minimal faan/tai 0–16.");
    if (!Number.isInteger(maxF) || maxF < 3 || maxF > 24) return jsonError("Batas faan/tai 3–24.");
    if (minF > maxF) return jsonError("Minimal tidak boleh melebihi batas.");
    if (!Number.isFinite(mult) || mult <= 0 || mult > 10000) return jsonError("Pengali poin harus > 0.");
    if (!["half_spicy", "full_spicy", "linear"].includes(rules.payoutTable)) return jsonError("Tabel poin tidak valid.");
    for (const p of PATTERNS) {
      const s = rules.patterns[p.key];
      if (!s) continue;
      const f = Number(s.faan);
      if (!Number.isInteger(f) || f < 0 || f > 24) return jsonError(`Nilai ${p.name} harus 0–24.`);
      rules.patterns[p.key] = { enabled: !!s.enabled, faan: f };
    }
    patch.rules = { ...rules, minFaan: minF, maxFaan: maxF, multiplier: mult };
  }
  if (!Object.keys(patch).length) return jsonError("Tidak ada perubahan.");
  const [v] = await db.update(venues).set(patch).where(eq(venues.id, ctx.venue.id)).returning();
  return Response.json({ ok: true, venue: { ...v, rules: normalizeRules(v.rules) } });
}
