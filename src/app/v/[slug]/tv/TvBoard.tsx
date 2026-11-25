"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon, Segmented, Spinner, Tile, VenueBadge } from "@/components/ui";
import { useLive } from "@/components/LiveFloor";
import { LeaderTable } from "@/components/Leaderboard";
import { GAME_TYPES, GAME_TYPE_META, WINDS_ZH, fmtPts, seatWindOf, type GameType } from "@/lib/rules";
import { leaderboardStyle, type LeaderboardStyleKey } from "@/lib/theme";

type Period = "today" | "week" | "month";
type TypeFilter = GameType | "all";
const TITLES: Record<Period, string> = { today: "Hari ini", week: "Minggu ini", month: "Bulan ini" };

export default function TvBoard({ slug }: { slug: string }) {
  const [period, setPeriod] = useState<Period>("today");
  const [gameType, setGameType] = useState<TypeFilter>("all");
  const [styleOverride, setStyleOverride] = useState<LeaderboardStyleKey | null>(null);
  const { data, err } = useLive(slug, period, gameType, 5000);
  const style = styleOverride ?? (data ? leaderboardStyle(data.venue.leaderboardStyle) : "podium");
  const [now, setNow] = useState<Date | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    let dir = 1;
    const t = setInterval(() => {
      if (el.scrollHeight <= el.clientHeight + 4) return;
      el.scrollTop += dir;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) dir = -1;
      else if (el.scrollTop <= 0) dir = 1;
    }, 60);
    return () => clearInterval(t);
  }, [data]);

  if (err && !data) return <div className="felt flex min-h-dvh flex-col items-center justify-center gap-4 text-cream-50"><p className="text-xl">{err}</p><Link href="/" className="btn-gold">Kembali</Link></div>;
  if (!data) return <div className="felt flex min-h-dvh items-center justify-center text-gold-300"><Spinner className="h-10 w-10" /></div>;

  const venue = data.venue;
  const accent = venue.accentColor || "#d4a73d";
  const recent = data.tables
    .flatMap((t) => t.rounds.map((r) => ({ ...r, table: t.label })))
    .filter((r) => r.method !== "draw")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);
  const playingCount = data.tables.filter((t) => t.status === "playing").length;
  const tableCount = data.tables.length;

  return (
    <div className="felt flex h-dvh flex-col overflow-x-hidden text-cream-50" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${venue.primaryColor}b8, transparent 70%), #04160d` }}>
      <header className="flex items-center justify-between gap-6 px-[3vw] pt-[2.2vh]">
        <div className="flex min-w-0 items-center gap-4">
          <VenueBadge logoText={venue.logoText} logoSubText={venue.logoSubText} logoUrl={venue.logoUrl} color={venue.primaryColor} size={64} />
          <div className="min-w-0">
            <p className="truncate font-display text-3xl font-semibold leading-tight">{venue.name}</p>
            <p className="truncate text-sm text-cream-50/55">{venue.social || venue.tagline}</p>
          </div>
        </div>
        <div className="hidden text-center md:block">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em]" style={{ color: accent }}>Leaderboard Klub</p>
          <p className="font-display text-[2.2vw] font-semibold leading-tight">{TITLES[period]}{gameType !== "all" ? ` · ${GAME_TYPE_META[gameType].short}` : ""}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden flex-col items-end gap-1.5 2xl:flex">
            <Segmented<Period> dark size="sm" value={period} onChange={setPeriod} options={[{ value: "today", label: "Hari ini" }, { value: "week", label: "Minggu" }, { value: "month", label: "Bulan" }]} />
            <Segmented<TypeFilter> dark size="sm" value={gameType} onChange={setGameType} options={[{ value: "all", label: "Semua Rules" }, ...GAME_TYPES.map((t) => ({ value: t as TypeFilter, label: GAME_TYPE_META[t].short }))]} />
            <Segmented<LeaderboardStyleKey> dark size="sm" value={style} onChange={setStyleOverride} options={[{ value: "podium", label: "Podium" }, { value: "klasemen", label: "Klasemen" }, { value: "kartu", label: "Kartu" }, { value: "minimal", label: "Minimal" }]} />
          </div>
          <div className="text-right">
            <p className="flex items-center justify-end gap-2 text-[11px] font-bold uppercase tracking-widest text-red-300"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live</p>
            <p className="font-mono text-4xl font-bold tabular-nums">{now ? now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</p>
            <p className="text-xs text-cream-50/55">{now ? now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" }) : ""}</p>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-[2vw] px-[3vw] py-[2.2vh] lg:grid-cols-[1.25fr_1fr]">
        <section ref={listRef} className="min-h-0 overflow-hidden">
          {data.board.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-cream-50/50">
              <div className="flex gap-2"><Tile code="dR" size="xl" /><Tile code="dG" size="xl" /><Tile code="dW" size="xl" /></div>
              <p className="mt-6 text-2xl">Belum ada skor {TITLES[period].toLowerCase()}. Selamat bermain!</p>
            </div>
          ) : (
            <LeaderTable rows={data.board} style={style} dark />
          )}
        </section>
        <section className="hidden min-h-0 flex-col lg:flex">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em]" style={{ color: accent }}>Live meja · {playingCount}/{tableCount} dimainkan</p>
          <div className="grid min-h-0 flex-1 auto-rows-min gap-3 overflow-hidden xl:grid-cols-2">
            {data.tables.map((t) => (
                <div key={t.id} className={`rounded-2xl p-4 ring-1 ${t.status === "playing" ? "bg-white/[0.07] ring-white/10" : "bg-white/[0.02] ring-white/5"}`}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="min-w-0 truncate font-display text-lg font-semibold">{t.label}</p>
                    <span className={`text-xs ${t.status === "playing" ? "text-emerald-300" : "text-cream-50/40"}`}>{t.status === "playing" ? `${WINDS_ZH[t.state.roundWind]} · hand ${t.state.handNo}` : t.status === "finished" ? "Selesai" : "Tersedia"}</span>
                  </div>
                  {t.players.map((p, s) => (
                    <div key={s} className="flex items-center justify-between py-0.5 text-[15px]">
                      <span className="flex min-w-0 items-center gap-2"><span className={`font-han font-black ${seatWindOf(s, t.state.dealer) === 0 ? "" : "text-cream-50/40"}`} style={seatWindOf(s, t.state.dealer) === 0 ? { color: accent } : undefined}>{WINDS_ZH[seatWindOf(s, t.state.dealer)]}</span><span className="truncate">{p.name}</span></span>
                      <span className="font-mono font-semibold">{t.totals[s].toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="flex items-center gap-4 overflow-hidden border-t border-white/10 bg-black/25 py-3">
        <span className="ml-[3vw] shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-felt-950" style={{ background: accent }}>Terbaru</span>
        <div className="relative flex-1 overflow-hidden">
          {recent.length ? (
            <div className="flex w-max animate-[ticker_45s_linear_infinite] gap-12 whitespace-nowrap text-lg">
              {[...recent, ...recent].map((r, i) => (
                <span key={i} className="inline-flex items-center gap-2">
                  <span style={{ color: accent }}>◆</span>
                  <b>{r.players[r.winnerSeat!]?.name}</b>
                  <span className="text-cream-50/60">{r.method === "selfdraw" ? "Zimo" : "Hu"} {r.faan} · {r.table}</span>
                  <span className="font-mono text-emerald-300">{fmtPts(r.deltas[r.winnerSeat!])}</span>
                </span>
              ))}
            </div>
          ) : <p className="text-cream-50/50">Scan QR di meja untuk mulai bermain.</p>}
        </div>
        <span className="mr-[3vw] hidden shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-[0.15em] text-red-300/80 md:flex"><Icon name="ban" className="h-4 w-4" /> Dilarang berjudi</span>
      </footer>
    </div>
  );
}
