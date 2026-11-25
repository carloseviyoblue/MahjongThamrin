import { jsonError, venueLeaderboard } from "@/lib/server";
import { getVenue } from "@/lib/venue";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const venue = await getVenue((await ctx.params).slug);
  if (!venue) return jsonError("Venue tidak ditemukan.", 404);
  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "week";
  const gameType = url.searchParams.get("gameType") ?? "all";
  return Response.json({ period, gameType, rows: await venueLeaderboard(venue.id, period, gameType) });
}
