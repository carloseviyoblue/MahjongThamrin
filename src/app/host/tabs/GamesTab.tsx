"use client";

import Link from "next/link";
import { Icon, Segmented } from "@/components/ui";
import VenueLeaderboard from "@/components/Leaderboard";
import LiveFloor from "@/components/LiveFloor";
import type { PublicVenue } from "@/lib/types";
import { useState } from "react";

export default function GamesTab({ venue }: { venue: PublicVenue }) {
  const [sub, setSub] = useState<"league" | "floor">("league");
  return (
    <div>
      <div className="mb-5">
        <Segmented value={sub} onChange={setSub} options={[{ value: "league", label: "Liga klub" }, { value: "floor", label: "Denah meja live" }]} />
      </div>
      {sub === "league" ? (
        <div className="card p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="label mb-1">Liga mingguan, poin akumulasi</p>
              <h2 className="font-display text-2xl font-semibold text-felt-950">Liga {venue.shortName}</h2>
              <p className="text-sm text-felt-900/55">Filter per aturan main (HK Classic / New 18 / Taiwan / Basic) atau gabungan, lalu pilih gaya tampilan.</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/v/${venue.slug}/tv`} target="_blank" className="btn-primary px-3.5 py-2 text-xs"><Icon name="tv" className="h-4 w-4" /> TV Liga</Link>
              <Link href={`/v/${venue.slug}/leaderboard`} target="_blank" className="btn-ghost px-3.5 py-2 text-xs"><Icon name="share" className="h-4 w-4" /> Halaman publik</Link>
            </div>
          </div>
          <VenueLeaderboard slug={venue.slug} defaultStyle={venue.leaderboardStyle} />
        </div>
      ) : (
        <div className="card p-5 sm:p-6">
          <h2 className="mb-1 font-display text-2xl font-semibold text-felt-950">Denah meja live</h2>
          <p className="mb-4 text-sm text-felt-900/55">Semua meja aktif venue, auto-refresh tiap 6 detik.</p>
          <LiveFloor slug={venue.slug} />
        </div>
      )}
    </div>
  );
}
