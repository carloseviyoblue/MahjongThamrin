import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { normalizeRules } from "./rules";
import { ensureSeed } from "./server";
import type { VenueFull } from "./game";

export async function getVenue(slug: string): Promise<VenueFull | null> {
  await ensureSeed();
  const [v] = await db.select().from(venues).where(eq(venues.slug, slug)).limit(1);
  if (!v) return null;
  return { ...v, rules: normalizeRules(v.rules) };
}
