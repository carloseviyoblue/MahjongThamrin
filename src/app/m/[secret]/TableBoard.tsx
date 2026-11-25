"use client";

import { Tile } from "@/components/ui";
import { WINDS_ID, WINDS_ZH, fmtPts, seatWindOf } from "@/lib/rules";
import type { TableView } from "@/lib/types";

type BoardSeatProps = {
  table: TableView;
  seat: number;
};

function BoardSeat({ table, seat }: BoardSeatProps) {
  const { dealer } = table.state;
  const last = table.rounds[table.rounds.length - 1];
  const leader = Math.max(...table.totals);
  const wind = seatWindOf(seat, dealer);
  const isDealer = wind === 0;
  const diff = table.totals[seat] - table.startingPoints;
  const lastDelta = last?.deltas[seat] ?? 0;
  const won = last && last.winnerSeat === seat && last.method !== "draw";

  return (
    <div className={`relative flex min-w-0 flex-col items-center rounded-2xl p-2.5 text-center transition sm:p-3.5 ${isDealer ? "bg-gradient-to-br from-gold-200 to-gold-400 text-felt-950 shadow-lg shadow-gold-500/30 ring-2 ring-red-600/70" : "bg-white text-felt-950 shadow-md shadow-felt-950/20"}`}>
      <div className="flex items-center justify-center gap-1.5">
        <span className={`font-han text-2xl font-black leading-none ${isDealer ? "text-felt-900" : "text-felt-700"}`}>{WINDS_ZH[wind]}</span>
        {isDealer && <span className="flex h-4 w-4 items-center justify-center rounded bg-felt-700 font-han text-[9px] font-bold text-cream-50">莊</span>}
        {table.totals[seat] === leader && table.rounds.length > 0 && <span className="text-xs" title="Teratas">👑</span>}
      </div>
      <p className="mt-1 w-full truncate text-[13px] font-semibold sm:text-sm">{table.players[seat]?.name}</p>
      <p className={`font-display text-[26px] font-semibold leading-tight tracking-tight sm:text-[30px] ${diff < 0 ? "text-red-700" : ""}`}>{table.totals[seat].toLocaleString("id-ID")}</p>
      <p className={`text-[11px] font-semibold ${diff > 0 ? (isDealer ? "text-felt-800" : "text-felt-600") : diff < 0 ? (isDealer ? "text-red-700" : "text-red-500") : isDealer ? "text-felt-900/50" : "text-felt-900/35"}`}>{fmtPts(diff)}</p>
      {last && lastDelta !== 0 && (
        <span key={last.id} className={`absolute -top-2 right-1 animate-pop rounded-full px-1.5 py-0.5 text-[10px] font-bold shadow ${lastDelta > 0 ? "bg-felt-700 text-cream-50" : "bg-red-600 text-white"}`}>
          {won ? "🀄 " : ""}{fmtPts(lastDelta)}
        </span>
      )}
    </div>
  );
}

export default function TableBoard({ table }: { table: TableView }) {
  const { roundWind, finished } = table.state;
  return (
    <div className="felt relative overflow-hidden rounded-[30px] p-4 shadow-xl shadow-felt-950/30 sm:p-5">
      <div className="pointer-events-none absolute inset-3 rounded-[24px] border border-white/10" />
      <div className="relative mx-auto max-w-md">
        <div className="flex justify-center">
          <div className="w-[52%] min-w-[132px]"><BoardSeat table={table} seat={2} /></div>
        </div>
        <div className="my-2.5 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2.5">
          <div className="min-w-0"><BoardSeat table={table} seat={3} /></div>
          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-2xl bg-black/20 text-center ring-1 ring-gold-300/25 sm:h-32 sm:w-32">
            <div className="flex gap-1">
              <Tile code="p2" size="xs" /><Tile code="p3" size="xs" /><Tile code="p4" size="xs" />
            </div>
            <p className="mt-1.5 font-han text-5xl font-black leading-none text-gold-300">{WINDS_ZH[roundWind]}</p>
            <p className="mt-1 text-[11px] font-semibold leading-tight text-cream-50/85">Putaran {WINDS_ID[roundWind]}</p>
            <p className="text-[11px] text-cream-50/60">Hand {table.state.handNo}</p>
            {finished && <p className="mt-1 rounded-full bg-gold-400/20 px-1.5 text-[9px] font-bold text-gold-200">4 angin selesai</p>}
          </div>
          <div className="min-w-0"><BoardSeat table={table} seat={1} /></div>
        </div>
        <div className="flex justify-center">
          <div className="w-[52%] min-w-[132px]"><BoardSeat table={table} seat={0} /></div>
        </div>
      </div>
    </div>
  );
}
