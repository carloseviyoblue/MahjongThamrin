import ThemeStyle from "@/components/ThemeStyle";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import JoinCode from "@/components/JoinCode";
import LiveFloor from "@/components/LiveFloor";
import { Icon, NoGambling, VenueBadge } from "@/components/ui";
import { LeaderTable } from "@/components/Leaderboard";
import { getVenue } from "@/lib/venue";
import { venueLeaderboard } from "@/lib/server";
import { themeCss, leaderboardStyle } from "@/lib/theme";
import { GAME_TYPE_META } from "@/lib/rules";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/v/[slug]">): Promise<Metadata> {
  const v = await getVenue((await params).slug);
  return { title: v?.name ?? "Venue" };
}

export default async function VenuePage({ params }: PageProps<"/v/[slug]">) {
  const venue = await getVenue((await params).slug);
  if (!venue) notFound();
  const board = await venueLeaderboard(venue.id, "week");

  return (
    <div className="paper themed min-h-dvh overflow-x-hidden">
        <ThemeStyle venue={venue} />
      <section className="relative overflow-hidden text-cream-50" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${venue.primaryColor}dd, transparent 70%), linear-gradient(180deg, ${venue.primaryColor}, #041a11)` }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-4">
          <Link href="/" className="text-xs font-semibold text-cream-50/50 hover:text-cream-50">WinMahjong</Link>
          <div className="flex gap-2">
            <Link href={`/v/${venue.slug}/tv`} className="btn-dark-ghost px-3 py-2 text-xs"><Icon name="tv" className="h-4 w-4" /> <span className="hidden sm:inline">Layar TV</span></Link>
            <Link href="/panduan" className="btn-dark-ghost px-3 py-2 text-xs"><Icon name="book" className="h-4 w-4" /> <span className="hidden sm:inline">Panduan</span></Link>
            <Link href="/host/login" className="btn-dark-ghost px-3 py-2 text-xs"><Icon name="lock" className="h-4 w-4" /> <span className="hidden sm:inline">Host</span></Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-md flex-col items-center px-5 pb-12 pt-8 text-center">
          <VenueBadge logoText={venue.logoText} logoSubText={venue.logoSubText} logoUrl={venue.logoUrl} color={venue.primaryColor} size={88} className="animate-pop shadow-2xl" />
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">{venue.name}</h1>
          {venue.tagline && <p className="mt-2 text-cream-50/65">{venue.tagline}</p>}
          {venue.social && <p className="mt-1 text-sm font-semibold" style={{ color: venue.accentColor }}>{venue.social}</p>}
          {venue.address && <p className="mt-1 text-xs text-cream-50/45">{venue.address}</p>}
          <div className="mt-8 w-full">
            <p className="label text-cream-50/50">Scan QR meja atau tempel link meja dari host</p>
            <JoinCode dark />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl space-y-8 px-5 py-8">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-2xl font-semibold text-felt-950">Room & meja sekarang</h2>
            <span className="text-xs text-felt-900/50">Live · auto-refresh</span>
          </div>
          <LiveFloor slug={venue.slug} />
        </section>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <section>
            <div className="mb-3 flex items-end justify-between">
              <h2 className="font-display text-2xl font-semibold text-felt-950">Top minggu ini</h2>
              <Link href={`/v/${venue.slug}/leaderboard`} className="text-sm font-semibold text-felt-700 hover:underline">Liga lengkap</Link>
            </div>
            <LeaderTable rows={board} limit={8} style={leaderboardStyle(venue.leaderboardStyle)} />
          </section>
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-semibold text-felt-950">Info venue</h2>
            <Link href={`/v/${venue.slug}/rules`} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-felt-50 text-felt-700"><Icon name="book" /></span>
              <div className="min-w-0">
                <p className="font-semibold text-felt-950">House Rules</p>
                <p className="truncate text-xs text-felt-900/55">{GAME_TYPE_META[venue.rules.preset].label} · min {venue.rules.minFaan} · batas {venue.rules.maxFaan}</p>
              </div>
            </Link>
            <Link href={`/v/${venue.slug}/leaderboard`} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-gold-600"><Icon name="trophy" /></span>
              <div><p className="font-semibold text-felt-950">Liga Klub</p><p className="text-xs text-felt-900/55">Per rules atau gabungan · beberapa gaya tampilan</p></div>
            </Link>
            <Link href="/panduan" className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-felt-50 text-felt-700"><Icon name="sparkle" /></span>
              <div><p className="font-semibold text-felt-950">Panduan Bermain</p><p className="text-xs text-felt-900/55">HK Classic, New 18, Taiwan & Basic</p></div>
            </Link>
          </section>
        </div>
        <NoGambling />
      </main>
    </div>
  );
}
