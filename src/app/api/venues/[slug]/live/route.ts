import { eq } from "drizzle-orm";
import { venueOverview } from "@/lib/game";
import { jsonError } from "@/lib/server";
import { getVenue } from "@/lib/venue";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const venue = await getVenue((await ctx.params).slug);
  if (!venue) return jsonError("Venue tidak ditemukan.", 404);
  const url = new URL(req.url);
  return Response.json(await venueOverview(venue, url.searchParams.get("period") ?? "today", url.searchParams.get("gameType") ?? "all"));
}
