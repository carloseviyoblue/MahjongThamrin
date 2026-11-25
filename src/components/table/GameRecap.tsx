"use client";

import { useState } from "react";
import { Icon, Tile } from "@/components/ui";
import { PATTERN_MAP, WINDS_ZH, deriveState, faanValue, fmtPts, seatWindOf, unitLabel, type Ruleset } from "@/lib/rules";
import type { RoundView, SeatPlayer, TableView } from "@/lib/types";

export function tableStats(table: TableView, startingPoints: number) {
  return table.players
    .map((p, s) => {
      let wins = 0, zimo = 0, dealIn = 0, maxFaan = 0;
      for (const r of table.rounds) {
        if (r.winnerSeat === s && r.method !== "draw") { wins++; maxFaan = Math.max(maxFaan, r.faan); if (r.method === "selfdraw") zimo++; }
        if (r.discarderSeat === s) dealIn++;
      }
      return { seat: s, name: p.name, memberId: p.memberId, total: table.totals[s], diff: Math.round((table.totals[s] - startingPoints) * 100) / 100, wins, zimo, dealIn, maxFaan };
    })
    .sort((a, b) => b.total - a.total);
}

export function recapText(table: TableView, startingPoints: number, venueName: string, social: string, roomName: string, rules: Ruleset) {
  const stats = tableStats(table, startingPoints);
  const unit = unitLabel(rules);
  const draws = table.rounds.filter((r) => r.method === "draw").length;
  const avg = table.rounds.length ? (table.rounds.reduce((a, r) => a + r.faan, 0) / Math.max(1, table.rounds.filter((r) => r.method !== "draw").length)).toFixed(1) : "0";
  return [
    `🀄 ${venueName} — ${roomName} · ${table.label}`,
    `${table.rounds.length} hand · ${draws} seri · rata-rata ${avg} ${unit}`,
    "",
    ...stats.map((s, i) => `${["🥇", "🥈", "🥉", "4️⃣"][i]} ${s.name}: ${s.total.toLocaleString("id-ID")} (${fmtPts(s.diff)})`),
    "",
    `Satuan ${unit} · ${social ? `${social} · ` : ""}Dilarang berjudi`,
  ].join("\n");
}

