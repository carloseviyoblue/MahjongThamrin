"use client";

import { useEffect, useState } from "react";
import { fmtPts, GAME_TYPES, GAME_TYPE_META, type GameType } from "@/lib/rules";
import { leaderboardStyle, type LeaderboardStyleKey } from "@/lib/theme";
import type { LeaderRow } from "@/lib/types";
import { Segmented, Spinner, api } from "./ui";

export type { LeaderRow };
type Period = "today" | "week" | "lastweek" | "month" | "lastmonth" | "all";
type TypeFilter = GameType | "all";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Hari ini" },
  { value: "week", label: "Minggu ini" },
  { value: "lastweek", label: "Minggu lalu" },
  { value: "month", label: "Bulan ini" },
  { value: "lastmonth", label: "Bulan lalu" },
  { value: "all", label: "Semua" },
];

function RankBadge({ i, size = "md" }: { i: number; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "h-11 w-11 text-base" : "h-8 w-8 text-xs";
  if (i === 0) return <span className={`inline-flex ${cls} items-center justify-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 font-black text-felt-950 shadow`}>1</span>;
  if (i === 1) return <span className={`inline-flex ${cls} items-center justify-center rounded-full bg-gradient-to-b from-slate-100 to-slate-300 font-black text-slate-700 shadow`}>2</span>;
  if (i === 2) return <span className={`inline-flex ${cls} items-center justify-center rounded-full bg-gradient-to-b from-orange-200 to-orange-400 font-black text-orange-900 shadow`}>3</span>;
  return <span className={`inline-flex ${cls} items-center justify-center rounded-full bg-felt-900/5 font-bold text-felt-900/50`}>{i + 1}</span>;
}

function Pts({ v, className = "" }: { v: number; className?: string }) {
  return <span className={`font-mono font-black ${v > 0 ? "text-felt-700" : v < 0 ? "text-red-600" : "text-felt-900/40"} ${className}`}>{fmtPts(v)}</span>;
}

export function LeaderTable({ rows, limit, style = "podium", dark = false }: { rows: LeaderRow[]; limit?: number; style?: LeaderboardStyleKey; dark?: boolean }) {
  const list = limit ? rows.slice(0, limit) : rows;
  if (!list.length)
    return <div className={`rounded-3xl border border-dashed px-4 py-12 text-center text-sm ${dark ? "border-white/15 text-cream-50/50" : "border-felt-900/15 text-felt-900/50"}`}>Belum ada permainan pada filter ini.</div>;

  if (style === "minimal") {
    return (
      <ol className={`divide-y ${dark ? "divide-white/8 text-cream-50" : "divide-felt-900/6"}`}>
        {list.map((r, i) => (
          <li key={r.key} className="flex items-center gap-3 py-2.5">
            <span className={`w-7 text-center font-mono text-sm font-bold ${dark ? "text-cream-50/50" : "text-felt-900/40"}`}>{i + 1}</span>
            <span className="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
            <span className={`text-xs ${dark ? "text-cream-50/45" : "text-felt-900/45"}`}>{r.games}× main · {r.wins} menang</span>
            <Pts v={r.points} />
          </li>
        ))}
      </ol>
    );
  }

  if (style === "kartu") {
    return (
      <div className="grid gap-2.5 sm:grid-cols-2">
        {list.map((r, i) => (
          <div key={r.key} className={`flex items-center gap-3 rounded-3xl p-4 ${dark ? "bg-white/[0.06] ring-1 ring-white/10 text-cream-50" : i === 0 ? "bg-gradient-to-br from-gold-100 to-gold-200 ring-1 ring-gold-300" : "bg-white ring-1 ring-felt-900/8"}`}>
            <RankBadge i={i} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-semibold leading-tight">{r.name}</p>
              <p className={`text-[11px] ${dark ? "text-cream-50/50" : "text-felt-900/50"}`}>{r.memberId ? "Member" : "Tamu"} · {r.wins} menang · {r.rounds} hand{r.maxFaan ? ` · maks ${r.maxFaan}` : ""}</p>
              <div className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${dark ? "bg-white/10" : "bg-felt-900/8"}`}>
                <div className="h-full rounded-full bg-gradient-to-r from-felt-500 to-gold-400" style={{ width: `${Math.min(100, Math.max(8, (Math.max(0, r.points) / Math.max(1, Math.max(0, list[0]?.points ?? 1))) * 100))}%` }} />
              </div>
            </div>
            <div className="text-right">
              <Pts v={r.points} className="text-lg" />
              <p className={`text-[11px] ${dark ? "text-cream-50/45" : "text-felt-900/45"}`}>{r.games}× main</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (style === "klasemen") {
    return (
      <div className={`overflow-hidden rounded-3xl ${dark ? "bg-black/20 ring-1 ring-white/10" : "bg-white ring-1 ring-felt-900/8"}`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left text-[10px] font-bold uppercase tracking-[0.14em] ${dark ? "text-cream-50/40" : "text-felt-900/40"}`}>
              <th className="w-12 py-3 pl-4">#</th>
              <th className="py-3">Nama</th>
              <th className="hidden py-3 text-right sm:table-cell">Hand</th>
              <th className="py-3 text-right">Main</th>
              <th className="py-3 pr-4 text-right">Poin</th>
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={r.key} className={`${dark ? "border-t border-white/5" : "border-t border-felt-900/5"} ${i === 0 && !dark ? "bg-gold-50" : ""}`}>
                <td className="py-2.5 pl-4"><RankBadge i={i} /></td>
                <td className="py-2.5">
                  <p className="font-semibold">{r.name}</p>
                  <p className={`text-[11px] ${dark ? "text-cream-50/40" : "text-felt-900/45"}`}>{r.memberId ? "Member" : "Tamu"} · {r.wins} menang</p>
                </td>
                <td className={`hidden py-2.5 text-right sm:table-cell ${dark ? "text-cream-50/60" : "text-felt-900/60"}`}>{r.rounds}</td>
                <td className={`py-2.5 text-right ${dark ? "text-cream-50/60" : "text-felt-900/60"}`}>{r.games}×</td>
                <td className="py-2.5 pr-4 text-right"><Pts v={r.points} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // podium (default): top-3 podium blocks + rows
  const podium = list.slice(0, 3);
  const rest = list.slice(3);
  return (
    <div>
      {podium.length > 0 && (
        <div className="mb-3 grid grid-cols-3 items-end gap-2">
          {[1, 0, 2].map((idx) => {
            const r = podium[idx];
            if (!r) return <div key={idx} />;
            const h = idx === 0 ? "pt-5 pb-4" : idx === 1 ? "pt-4 pb-3" : "pt-3 pb-2.5";
            const bg = idx === 0 ? "from-gold-300 to-gold-500 text-felt-950" : idx === 1 ? "from-slate-100 to-slate-300 text-slate-800" : "from-orange-200 to-orange-400 text-orange-950";
            return (
              <div key={r.key} className={`rounded-3xl bg-gradient-to-b ${bg} ${h} px-3 text-center shadow-sm`}>
                <p className="font-display text-2xl font-black leading-none">{idx + 1}</p>
                <p className="mt-1.5 truncate font-display text-base font-semibold leading-tight sm:text-lg">{r.name}</p>
                <Pts v={r.points} className={idx === 0 ? "text-felt-900" : ""} />
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-70">{r.wins} menang · {r.games}× main</p>
              </div>
            );
          })}
        </div>
      )}
      {rest.length > 0 && (
        <div className={`overflow-hidden rounded-3xl ${dark ? "bg-black/20 ring-1 ring-white/10" : "bg-white ring-1 ring-felt-900/8"}`}>
          {rest.map((r, i) => (
            <div key={r.key} className={`flex items-center gap-3 px-4 py-2.5 ${i > 0 ? (dark ? "border-t border-white/5" : "border-t border-felt-900/5") : ""}`}>
              <RankBadge i={i + 3} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.name}</p>
                <p className={`text-[11px] ${dark ? "text-cream-50/40" : "text-felt-900/45"}`}>{r.memberId ? "Member" : "Tamu"} · {r.wins} menang · maks {r.maxFaan}</p>
              </div>
              <span className={`text-xs ${dark ? "text-cream-50/50" : "text-felt-900/50"}`}>{r.games}× main</span>
              <Pts v={r.points} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VenueLeaderboard({ slug, defaultStyle = "podium", showStyleSwitcher = true }: { slug: string; defaultStyle?: string; showStyleSwitcher?: boolean }) {
  const [period, setPeriod] = useState<Period>("week");
  const [gameType, setGameType] = useState<TypeFilter>("all");
  const [style, setStyle] = useState<LeaderboardStyleKey>(leaderboardStyle(defaultStyle));
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => { setStyle(leaderboardStyle(defaultStyle)); }, [defaultStyle]);

  useEffect(() => {
    let alive = true;
    setRows(null);
    setErr("");
    api<{ rows: LeaderRow[] }>(`/api/venues/${slug}/leaderboard?period=${period}&gameType=${gameType}`)
      .then((d) => alive && setRows(d.rows))
      .catch((e) => alive && setErr((e as Error).message));
    return () => { alive = false; };
  }, [slug, period, gameType]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="-mx-1 overflow-x-auto px-1 scrollbar-none">
          <Segmented<Period> value={period} onChange={setPeriod} size="sm" options={PERIODS} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="-mx-1 overflow-x-auto px-1 scrollbar-none">
          <Segmented<TypeFilter>
            value={gameType}
            onChange={setGameType}
            size="sm"
            options={[{ value: "all" as const, label: "Semua Rules" }, ...GAME_TYPES.map((t) => ({ value: t as TypeFilter, label: GAME_TYPE_META[t].short }))]}
          />
        </div>
        {showStyleSwitcher && (
          <div className="-mx-1 overflow-x-auto px-1 scrollbar-none">
            <Segmented<LeaderboardStyleKey>
              value={style}
              onChange={setStyle}
              size="sm"
              options={[{ value: "podium", label: "Podium" }, { value: "klasemen", label: "Klasemen" }, { value: "kartu", label: "Kartu" }, { value: "minimal", label: "Minimal" }]}
            />
          </div>
        )}
      </div>
      <div className="mt-4">
        {err ? <p className="text-sm text-red-600">{err}</p> : rows === null ? <div className="flex justify-center py-10 text-felt-700"><Spinner /></div> : <LeaderTable rows={rows} style={style} />}
      </div>
    </div>
  );
}
