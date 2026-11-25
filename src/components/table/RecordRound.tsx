"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, Modal, Segmented, Spinner, Tile } from "@/components/ui";
import { GAME_TYPE_META, PATTERNS, PATTERN_MAP, WINDS_ID, WINDS_ZH, computeDeltas, faanValue, fmtPts, seatWindOf, unitLabel, type Ruleset } from "@/lib/rules";
import { FLOWER_CODES, HONOR_CODES, SEASON_CODES, SUITS, evaluateHand } from "@/lib/tiles";
import type { RoundView, SeatPlayer } from "@/lib/types";

export type RoundPayload = { method: "discard" | "selfdraw" | "draw"; winnerSeat: number | null; discarderSeat: number | null; faan: number; details: RoundView["details"] };

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (p: RoundPayload) => Promise<void>;
  players: SeatPlayer[];
  dealer: number;
  roundWind: number;
  handNo: number;
  rules: Ruleset;
  payRule: "half" | "full";
  base?: string;
  initial?: RoundView | null;
  /** EDIT FAAN: pemenang, cara menang & pembuang dikunci agar angin tidak bergeser */
  faanOnly?: boolean;
};

const SITUATIONAL = ["last_tile", "kong_win", "rob_kong", "double_kong", "heavenly_hand", "earthly_hand", "concealed_triplets", "eighteen_arhats", "dealer_streak", "all_exposed", "last_discard"];

