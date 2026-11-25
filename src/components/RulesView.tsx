"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, Tile } from "./ui";
import { GAME_TYPES, GAME_TYPE_META, PATTERNS, PRESET_LABEL, defaultRuleset, payoutRows, unitLabel, type GameType, type PatternCategory, type Ruleset } from "@/lib/rules";
import { FLOWER_CODES, HONOR_CODES, SEASON_CODES, SUITS } from "@/lib/tiles";

type Tab = "tiles" | "hand" | "limit" | "bonus" | "points";

export default function RulesView({
  rules,
  venueName = "",
  onClose,
  gameType,
  onGameTypeChange,
}: {
  rules: Ruleset;
  venueName?: string;
  onClose?: () => void;
  gameType?: GameType;
  onGameTypeChange?: (t: GameType) => void;
}) {
  const [internalType, setInternalType] = useState<GameType>(gameType ?? rules.preset ?? "classic");
  const type = gameType ?? internalType;
  const setType = (t: GameType) => {
    setInternalType(t);
    onGameTypeChange?.(t);
  };
  const eff: Ruleset = type === rules.preset ? rules : defaultRuleset(type);
  const unit = unitLabel(eff);
  const [tab, setTab] = useState<Tab>("hand");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PATTERNS.filter((p) => {
      if (!eff.patterns[p.key]?.enabled) return false;
      const matchCat = tab === "tiles" || tab === "points" ? true : p.category === (tab as PatternCategory);
      if (!matchCat) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.zh.includes(q) || p.desc.toLowerCase().includes(q) || p.key.toLowerCase().includes(q);
    });
  }, [tab, search, eff]);

  const catDesc: Record<Tab, string> = {
    hand: "Nilai pola tangan. Masih bisa bertambah dengan faan Angin, Naga, Bunga, dan Kondisi Menang.",
    limit: "Tangan limit dibayar batas maksimum dan tidak ditumpuk pola lain.",
    bonus: "Bonus dari kondisi menang, bunga/musim, dealer, dan angin/naga.",
    points: `Tabel konversi ${unit} menjadi poin per bagian (sebelum aturan bayar room).`,
    tiles: `Daftar tile mahjong dengan ilustrasi asli. Mode ini memakai ${eff.handTiles} tile di tangan.`,
  };

  return (
    <div className="flex flex-col">
      <div className="pb-4 text-center">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-gold-400/80" />
        <h2 className="font-display text-3xl font-semibold tracking-tight text-felt-800">House Rules</h2>
        <p className="mt-1 text-xs text-felt-800/70">{venueName ? `${venueName} · ` : ""}{GAME_TYPE_META[type].label} · diatur oleh host</p>
        {onGameTypeChange ? (
          <div className="mt-4 grid grid-cols-2 gap-1 rounded-3xl bg-white p-1 shadow-xs ring-1 ring-felt-900/10 sm:grid-cols-4">
            {GAME_TYPES.map((t) => (
              <button key={t} type="button" onClick={() => setType(t)} className={`rounded-2xl px-2 py-2 text-[11px] font-bold uppercase tracking-wide transition ${type === t ? "bg-felt-700 text-cream-50 shadow-sm" : "text-felt-900/60 hover:text-felt-950"}`}>
                {GAME_TYPE_META[t].short}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex justify-center">
            <span className="chip bg-felt-700 text-cream-50">{GAME_TYPE_META[type].label}</span>
          </div>
        )}
        <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-felt-900/55">{GAME_TYPE_META[type].desc}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          <span className="chip bg-felt-700 text-cream-50">{PRESET_LABEL[type]}</span>
          <span className="chip bg-gold-100 text-gold-600">Min {eff.minFaan} {unit}</span>
          <span className="chip bg-gold-100 text-gold-600">Batas {eff.maxFaan} {unit}</span>
          <span className="chip bg-felt-50 text-felt-700">{eff.handTiles} tile</span>
          <Link href={`/panduan/${type}`} className="chip bg-white text-felt-700 ring-1 ring-felt-900/10 hover:ring-felt-500"><Icon name="book" className="h-3 w-3" /> Panduan lengkap</Link>
        </div>
      </div>

      <div className="relative mb-3">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pola — mis. dragon, kong, flower" className="w-full rounded-2xl border border-felt-900/15 bg-white px-4 py-2.5 text-sm text-felt-950 outline-none transition placeholder:text-felt-900/40 focus:border-felt-600 focus:ring-4 focus:ring-felt-600/10" />
        {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-felt-900/40 hover:text-felt-900">✕</button>}
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2 scrollbar-none">
        {([
          { k: "tiles", label: "TILES" },
          { k: "hand", label: "POLA TANGAN" },
          { k: "limit", label: "LIMIT" },
          { k: "bonus", label: "BONUS" },
          { k: "points", label: "TABEL POIN" },
        ] as const).map((c) => (
          <button key={c.k} type="button" onClick={() => { setTab(c.k); setSearch(""); }} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold tracking-wider transition ${tab === c.k ? "bg-felt-700 text-cream-50 shadow-sm" : "border border-felt-900/12 bg-white text-felt-900/60 hover:text-felt-950"}`}>
            {c.label}
          </button>
        ))}
      </div>

      <p className="my-3 text-xs leading-relaxed text-felt-900/60">{catDesc[tab]}</p>

      {tab === "points" && (
        <div className="overflow-hidden rounded-3xl border border-felt-900/8 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-felt-800 text-left text-cream-50">
              <tr>
                <th className="px-4 py-2.5 font-semibold capitalize">{unit}</th>
                <th className="px-4 py-2.5 text-right font-semibold">Nilai 1 bagian (P)</th>
                <th className="hidden px-4 py-2.5 text-right font-semibold sm:table-cell">Zimo total (3×P)</th>
              </tr>
            </thead>
            <tbody>
              {payoutRows(eff).map(({ faan: f, discard: P }) => {
                return (
                  <tr key={f} className={`border-t border-felt-900/6 ${f < eff.minFaan ? "text-felt-900/35" : ""}`}>
                    <td className="px-4 py-2 font-semibold">{f}{f === eff.maxFaan ? " (batas)" : ""}</td>
                    <td className="px-4 py-2 text-right font-mono">{P.toLocaleString("id-ID")}</td>
                    <td className="hidden px-4 py-2 text-right font-mono sm:table-cell">{(P * 3).toLocaleString("id-ID")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="bg-cream-100 px-4 py-2.5 text-xs text-felt-900/60">
{eff.preset === "taiwan" ? `Taiwan: poin per bagian = tai × ${eff.multiplier}. ` : ""}Di aplikasi P adalah nilai penuh: 半銃 — pembuang membayar P, dua pemain lain P/2, pemenang menerima 2P. 全銃 — pembuang membayar 2P. Zimo — tiap lawan membayar P (pemenang 3P).
          </p>
        </div>
      )}

      {tab === "tiles" && (
        <div className="space-y-4 pt-1">
          {SUITS.map((s) => (
            <div key={s.key} className="rounded-3xl border border-felt-900/8 bg-white p-3.5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-felt-900/50">{s.name} · <span className="font-han font-black text-felt-700">{s.zh}</span></p>
              <div className="flex flex-wrap gap-1.5">{Array.from({ length: 9 }, (_, i) => <Tile key={i} code={`${s.key}${i + 1}`} size="sm" />)}</div>
            </div>
          ))}
          <div className="rounded-3xl border border-felt-900/8 bg-white p-3.5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-felt-900/50">Winds & Dragons · 字牌</p>
            <div className="flex flex-wrap gap-1.5">{HONOR_CODES.map((c) => <Tile key={c} code={c} size="sm" />)}</div>
          </div>
          <div className="rounded-3xl border border-felt-900/8 bg-white p-3.5">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-felt-900/50">Flowers & Seasons · 花牌</p>
            <p className="mb-2.5 text-[11px] text-felt-900/55">Nomor 1 = Timur, 2 = Selatan, 3 = Barat, 4 = Utara. Set 4 lengkap menggantikan bunga kursi di set itu.</p>
            <div className="flex flex-wrap gap-1.5">{[...FLOWER_CODES, ...SEASON_CODES].map((c) => <Tile key={c} code={c} size="sm" />)}</div>
          </div>
        </div>
      )}

      {tab !== "tiles" && tab !== "points" && (
        <div className="space-y-3">
          {filtered.length === 0 && <div className="rounded-3xl border border-dashed border-felt-900/15 p-8 text-center text-sm text-felt-900/50">Tidak ada pola cocok dengan “{search}”.</div>}
          {filtered.map((p) => {
            const faan = eff.patterns[p.key].faan;
            return (
              <div key={p.key} className="rounded-3xl border border-felt-900/8 bg-white p-4 shadow-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold text-felt-800">{p.name} <span className="font-han text-sm font-black text-felt-700/60">{p.zh}</span></h3>
                    <p className="mt-0.5 text-xs text-felt-900/65">{p.desc}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-red-700 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white">{faan} {unit}</span>
                </div>
                {p.exampleTiles && p.exampleTiles.length > 0 && (
                  <div className="mt-3.5 space-y-1.5 rounded-2xl bg-cream-50/70 p-3 ring-1 ring-felt-900/5">
                    {p.exampleTiles.map((row, ri) => (
                      <div key={ri} className="flex flex-wrap items-end gap-1">{row.map((code, ci) => <Tile key={`${code}-${ci}`} code={code} size="xs" />)}</div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {onClose && (
        <div className="sticky bottom-0 mt-6 bg-gradient-to-t from-cream-100 via-cream-100 to-transparent pt-3">
          <button type="button" onClick={onClose} className="w-full rounded-2xl bg-felt-700 py-3.5 text-center text-sm font-bold uppercase tracking-widest text-cream-50 shadow-md transition hover:bg-felt-800 active:scale-[0.99]">Tutup</button>
        </div>
      )}
    </div>
  );
}