export function Standings({ table, startingPoints, rules, payRule }: { table: TableView; startingPoints: number; rules?: Ruleset; payRule?: "half" | "full" }) {
  const stats = tableStats(table, startingPoints);
  const draws = table.rounds.filter((r) => r.method === "draw").length;
  const wins = table.rounds.filter((r) => r.method !== "draw");
  const avg = wins.length ? (wins.reduce((a, r) => a + r.faan, 0) / wins.length).toFixed(1) : "0.0";
  const sumDiff = Math.round(stats.reduce((a, s) => a + s.diff, 0) * 100) / 100;
  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {stats.map((s, i) => (
          <li key={s.seat} className={`rounded-2xl p-4 ${i === 0 ? "bg-gradient-to-br from-gold-100 to-gold-200 ring-1 ring-gold-300" : "bg-white ring-1 ring-felt-900/8"}`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-lg font-black ${i === 0 ? "bg-felt-800 text-gold-200" : "text-felt-900/45"}`}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-felt-950">{s.name}</p>
                <p className="text-[11px] text-felt-900/55">{s.wins} kali menang dari {table.rounds.length} ronde · {fmtPts(s.diff)} poin{s.memberId ? "" : " · Tamu"}</p>
              </div>
              <p className={`font-display text-2xl font-semibold ${s.diff < 0 ? "text-red-700" : "text-felt-900"}`}>{s.total.toLocaleString("id-ID")}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="rounded-2xl bg-cream-100 p-4 text-sm">
        <p className="label">Catatan</p>
        <div className="mt-1 space-y-1.5">
          <Row label="Round seri" value={`${draws} kali`} />
          <Row label={`Rata-rata ${rules ? unitLabel(rules) : "faan"}`} value={`${avg} per kemenangan`} />
          {payRule && <Row label="Aturan bayar" value={payRule === "half" ? "半銃" : "全銃"} />}
          <Row label="Total selisih" value={fmtPts(sumDiff)} hint={sumDiff === 0 ? "Seimbang — hitungan valid." : "Harusnya nol. Kalau bukan, ada yang salah — kabari saja."} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-felt-900/70">{label}</span>
        <span className="font-mono font-bold text-felt-950">{value}</span>
      </div>
      {hint && <p className="mt-0.5 text-xs text-felt-900/50">{hint}</p>}
    </div>
  );
}

export function RoundHistory({ rounds, players, rules, startingPoints, payRule, onEditFaan, onDelete }: { rounds: RoundView[]; players: SeatPlayer[]; rules: Ruleset; startingPoints: number; payRule?: "half" | "full"; onEditFaan?: (r: RoundView) => void; onDelete?: (r: RoundView) => void }) {
  const unit = unitLabel(rules);
  const [open, setOpen] = useState<number | null>(null);
  if (rounds.length === 0)
    return (
      <div className="card flex flex-col items-center px-5 py-10 text-center">
        <div className="flex gap-1.5"><Tile code="dR" size="sm" /><Tile code="dG" size="sm" /><Tile code="dW" size="sm" /></div>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-felt-900/55">
          Belum ada hand tercatat. Ketuk <b className="text-felt-950">Catat Round</b> setelah hand pertama selesai.
        </p>
      </div>
    );
  return (
    <ol className="space-y-2.5">
      {[...rounds].reverse().map((r, ri) => {
        const idx = rounds.length - ri;
        const st = deriveState(rounds.slice(0, idx - 1));
        const pl = r.players?.length === 4 ? r.players : players;
        const kongTiles = r.details.tiles ? [...new Set(r.details.tiles.filter((t) => r.details.tiles!.filter((x) => x === t).length === 4))] : [];
        const P = faanValue(r.faan, rules);
        const expanded = open === r.id;
        return (
          <li key={r.id} className="card overflow-hidden">
            <div className="flex items-start gap-3 px-4 pt-3">
              <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-cream-100 leading-none">
                <span className="font-han text-sm font-black text-felt-700">{WINDS_ZH[st.roundWind]}</span>
                <span className="mt-0.5 text-[10px] font-bold text-felt-900/50">#{idx}</span>
              </span>
              <p className="min-w-0 flex-1 text-sm leading-snug text-felt-900/80">
                <b className="text-felt-950">Round {idx}</b> · {r.method === "draw" ? "Seri 流局" : <>{pl[r.winnerSeat!]?.name} menang · {r.method === "selfdraw" ? "Zimo" : `HU dari ${pl[r.discarderSeat!]?.name}`}</>}{r.method !== "draw" && <> · {r.faan} {unit}</>}
              </p>
              {(onEditFaan || onDelete) && (
                <div className="flex shrink-0 gap-1">
                  {onEditFaan && (
                    <button onClick={() => onEditFaan(r)} className="rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-red-700 ring-1 ring-red-300 hover:bg-red-50">Edit Faan</button>
                  )}
                  {onDelete && <button onClick={() => onDelete(r)} className="rounded-lg p-1.5 text-felt-900/40 hover:bg-red-50 hover:text-red-600" aria-label="Hapus round"><Icon name="trash" className="h-4 w-4" /></button>}
                </div>
              )}
            </div>

            {r.details.tiles && r.details.tiles.length > 0 && (
              <div className="mt-2 flex flex-wrap items-end gap-0.5 px-4">
                {r.details.tiles.map((t, i) => <Tile key={i} code={t} size="xs" kong={kongTiles.includes(t) && r.details.tiles!.indexOf(t) === i} />)}
                {r.details.flowers?.map((t, i) => <span key={t} className="ml-0.5"><Tile code={t} size="xs" /></span>)}
              </div>
            )}

            {r.method !== "draw" && r.details.patterns.length > 0 && (
              <button type="button" onClick={() => setOpen(expanded ? null : r.id)} className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-between gap-2 rounded-xl bg-cream-100 px-3 py-2 text-left">
                <span className="text-xs font-semibold text-felt-900/70">{expanded ? "Sembunyikan perhitungan" : "Lihat perhitungan poin"}</span>
                <Icon name="chevronDown" className={`h-4 w-4 text-felt-900/40 transition ${expanded ? "rotate-180" : ""}`} />
              </button>
            )}
            {expanded && r.method !== "draw" && (
              <div className="mx-4 mb-3 rounded-xl bg-cream-100 px-3 py-2">
                {r.details.patterns.map((p, i) => (
                  <div key={`${p.key}-${i}`} className="flex items-center justify-between gap-2 py-0.5 text-[13px]">
                    <span className="min-w-0 truncate text-felt-800">{p.key === "extra" ? "Faan manual / tambahan" : PATTERN_MAP[p.key]?.name ?? p.key}</span>
                    <span className="font-mono font-bold text-red-700">+{p.faan}</span>
                  </div>
                ))}
                <div className="mt-1 border-t border-felt-900/10 pt-1">
                  <div className="flex items-center justify-between text-[13px] font-bold text-felt-950">
                    <span>Total {unit}</span><span>{r.faan}</span>
                  </div>
                  <div className="flex items-center justify-between text-[13px] text-felt-900/70">
                    <span>Nilai 1 bagian (P)</span><span className="font-mono">{P.toLocaleString("id-ID")}</span>
                  </div>
                  {pl.map((p, s) => {
                    const d = r.deltas[s] ?? 0;
                    if (d === 0) return null;
                    const label = r.winnerSeat === s ? (r.method === "selfdraw" ? "Pemenang (3 bagian)" : "Pemenang (2 bagian)") : r.discarderSeat === s ? (payRule === "full" ? "Pembuang (bayar semua)" : "Pembuang (penuh)") : "Pemain lain";
                    return (
                      <div key={s} className="flex items-center justify-between text-[13px]">
                        <span className="min-w-0 truncate text-felt-900/70">{p.name} · {label}</span>
                        <span className={`font-mono font-bold ${d > 0 ? "text-felt-700" : "text-red-600"}`}>{fmtPts(d)}</span>
                      </div>
                    );
                  })}
                  <p className="mt-1 text-[11px] text-felt-900/50">Seat Wind {WINDS_ZH[seatWindOf(r.winnerSeat ?? 0, st.dealer)]} · Round Wind {WINDS_ZH[st.roundWind]}</p>
                </div>
              </div>
            )}

            {r.method !== "draw" && (
              <div className="mt-3 grid grid-cols-4 border-t border-felt-900/5 bg-cream-50/60 text-center">
                {pl.map((p, s) => (
                  <div key={s} className="min-w-0 px-1 py-1.5">
                    <p className="truncate text-[10px] text-felt-900/45">{p.name}</p>
                    <p className={`font-mono text-xs font-bold ${r.deltas[s] > 0 ? "text-felt-700" : r.deltas[s] < 0 ? "text-red-600" : "text-felt-900/30"}`}>{fmtPts(r.deltas[s])}</p>
                  </div>
                ))}
              </div>
            )}
            {r.method === "draw" && <p className="px-4 pb-3 pt-1 text-xs text-felt-900/50">Tidak ada poin berpindah. Dealer tetap (連莊).</p>}
          </li>
        );
      })}
    </ol>
  );
}