export default function RecordRound({ open, onClose, onSubmit, players, dealer, roundWind, handNo, rules, payRule, base, initial, faanOnly }: Props) {
  const ORDER_KEY = "wm_tile_order";
  const [order, setOrder] = useState<"sorted" | "tapped">("sorted");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(ORDER_KEY) : null;
    if (saved === "tapped" || saved === "sorted") setOrder(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem(ORDER_KEY, order);
  }, [order]);

  const unit = unitLabel(rules);
  const meldCount = 4; // 4 set + 1 pasang = 14 + jumlah kong (maks 18)
  const baseTiles = meldCount * 3 + 2;
  const [step, setStep] = useState<1 | 2>(1);
  const [method, setMethod] = useState<RoundPayload["method"]>("discard");
  const [winner, setWinner] = useState<number | null>(null);
  const [discarder, setDiscarder] = useState<number | null>(null);
  const [mode, setMode] = useState<"manual" | "tiles">("manual");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [manualFaan, setManualFaan] = useState(rules.minFaan || 3);
  const [tiles, setTiles] = useState<string[]>([]);
  const [flowers, setFlowers] = useState<string[]>([]);
  const [concealed, setConcealed] = useState(false);
  const [situ, setSitu] = useState<Record<string, boolean>>({});
  const [suitTab, setSuitTab] = useState<"m" | "s" | "p" | "h">("m");
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [err, setErr] = useState("");
  const rulesRef = useRef(rules);
  rulesRef.current = rules;

  const appliedKey = useRef("");
  useEffect(() => {
    if (!open) { appliedKey.current = ""; return; }
    const key = `${initial?.id ?? "new"}`;
    if (appliedKey.current === key) return; // abaui refresh polling; hanya reset saat modal dibuka utk round berbeda
    appliedKey.current = key;
    const r = rulesRef.current;
    setErr("");
    setSaving(false);
    setScanning(false);
    setScanMsg("");
    setSuitTab("m");
    if (initial) {
      setStep(2);
      setMethod(initial.method);
      setWinner(initial.winnerSeat);
      setDiscarder(initial.discarderSeat);
      setMode(initial.details.mode);
      const c: Record<string, number> = {};
      if (initial.details.mode === "manual") {
        for (const p of initial.details.patterns) {
          if (!PATTERN_MAP[p.key]) continue;
          const unitF = r.patterns[p.key]?.faan || 1;
          c[p.key] = (c[p.key] ?? 0) + Math.max(1, Math.round(p.faan / unitF));
        }
      }
      setCounts(c);
      setManualFaan(initial.faan || r.minFaan || 3);
      setTiles(initial.details.tiles ?? []);
      setFlowers(initial.details.flowers ?? []);
      setConcealed(initial.details.patterns.some((p) => p.key === "concealed"));
      setSitu(Object.fromEntries(initial.details.patterns.filter((p) => SITUATIONAL.includes(p.key)).map((p) => [p.key, true])));
    } else {
      setStep(1);
      setMethod("discard");
      setWinner(null);
      setDiscarder(null);
      setMode("manual");
      setCounts({});
      setManualFaan(r.minFaan || 3);
      setTiles([]);
      setFlowers([]);
      setConcealed(false);
      setSitu({});
    }
  }, [open, initial, rules.minFaan]);

  const winnerWind = winner !== null ? seatWindOf(winner, dealer) : 0;
  const isDealerWin = winner !== null && winner === dealer;

  const evalRes = useMemo(() => {
    if (mode !== "tiles" || winner === null || method === "draw") return null;
    return evaluateHand({ tiles, flowers, selfDraw: method === "selfdraw", concealed, seatWind: winnerWind, roundWind, rules, isDealer: isDealerWin });
  }, [mode, tiles, flowers, method, concealed, winnerWind, roundWind, rules, winner, isDealerWin]);

  const patterns = useMemo(() => {
    if (method === "draw") return [] as { key: string; faan: number }[];
    if (mode === "manual") {
      const list = Object.entries(counts)
        .filter(([k, n]) => n > 0 && rules.patterns[k]?.enabled)
        .map(([k, n]) => ({ key: k, faan: rules.patterns[k].faan * n }));
      if (rules.preset === "taiwan" && isDealerWin && rules.patterns.dealer?.enabled) list.push({ key: "dealer", faan: rules.patterns.dealer.faan });
      for (const k of SITUATIONAL) if (situ[k] && rules.patterns[k]?.enabled && !list.some((l) => l.key === k)) list.push({ key: k, faan: rules.patterns[k].faan });
      return list;
    }
    const base = evalRes?.valid ? [...evalRes.patterns] : [];
    for (const k of SITUATIONAL) if (situ[k] && rules.patterns[k]?.enabled && !base.some((b) => b.key === k)) base.push({ key: k, faan: rules.patterns[k].faan });
    return base;
  }, [method, mode, counts, rules, evalRes, situ, isDealerWin]);

  const patternSum = patterns.reduce((a, b) => a + b.faan, 0);
  // manual mode: angka = total faan. Memilih pola mengisi angkanya otomatis; tetap bisa diubah manual.
  // manual: angka = total faan (bisa diketik). tiles: otomatis dari hasil evaluasi; saat Edit Faan angka bisa diubah manual.
  const rawFaan = mode === "manual" || faanOnly ? manualFaan : patternSum;
  const faan = Math.min(rawFaan, rules.maxFaan);
  const P = faanValue(faan, rules);
  const deltas = computeDeltas({ method, winner, discarder: method === "discard" ? discarder : null, faan, rules, payRule });
  const kongCount = tiles.length ? tiles.filter((t, i) => tiles.indexOf(t) !== -1 && tiles.filter((x) => x === t).length === 4 && tiles.indexOf(t) === i).length : 0;

  const step1Problem = method === "draw" ? null : winner === null ? "Pilih pemenang." : method === "discard" && (discarder === null || discarder === winner) ? "Pilih siapa yang membuang tile." : null;
  const step2Problem =
    method === "draw"
      ? null
      : mode === "tiles" && tiles.length === 0
        ? "Masukkan susunan ubin: ketuk di bawah, atau pakai Scan Your Hand."
        : mode === "tiles" && !evalRes?.valid
          ? evalRes?.message ?? "Susunan ubin belum menjadi tangan menang."
          : faan < rules.minFaan
            ? `Minimal ${rules.minFaan} ${unit} untuk menang (sekarang ${faan}).`
            : mode === "manual" && patterns.length === 0 && manualFaan === 0 && rules.patterns.chicken_hand && !rules.patterns.chicken_hand.enabled
              ? "Pilih minimal satu pola."
              : null;

  async function save() {
    const p = step1Problem ?? step2Problem;
    if (p) return setErr(p);
    setSaving(true);
    setErr("");
    try {
      await onSubmit({
        method,
        winnerSeat: method === "draw" ? null : winner,
        discarderSeat: method === "discard" ? discarder : null,
        faan: method === "draw" ? 0 : faan,
        details: {
          mode,
          patterns: patterns.length ? patterns : faan > 0 ? [{ key: "extra", faan }] : [],
          tiles: mode === "tiles" ? tiles : undefined,
          flowers: mode === "tiles" ? flowers : undefined,
        },
      });
    } catch (e) {
      setErr((e as Error).message);
      setSaving(false);
    }
  }

  function next() {
    if (step1Problem) return setErr(step1Problem);
    setErr("");
    if (method === "draw") return save();
    setStep(2);
  }

  const bump = (key: string, delta: number) => {
    setCounts((c) => {
      const max = PATTERN_MAP[key]?.stackable ? 4 : 1;
      const next = { ...c, [key]: Math.max(0, Math.min(max, (c[key] ?? 0) + delta)) };
      // sync angka total dari pola terpilih
      const sum = Object.entries(next).reduce((a, [k, n]) => (n > 0 && rules.patterns[k]?.enabled ? a + rules.patterns[k].faan * n : a), 0)
        + (rules.preset === "taiwan" && isDealerWin && rules.patterns.dealer?.enabled ? rules.patterns.dealer.faan : 0)
        + SITUATIONAL.reduce((a, k) => (situ[k] && rules.patterns[k]?.enabled ? a + rules.patterns[k].faan : a), 0);
      setManualFaan(sum);
      return next;
    });
  };
  const toggleSitu = (k: string) => {
    const on = !situ[k];
    setSitu((x) => ({ ...x, [k]: on }));
    if (mode !== "manual") return; // mode ubin: total otomatis dari evaluasi, biarkan angka tetap
    const sum = Object.entries(counts).reduce((a, [key, n]) => (n > 0 && rules.patterns[key]?.enabled ? a + rules.patterns[key].faan * n : a), 0)
      + (rules.preset === "taiwan" && isDealerWin && rules.patterns.dealer?.enabled ? rules.patterns.dealer.faan : 0)
      + SITUATIONAL.reduce((a, kk) => ((kk === k ? on : situ[kk]) && rules.patterns[kk]?.enabled ? a + rules.patterns[kk].faan : a), 0);
    setManualFaan(sum);
  };

  const shownTiles = order === "tapped" ? tiles : [...tiles].sort(tileSort);
  const tileCount = (c: string) => tiles.filter((t) => t === c).length;
  const addTile = (code: string) => {
    const maxTotal = baseTiles + kongCount + (tileCount(code) === 3 ? 1 : 0);
    if (tiles.length >= maxTotal) {
      const limit = baseTiles + kongCount;
      return setErr(tiles.length >= limit ? `Sudah ${limit} ubin (${baseTiles} + ${kongCount} kong). Ketuk ubin di tangan untuk menghapus.` : "Maksimal 4 ubin yang sama (kong).");
    }
    setErr("");
    setTiles((t) => [...t, code]);
  };

  async function onScan(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErr("File harus foto.");
    setScanning(true);
    setScanMsg("");
    setErr("");
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          const max = 900;
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * s);
          c.height = Math.round(img.height * s);
          c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL("image/jpeg", 0.8));
          URL.revokeObjectURL(url);
        };
        img.onerror = () => rej(new Error("read"));
        img.src = url;
      });
      const { recognizeHandLocal } = await import("@/lib/scanHandLocal");
      try {
        const local = await recognizeHandLocal(dataUrl);
        if (!local.tiles.length) throw new Error(local.message);
        setMode("tiles");
        // Hasil scan menggantikan pilihan dan dicek lagi oleh pengguna sebelum disimpan.
        setTiles([...local.tiles].sort(tileSort).slice(0, 18));
        setFlowers([...local.flowers]);
        setScanMsg(`${local.message} Ketuk ubin yang terbaca salah untuk menghapusnya.`);
      } catch (scanErr) {
        setErr(`${(scanErr as Error).message} Anda tetap bisa pilih ubin secara manual di bawah.`);
        return;
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setScanning(false);
    }
  }

  const SeatBtn = ({ s, selected, onClick, disabled }: { s: number; selected: boolean; onClick: () => void; disabled?: boolean }) => {
    const w = seatWindOf(s, dealer);
    return (
      <button type="button" disabled={disabled} onClick={onClick} className={`flex min-w-0 items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition disabled:opacity-25 ${selected ? "border-felt-700 bg-felt-700 text-cream-50 shadow-lg shadow-felt-900/20" : "border-felt-900/10 bg-white hover:border-felt-500"}`}>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-han text-base font-black ${w === 0 ? "bg-red-700 text-white" : selected ? "bg-white/15 text-gold-200" : "bg-felt-50 text-felt-700"}`}>{WINDS_ZH[w]}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{players[s]?.name}</span>
          <span className={`block text-[10px] ${selected ? "text-cream-50/60" : "text-felt-900/45"}`}>{WINDS_ID[w]}{w === 0 ? " · Dealer" : ""}</span>
        </span>
      </button>
    );
  };

  const summary = method === "draw" ? "Seri · 流局" : `${winner !== null ? players[winner]?.name : "?"} · ${method === "selfdraw" ? "Zimo 自摸" : `Hu dari ${discarder !== null ? players[discarder]?.name : "?"}`}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={faanOnly ? `Edit Faan · Hand #${handNo}` : initial ? "Edit round" : `Catat Round ${handNo}`}
      subtitle={faanOnly ? "Pemenang, cara menang & pembuang dikunci — angin tidak bergeser." : `Seat Wind ${WINDS_ZH[winnerWind]} · Round Wind ${WINDS_ZH[roundWind]} ${WINDS_ID[roundWind]}`}
      footer={
        <div className="flex flex-col gap-3">
          {step === 2 && method !== "draw" && (
            <div className="grid grid-cols-4 gap-1.5">
              {players.map((p, s) => (
                <div key={s} className="min-w-0 rounded-xl bg-cream-100 px-2 py-1.5 text-center">
                  <p className="truncate text-[10px] font-semibold text-felt-900/55">{p.name}</p>
                  <p className={`font-mono text-sm font-bold ${deltas[s] > 0 ? "text-felt-700" : deltas[s] < 0 ? "text-red-600" : "text-felt-900/35"}`}>{fmtPts(deltas[s])}</p>
                </div>
              ))}
            </div>
          )}
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
          <div className="flex gap-2">
            {step === 2 && !faanOnly && <button onClick={() => { setStep(1); setErr(""); }} className="btn-ghost"><Icon name="arrowLeft" className="h-4 w-4" /> Kembali</button>}
            {step === 1 ? (
              <button onClick={next} disabled={saving} className="btn-primary flex-1 py-3.5 uppercase tracking-wide">
                {method === "draw" ? "Simpan hand seri" : <>Lanjut hitung {unit} <Icon name="arrowRight" className="h-4 w-4" /></>}
              </button>
            ) : (
              <button onClick={save} disabled={saving} className="btn-primary flex-[2] py-3.5 uppercase tracking-wide">
                {saving ? <Spinner className="h-4 w-4" /> : <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />}
                {faanOnly ? "Simpan faan" : method !== "draw" ? `Pakai ${faan} ${unit}` : "Simpan hand seri"}
              </button>
            )}
          </div>
        </div>
      }
    >
      {step === 1 ? (
        <div className="space-y-6">
          <section>
            <p className="label">Hasil hand</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                ["discard", "Hu", "食糊 · dari buangan"],
                ["selfdraw", "Zimo", "自摸 · ambil sendiri"],
                ["draw", "Seri", "流局 · dinding habis"],
              ] as const).map(([k, t, d]) => (
                <button key={k} type="button" disabled={faanOnly} onClick={() => { setMethod(k); setErr(""); }} className={`rounded-2xl border p-3 text-left transition disabled:opacity-50 ${method === k ? "border-felt-700 bg-felt-700 text-cream-50 shadow-lg" : "border-felt-900/10 bg-white hover:border-felt-500"}`}>
                  <p className="font-display text-xl font-semibold">{t}</p>
                  <p className={`text-[11px] leading-snug ${method === k ? "text-cream-50/65" : "text-felt-900/50"}`}>{d}</p>
                </button>
              ))}
            </div>
          </section>
          {method !== "draw" && (
            <section>
              <p className="label">Siapa yang menang?</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[0, 1, 2, 3].map((s) => <SeatBtn key={s} s={s} selected={winner === s} onClick={() => { setWinner(s); if (discarder === s) setDiscarder(null); setErr(""); }} />)}
              </div>
            </section>
          )}
          {method === "discard" && (
            <section>
              <p className="label">Siapa yang membuang tile? (出銃)</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[0, 1, 2, 3].map((s) => <SeatBtn key={s} s={s} selected={discarder === s} disabled={s === winner} onClick={() => { setDiscarder(s); setErr(""); }} />)}
              </div>
            </section>
          )}
          {method === "draw" && <div className="rounded-2xl bg-cream-100 p-4 text-sm text-felt-900/70">Dinding habis tanpa pemenang. Poin tidak berubah dan dealer tetap (連莊).</div>}
        </div>
      ) : (
        <div className="space-y-4 overflow-x-hidden">
          {/* 1) TOTAL FAAN + pola — selalu paling atas */}
          <div className="flex overflow-hidden rounded-3xl ring-1 ring-felt-900/10">
            <div className="flex w-24 shrink-0 flex-col items-center justify-center bg-red-700 px-2 py-4 sm:w-28 text-white">
              <span className="font-display text-4xl font-black leading-none">{faan}</span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em]">{unit}</span>
            </div>
            <div className="min-w-0 flex-1 bg-white px-4 py-3">
              <p className="truncate text-sm font-semibold text-felt-950">{summary}</p>
              <p className="text-[11px] text-felt-900/50">{baseTiles}{kongCount ? ` + ${kongCount} kong` : ""} ubin · {P.toLocaleString("id-ID")} poin/bagian · {payRule === "half" ? "半銃" : "全銃"}</p>
              <ul className="mt-1.5 max-h-28 space-y-0.5 overflow-y-auto">
                {patterns.length === 0 && <li className="text-xs text-felt-900/40">Belum ada pola.</li>}
                {patterns.map((p, i) => (
                  <li key={`${p.key}-${i}`} className="flex items-center justify-between gap-2 text-[13px]">
                    <span className="min-w-0 truncate text-felt-800">{p.key === "extra" ? "Faan manual / tambahan" : `${PATTERN_MAP[p.key]?.name ?? p.key}`}</span>
                    <span className="shrink-0 font-mono font-bold text-red-700">+{p.faan}</span>
                  </li>
                ))}
              </ul>
              {faan > 0 && <p className="mt-1 text-[11px] text-felt-900/45">Pemenang menerima {fmtPts(deltas[winner ?? 0])} poin.</p>}
            </div>
          </div>

          {/* 2) SCAN YOUR HAND */}
          {!faanOnly && (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold-400/80 bg-gold-50/60 py-3.5 text-sm font-bold uppercase tracking-widest text-felt-800 transition hover:bg-gold-50">
              <Icon name="camera" className="h-5 w-5" /> {scanning ? "Membaca foto…" : "Scan Your Hand"}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onScan} disabled={scanning} />
            </label>
          )}
          {scanMsg && <p className="rounded-xl bg-felt-50 px-3 py-2 text-xs text-felt-800">{scanMsg}</p>}
          {scanning && <div className="flex justify-center py-2 text-felt-700"><Spinner /></div>}

          {/* 3) mode pilih ubin / manual */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {!faanOnly && <Segmented size="sm" value={mode} onChange={(v) => { setMode(v); setErr(""); }} options={[{ value: "tiles", label: "Pilih Ubin" }, { value: "manual", label: "Faan Manual" }]} />}
            {mode === "tiles" && !faanOnly && (
              <Segmented size="sm" value={order} onChange={setOrder} options={[{ value: "sorted", label: "Urut otomatis" }, { value: "tapped", label: "Urut ketukan" }]} />
            )}
            {(mode === "manual" || faanOnly) && (
              <div className="flex items-center gap-2">
                <span className="label mb-0">Total {unit}</span>
                <div className="flex items-center gap-1 rounded-full bg-white p-1 ring-1 ring-felt-900/10">
                  <button type="button" onClick={() => setManualFaan(Math.max(0, manualFaan - 1))} className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold text-felt-700 transition hover:bg-felt-50 active:scale-95" aria-label={`Kurangi ${unit}`}>−</button>
                  <input
                    type="number"
                    min={0}
                    max={rules.maxFaan}
                    value={manualFaan}
                    onChange={(e) => setManualFaan(Math.max(0, Math.min(rules.maxFaan, Number(e.target.value) || 0)))}
                    className="w-12 bg-transparent text-center font-mono text-lg font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    aria-label={`Total ${unit}`}
                  />
                  <button type="button" onClick={() => setManualFaan(Math.min(rules.maxFaan, manualFaan + 1))} className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold text-felt-700 transition hover:bg-felt-50 active:scale-95" aria-label={`Tambah ${unit}`}>+</button>
                </div>
              </div>
            )}
          </div>

          {mode === "manual" ? (
            <div className="space-y-4">
              {(["hand", "bonus", "limit"] as const).map((cat) => {
                const list = PATTERNS.filter((p) => p.category === cat && rules.patterns[p.key]?.enabled && p.key !== "dealer" && p.key !== "chicken_hand");
                if (!list.length) return null;
                return (
                  <div key={cat}>
                    <p className="mb-2 text-xs font-semibold text-felt-900/50">{cat === "hand" ? "Pola tangan" : cat === "bonus" ? "Bonus" : "Limit / khusus"}</p>
                    <div className="flex flex-wrap gap-2">
                      {list.map((p) => {
                        const n = counts[p.key] ?? 0;
                        return (
                          <div key={p.key} className={`flex items-center overflow-hidden rounded-full border text-sm transition ${n ? "border-felt-700 bg-felt-700 text-cream-50" : "border-felt-900/12 bg-white text-felt-900"}`}>
                            <button type="button" onClick={() => bump(p.key, n && !p.stackable ? -1 : 1)} className="flex items-center gap-1.5 py-1.5 pl-3 pr-2.5 font-medium disabled:opacity-50" title={p.desc}>
                              <span className="font-han text-xs opacity-70">{p.zh}</span>
                              {p.name}
                              <span className={`rounded-full px-1.5 text-[11px] font-bold ${n ? "bg-gold-400 text-felt-950" : "bg-gold-100 text-gold-600"}`}>{n > 1 ? `${n}×` : ""}{rules.patterns[p.key].faan}</span>
                            </button>
                            {p.stackable && n > 0 && <button type="button" onClick={() => bump(p.key, -1)} className="border-l border-white/20 px-2.5 py-1.5 font-bold" aria-label="Kurangi">−</button>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {rules.preset === "taiwan" && isDealerWin && rules.patterns.dealer?.enabled && <p className="rounded-xl bg-felt-50 px-3 py-2 text-xs text-felt-800">Dealer menang: +{rules.patterns.dealer.faan} tai 莊家 otomatis.</p>}
              {faanOnly && <p className="rounded-xl bg-gold-50 px-3 py-2 text-xs text-gold-600">Mode Edit Faan: pola boleh disesuaikan, tetapi pemenang & pembuang tetap.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {faanOnly && (
                <div className="rounded-xl bg-gold-50 px-3 py-2 text-xs text-gold-600 ring-1 ring-gold-200">Mode Edit Faan: susunan ubin terkunci — yang bisa diubah hanya total {unit} & pola.</div>
              )}
              <div className="felt rounded-2xl p-3">
                <div className="mb-2 flex items-center justify-between text-xs text-cream-50/70">
                  <span>Tangan {players[winner ?? 0]?.name} · <b className="text-gold-200">{tiles.length}</b> ubin{tiles.length ? ` (butuh ${baseTiles + kongCount})` : ""}{kongCount ? ` · ${kongCount} KONG` : ""}</span>
                  {tiles.length > 0 && !faanOnly && <button type="button" onClick={() => { setTiles([]); setFlowers([]); }} className="font-semibold text-gold-300 hover:underline">Kosongkan</button>}
                </div>
                <div className="flex min-h-[64px] flex-wrap items-end gap-1">
                  {tiles.length === 0 && <p className="self-center text-sm text-cream-50/45">Ketuk ubin di bawah. Kong = 4 ubin sama.</p>}
                  {shownTiles.map((t, i) => {
                    const isKong = tileCount(t) === 4 && tiles.indexOf(t) === i;
                    return <Tile key={`${t}-${i}`} code={t} size="sm" kong={isKong} onClick={faanOnly ? undefined : () => setTiles((arr) => arr.filter((_, k) => k !== i))} title="Ketuk untuk hapus" />;
                  })}
                </div>
                {flowers.length > 0 && (
                  <div className="mt-2 flex items-end gap-1 border-t border-white/10 pt-2">
                    <span className="mr-1 self-center text-[10px] font-semibold uppercase tracking-wider text-cream-50/50">Bunga</span>
                    {flowers.map((f) => <Tile key={f} code={f} size="xs" onClick={() => setFlowers((arr) => arr.filter((x) => x !== f))} />)}
                  </div>
                )}
                {evalRes && !evalRes.valid && <p className="mt-2 rounded-xl bg-red-500/20 px-3 py-2 text-xs font-semibold text-red-100">{evalRes.message}</p>}
              </div>
              {!faanOnly && (
                <div>
                  <div className="-mx-1 mb-3 overflow-x-auto px-1 scrollbar-none">
                    <Segmented size="sm" value={suitTab} onChange={setSuitTab} options={[...SUITS.map((x) => ({ value: x.key, label: `${x.zh} ${x.name}` })), { value: "h" as const, label: "字 Angin & Naga" }]} />
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {(suitTab === "h" ? HONOR_CODES : Array.from({ length: 9 }, (_, i) => `${suitTab}${i + 1}`)).map((c) => (
                      <Tile key={c} code={c} size="md" onClick={() => addTile(c)} dim={tileCount(c) >= 4} badge={tileCount(c) || undefined} />
                    ))}
                  </div>
                </div>
              )}
              {!faanOnly && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-felt-900/50">Bunga & musim (nomor sesuai angin: 1 Timur, 2 Selatan, 3 Barat, 4 Utara)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...FLOWER_CODES, ...SEASON_CODES].map((c) => (
                      <Tile key={c} code={c} size="sm" selected={flowers.includes(c)} onClick={() => setFlowers((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]))} />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {rules.patterns.concealed?.enabled && <Toggle on={concealed} onClick={() => setConcealed(!concealed)} label={rules.preset === "taiwan" ? "Menqing 門清" : "Concealed 門前清"} />}
                {SITUATIONAL.filter((k) => rules.patterns[k]?.enabled).map((k) => (
                  <Toggle key={k} on={!!situ[k]} onClick={() => toggleSitu(k)} label={`${PATTERN_MAP[k].name} ${PATTERN_MAP[k].zh}`} />
                ))}
              </div>
              {evalRes?.valid && <p className="rounded-xl bg-felt-50 px-3 py-2 text-xs font-semibold text-felt-800">{evalRes.message} · {evalRes.kongs.length} kong</p>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function tileSort(a: string, b: string) {
  const order = (c: string) => {
    const g = "mspwd".indexOf(c[0]);
    const v = c[0] === "w" ? "ESWN".indexOf(c[1]) : c[0] === "d" ? "RGW".indexOf(c[1]) : Number(c.slice(1));
    return g * 10 + v;
  };
  return order(a) - order(b);
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className={`chip border py-1.5 text-[13px] transition ${on ? "border-felt-700 bg-felt-700 text-cream-50" : "border-felt-900/12 bg-white text-felt-800 hover:border-felt-500"}`}>
      <span className={`flex h-3.5 w-3.5 items-center justify-center rounded ${on ? "bg-gold-400 text-felt-950" : "ring-1 ring-felt-900/25"}`}>{on && <Icon name="check" className="h-3 w-3" strokeWidth={3} />}</span>
      {label}
    </button>
  );
}
