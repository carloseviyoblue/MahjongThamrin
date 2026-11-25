"use client";

import { useEffect, useRef, useState } from "react";
import { Icon, Spinner, api } from "@/components/ui";
import { WINDS, WINDS_ID, WINDS_ZH } from "@/lib/rules";
import type { SeatPlayer } from "@/lib/types";

type MemberHit = { id: number; name: string; phone: string };

export function SeatInputs({ base, players, onChange }: { base: string; players: SeatPlayer[]; onChange: (p: SeatPlayer[]) => void }) {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2, 3].map((i) => (
        <SeatInput
          key={i}
          base={base}
          seat={i}
          value={players[i] ?? { name: "", memberId: null }}
          onChange={(v) => onChange([0, 1, 2, 3].map((k) => (k === i ? v : players[k] ?? { name: "", memberId: null })))}
          taken={players.filter((_, k) => k !== i).map((x) => x?.memberId).filter((x): x is number => !!x)}
        />
      ))}
    </div>
  );
}

export function validatePlayers(players: SeatPlayer[]): string | null {
  const names = [0, 1, 2, 3].map((i) => (players[i]?.name ?? "").trim());
  if (names.some((n) => !n)) return "Isi nama keempat pemain.";
  if (new Set(names.map((n) => n.toLowerCase())).size !== 4) return "Nama pemain tidak boleh sama.";
  return null;
}

export default function PlayerSetup({ base, initial, onSave, onCancel, note, submitLabel = "Simpan pemain" }: { base: string; initial: SeatPlayer[]; onSave: (p: SeatPlayer[]) => Promise<void>; onCancel?: () => void; note?: string; submitLabel?: string }) {
  const [players, setPlayers] = useState<SeatPlayer[]>(() => [0, 1, 2, 3].map((i) => initial[i] ?? { name: "", memberId: null }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validatePlayers(players);
    if (v) return setErr(v);
    setSaving(true);
    setErr("");
    try {
      await onSave(players.map((p) => ({ ...p, name: p.name.trim() })));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      {note && <p className="rounded-xl bg-gold-50 px-3 py-2 text-sm text-gold-600">{note}</p>}
      <SeatInputs base={base} players={players} onChange={(p) => { setPlayers(p); setErr(""); }} />
      {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
      <div className="flex gap-2 pt-1">
        {onCancel && <button type="button" onClick={onCancel} className="btn-ghost flex-1">Batal</button>}
        <button type="submit" disabled={saving} className="btn-primary flex-[2] py-3">
          {saving ? <Spinner className="h-4 w-4" /> : <Icon name="check" className="h-4 w-4" strokeWidth={2.4} />} {submitLabel}
        </button>
      </div>
    </form>
  );
}

function SeatInput({ base, seat, value, onChange, taken }: { base: string; seat: number; value: SeatPlayer; onChange: (v: SeatPlayer) => void; taken: number[] }) {
  const [hits, setHits] = useState<MemberHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqId = useRef(0);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const search = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 2) { setHits([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      const id = ++reqId.current;
      setLoading(true);
      try {
        const d = await api<{ members: MemberHit[] }>(`${base}/members?q=${encodeURIComponent(q.trim())}`);
        if (id !== reqId.current) return;
        setHits(d.members);
        setOpen(d.members.length > 0);
      } catch { setHits([]); } finally { if (id === reqId.current) setLoading(false); }
    }, 250);
  };

  return (
    <div className="relative">
      <div className={`flex items-center gap-3 rounded-2xl border bg-white p-1.5 pl-3 transition focus-within:border-felt-500 focus-within:ring-4 focus-within:ring-felt-500/10 ${value.memberId ? "border-felt-300" : "border-felt-900/10"}`}>
        <span className="flex w-11 shrink-0 flex-col items-center">
          <span className={`font-han text-2xl font-black leading-none ${seat === 0 ? "text-gold-500" : "text-felt-700"}`}>{WINDS_ZH[seat]}</span>
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-felt-900/40">{WINDS_ID[seat]}</span>
        </span>
        <input
          value={value.name}
          onChange={(e) => { onChange({ name: e.target.value.slice(0, 24), memberId: null }); search(e.target.value); }}
          onFocus={() => hits.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={seat === 0 ? "Nama (dealer pertama)" : "Nama atau cari member"}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] font-medium outline-none placeholder:text-felt-900/30"
          aria-label={`Pemain ${WINDS[seat]}`}
          autoComplete="off"
        />
        {loading && <Spinner className="h-4 w-4 text-felt-500" />}
        {value.memberId ? (
          <button type="button" onClick={() => onChange({ ...value, memberId: null })} className="chip mr-1 shrink-0 bg-felt-50 text-felt-700 hover:bg-red-50 hover:text-red-600" title="Lepas tautan member">
            <Icon name="check" className="h-3 w-3" strokeWidth={3} /> Member
          </button>
        ) : (
          <span className="mr-2 shrink-0 text-[10px] font-semibold text-felt-900/30">Tamu</span>
        )}
      </div>
      {open && hits.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-felt-900/10 bg-white shadow-xl">
          {hits.map((h) => {
            const isTaken = taken.includes(h.id);
            return (
              <li key={h.id}>
                <button type="button" disabled={isTaken} onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange({ name: h.name, memberId: h.id }); setOpen(false); }} className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-felt-50 disabled:opacity-40">
                  <span className="font-semibold text-felt-950">{h.name}</span>
                  <span className="font-mono text-xs text-felt-900/50">{isTaken ? "sudah duduk" : h.phone}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
