import { notFound } from "next/navigation";
import type { Metadata } from "next";
import VenueShell from "@/components/VenueShell";
import VenueLeaderboard from "@/components/Leaderboard";
import { getVenue } from "@/lib/venue";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Liga Klub" };

export default async function LeaderboardPage({ params }: PageProps<"/v/[slug]/leaderboard">) {
  const venue = await getVenue((await params).slug);
  if (!venue) notFound();
  return (
    <VenueShell venue={venue} back={`/v/${venue.slug}`} title={`Liga ${venue.shortName}`}>
      <div className="card p-5 sm:p-6">
        <h2 className="font-display text-2xl font-semibold text-felt-950">Peringkat pemain</h2>
        <p className="mb-5 mt-1 text-sm text-felt-900/55">Filter per tipe permainan (gabungan semua rules atau terpisah) dan ganti gaya tampilan sesukamu. Member dikenali dari data member, tamu dari nama.</p>
        <VenueLeaderboard slug={venue.slug} defaultStyle={venue.leaderboardStyle} />
      </div>
    </VenueShell>
  );
}
