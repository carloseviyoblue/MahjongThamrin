"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon, Spinner, api, timeAgo } from "./ui";
import { GAME_TYPE_META, WINDS_ZH, fmtPts, seatWindOf } from "@/lib/rules";
import type { LeaderRow, PublicVenue, TableView } from "@/lib/types";

export type LiveData = { venue: PublicVenue; period: string; board: LeaderRow[]; tables: TableView[] };

export function useLive(slug: string, period = "today", gameType = "all", interval = 6000) {
  const [data, setData] = useState<LiveData | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    try { setData(await api<LiveData>(`/api/venues/${slug}/live?period=${period}&gameType=${gameType}`)); setErr(""); }
    catch (e) { setErr((e as Error).message); }
  }, [slug, period, gameType]);
  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const t = setInterval(() => document.visibilityState === "visible" && load(), interval);
    return () => {
      window.clearTimeout(first);
      clearInterval(t);
    };
  }, [load, interval]);
  return { data, err, reload: load };
}

export default function LiveFloor({ slug }: { slug: string }) {
  const { data, err } = useLive(slug);
  if (err && !data) return <p className="text-sm text-red-600">{err}</p>;
  if (!data) return <div className="flex justify-center py-10 text-felt-700"><Spinner /></div>;
  if (!data.tables.length) return <div className="card px-5 py-12 text-center text-sm text-felt-900/60">Belum ada meja terdaftar. Host dapat menambah meja dari dashboard.</div>;
  const areas = [...new Set(data.tables.map((t) => t.area || ""))];
  return (
    <div>
      {areas.map((a) => (
        <div key={a} className="mb-5">
          {areas.length > 1 && <p className="label">{a || "Lainnya"}</p>}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.tables.filter((t) => (t.area || "") === a).map((t) => {
              const playing = t.status === "playing" && t.players.length === 4;
              return (
                <Link key={t.id} href={`/m/${t.secret}`} className={`group relative block overflow-hidden rounded-3xl transition hover:-translate-y-0.5 ${playing ? "felt text-cream-50 shadow-lg shadow-felt-900/25" : "card"}`}>
                  <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
                    <div className="min-w-0">
                      <p className={`truncate font-display text-xl font-semibold ${playing ? "" : "text-felt-950"}`}>{t.label}</p>
                      <p className={`truncate text-xs ${playing ? "text-cream-50/60" : "text-felt-900/50"}`}>{t.area || "—"} · {GAME_TYPE_META[t.gameType].short}</p>
                    </div>
                    {playing ? (
                      <span className="chip shrink-0 bg-emerald-400/20 text-emerald-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> {WINDS_ZH[t.state.roundWind]} hand {t.state.handNo}</span>
                    ) : (
                      <span className="chip shrink-0 bg-felt-50 text-felt-700">{t.status === "finished" ? "Selesai" : "Tersedia"}</span>
                    )}
                  </div>
                  {playing ? (
                    <ul className="px-4 pb-4">
                      {t.players.map((p, s) => {
                        const d = t.totals[s] - t.startingPoints;
                        return (
                          <li key={s} className="flex items-center justify-between gap-2 border-t border-white/8 py-1.5 text-sm">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className={`w-5 shrink-0 font-han font-black ${seatWindOf(s, t.state.dealer) === 0 ? "text-gold-300" : "text-cream-50/40"}`}>{WINDS_ZH[seatWindOf(s, t.state.dealer)]}</span>
                              <span className="truncate">{p.name}</span>
                            </span>
                            <span className={`shrink-0 font-mono text-xs font-bold ${d > 0 ? "text-emerald-300" : d < 0 ? "text-red-300" : "text-cream-50/50"}`}>{fmtPts(d)}</span>
                          </li>
                        );
                      })}
                      <li className="pt-1 text-[11px] text-cream-50/45">Update {timeAgo(t.updatedAt)}</li>
                    </ul>
                  ) : (
                    <div className="flex items-center gap-3 px-4 pb-5 pt-1 text-sm text-felt-900/55">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-felt-900/15 text-felt-700 transition group-hover:border-felt-500"><Icon name="qr" className="h-4 w-4" /></span>
                      {t.status === "finished" ? "Lihat rekap sesi terakhir" : "Scan QR di meja, atau ketuk untuk buka"}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
