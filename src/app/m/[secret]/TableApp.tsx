"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon, Modal, Spinner, Tile, ToastProvider, VenueBadge, api, useToast } from "@/components/ui";
import ThemeStyle from "@/components/ThemeStyle";
import RulesView from "@/components/RulesView";
import RecordRound, { type RoundPayload } from "@/components/table/RecordRound";
import PlayerSetup from "@/components/table/PlayerSetup";
import dynamic from "next/dynamic";
import { RoundHistory, Standings, recapText } from "@/components/table/GameRecap";
import LinkBox from "./LinkBox";
import TableBoard from "./TableBoard";

const StoryModal = dynamic(() => import("@/components/table/StoryModal"), { ssr: false });
import { GAME_TYPE_META, PAY_RULE_LABEL, PRESET_LABEL, WINDS_ID, WINDS_ZH, deriveState, unitLabel, type Ruleset } from "@/lib/rules";
import type { PublicVenue, RoundView, SeatPlayer, TableView } from "@/lib/types";

type Data = { table: TableView; venue: PublicVenue; rules: Ruleset; isStaff: boolean; lastFinished: { totals: number[]; players: SeatPlayer[]; endedAt: string | null } | null };
type ModalKey = null | "record" | "players" | "rules" | "recap" | "story" | "undo" | "finish";

export default function TableApp({ secret }: { secret: string }) {
  return (
    <ToastProvider>
      <Inner secret={secret} />
    </ToastProvider>
  );
}

function Inner({ secret }: { secret: string }) {
  const toast = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState<ModalKey>(null);
  const [editing, setEditing] = useState<RoundView | null>(null);
  const [busy, setBusy] = useState(false);
  const modalRef = useRef<ModalKey>(null);
  modalRef.current = modal;

  const load = useCallback(async () => {
    try { setData(await api<Data>(`/api/tables/${secret}`)); setErr(""); } catch (e) { setErr((e as Error).message); }
  }, [secret]);

  useEffect(() => {
    load();
    const t = setInterval(() => { if (document.visibilityState === "visible" && !modalRef.current) load(); }, 6000);
    return () => clearInterval(t);
  }, [load]);

  const editState = useMemo(() => {
    if (!data || !editing) return null;
    const idx = data.table.rounds.findIndex((r) => r.id === editing.id);
    return deriveState(data.table.rounds.slice(0, Math.max(0, idx)));
  }, [data, editing]);

  if (err && !data)
    return (
      <div className="felt flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center text-cream-50">
        <div className="flex gap-1.5"><Tile code="wN" size="lg" /><Tile code="dW" size="lg" /><Tile code="wN" size="lg" /></div>
        <h1 className="font-display text-3xl font-semibold">Meja tidak ditemukan</h1>
        <p className="max-w-xs text-cream-50/60">{err}</p>
        <Link href="/" className="btn-gold">Kembali</Link>
      </div>
    );
  if (!data) return <div className="felt flex min-h-dvh items-center justify-center text-gold-300"><Spinner className="h-8 w-8" /></div>;

  const { table, venue, rules } = data;
  const unit = unitLabel(rules);
  const playing = table.status === "playing";
  const finished = table.status === "finished";
  const { dealer, roundWind, handNo } = table.state;
  const last = table.rounds[table.rounds.length - 1];
  const first = table.rounds[0];
  const startedLabel = first ? new Date(first.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : new Date(table.updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  async function submitRound(p: RoundPayload) {
    if (editing) {
      // EDIT FAAN: pemenang, cara menang & pembuang selalu terkunci di server
      await api(`/api/tables/${secret}/rounds`, { method: "PATCH", json: { id: editing.id, faan: p.faan, patterns: p.details.patterns } });
      toast("Faan diperbarui — angin tidak bergeser");
    } else {
      await api(`/api/tables/${secret}/rounds`, { method: "POST", json: p });
      toast(p.method === "draw" ? "Hand seri dicatat" : `Tersimpan · ${p.faan} ${unit}`);
    }
    setModal(null); setEditing(null);
    await load();
  }
  async function savePlayers(players: SeatPlayer[]) {
    await api(`/api/tables/${secret}`, { method: "PUT", json: { players } });
    toast(playing ? "Pemain diperbarui" : "Meja dibuka · selamat bermain!");
    setModal(null); await load();
  }
  async function undo() {
    setBusy(true);
    try { await api(`/api/tables/${secret}/rounds`, { method: "DELETE" }); toast("Hand terakhir dibatalkan"); setModal(null); await load(); }
    catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); }
  }
  async function tableAction(action: "finish" | "new") {
    setBusy(true);
    try {
      await api(`/api/tables/${secret}`, { method: "POST", json: { action } });
      toast(action === "finish" ? "Meja selesai. Skor akhir tersimpan." : "Meja baru dibuka untuk grup berikutnya.");
      setModal(null); await load();
    } catch (e) { toast((e as Error).message, "err"); } finally { setBusy(false); }
  }

  return (
    <div className="themed min-h-dvh overflow-x-hidden bg-cream-100 pb-[calc(84px+env(safe-area-inset-bottom))]">
      <ThemeStyle venue={venue} />
      {/* ---------- HEADER ---------- */}
      <header className="felt sticky top-0 z-30 text-cream-50">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link href={`/v/${venue.slug}`} className="flex min-w-0 items-center gap-2.5">
            <VenueBadge logoText={venue.logoText} logoSubText={venue.logoSubText} logoUrl={venue.logoUrl} color={venue.primaryColor} size={42} />
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-semibold leading-tight">{table.label}</p>
              <p className="truncate text-xs text-cream-50/65">{venue.name}{table.area ? ` · ${table.area}` : ""}</p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <button onClick={() => setModal("rules")} className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20" aria-label="House Rules">
              <Icon name="book" className="h-4 w-4" /> <span className="hidden min-[390px]:inline">House Rules</span>
            </button>
            {playing && (
              <button onClick={() => setModal("players")} className="rounded-full border border-white/25 bg-white/10 p-2 hover:bg-white/20" aria-label="Pemain">
                <Icon name="user" className="h-4 w-4" />
              </button>
            )}
            <span className={`chip shrink-0 ${playing ? "bg-emerald-400/20 text-emerald-200" : finished ? "bg-gold-400/20 text-gold-200" : "bg-white/10 text-cream-50/85"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" /> {playing ? "Bermain" : finished ? "Selesai" : "Tersedia"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-4">
        {/* ---------- OPEN TABLE ---------- */}
        {!playing && !finished ? (
          <div className="card mx-auto max-w-lg p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Tile code="dR" size="sm" />
              <div className="min-w-0">
                <span className="eyebrow text-gold-600">Open Table</span>
                <h1 className="font-display text-3xl font-semibold text-felt-950">{table.label}</h1>
              </div>
            </div>
            <p className="mb-5 mt-2 text-sm text-felt-900/65">Isi 4 pemain berlawanan arah jarum jam. Timur menjadi dealer pertama. Ketik minimal 2 huruf untuk mencari member {venue.shortName}.</p>
            <PlayerSetup base={`/api/tables/${secret}`} initial={table.players} onSave={savePlayers} submitLabel="Buka Meja & Mulai" />
            <p className="mt-4 text-center text-xs text-felt-900/50">{GAME_TYPE_META[rules.preset].desc} · Start {table.startingPoints.toLocaleString("id-ID")} · {PAY_RULE_LABEL[table.payRule]}</p>
            <div className="mt-4 grid gap-2">
              <LinkBox label="Layar TV" url={`${pageOrigin()}/v/${venue.slug}/tv`} />
              <LinkBox label="Untuk Meja" url={`${pageOrigin()}/m/${secret}`} />
            </div>
          </div>
        ) : finished ? (
          /* ---------- FINISHED ---------- */
          <div className="space-y-4">
            <div className="felt rounded-[28px] p-5 text-center text-cream-50">
              <span className="chip bg-gold-400/20 text-gold-200">Permainan selesai</span>
              <h1 className="mt-3 font-display text-3xl font-semibold">Rekap {table.label}</h1>
              <p className="mt-1 text-sm text-cream-50/65">{table.rounds.length} hand · {GAME_TYPE_META[rules.preset].short}</p>
            </div>
            <Standings table={table} startingPoints={table.startingPoints} rules={rules} payRule={table.payRule} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={async () => { try { await navigator.clipboard.writeText(recapText(table, table.startingPoints, venue.name, venue.social, venue.shortName, rules)); toast("Rekap disalin"); } catch { toast("Gagal menyalin", "err"); } }} className="btn-ghost py-3"><Icon name="copy" className="h-4 w-4" /> Salin rekap</button>
              <button onClick={() => setModal("story")} className="btn-ghost py-3"><Icon name="camera" className="h-4 w-4" /> Story</button>
            </div>
            <div className="grid gap-2">
              <LinkBox label="Layar TV" url={`${pageOrigin()}/v/${venue.slug}/tv`} />
              <LinkBox label="Untuk Meja" url={`${pageOrigin()}/m/${secret}`} />
            </div>
            {data.isStaff ? (
              <button onClick={() => tableAction("new")} disabled={busy} className="btn-primary w-full py-4">{busy ? <Spinner className="h-4 w-4" /> : <Icon name="refresh" className="h-5 w-5" />} Meja Baru (grup berikutnya)</button>
            ) : (
              <p className="text-center text-xs text-felt-900/55">Minta staf untuk membuka meja baru.</p>
            )}
            <section>
              <h2 className="mb-2 font-display text-xl font-semibold text-felt-950">Riwayat hand</h2>
              <RoundHistory rounds={table.rounds} players={table.players} rules={rules} startingPoints={table.startingPoints} payRule={table.payRule} />
            </section>
          </div>
        ) : (
          /* ---------- PLAYING ---------- */
          <>
            <TableBoard table={table} />

            {/* House Rules card */}
            <button onClick={() => setModal("rules")} className="card mt-4 flex w-full items-center gap-3 p-3.5 text-left transition hover:bg-white">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-felt-700 text-cream-50">
                <Icon name="book" className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-felt-950">House Rules {venue.shortName}</span>
                <span className="block truncate text-xs text-felt-900/55">{PRESET_LABEL[rules.preset]} · min {rules.minFaan} {unit} · batas {rules.maxFaan} · {table.payRule === "half" ? "半銃 Half" : "全銃 Full"}</span>
              </span>
              <Icon name="chevronRight" className="h-5 w-5 shrink-0 text-felt-900/30" />
            </button>

            {/* actions */}
            <div className="mt-4 grid grid-cols-5 gap-2">
              {([
                { k: "undo", icon: "undo", label: "Undo", disabled: table.rounds.length === 0 },
                { k: "recap", icon: "trophy", label: "Rekap" },
                { k: "story", icon: "camera", label: "Story" },
                { k: "rules", icon: "book", label: "Rules" },
                { k: "finish", icon: "flag", label: "Selesai" },
              ] as const).map((a) => (
                <button key={a.k} disabled={"disabled" in a && a.disabled} onClick={() => setModal(a.k)} className={`card flex flex-col items-center gap-1 px-1 py-3 transition hover:bg-white disabled:opacity-40 ${a.k === "finish" ? "text-red-600" : "text-felt-800"}`}>
                  <Icon name={a.icon} className="h-5 w-5" />
                  <span className="text-[11px] font-semibold">{a.label}</span>
                </button>
              ))}
            </div>


            {/* links: TV & meja (salin/buka) */}
            <div className="mt-4 grid gap-2">
              <LinkBox label="Layar TV" url={`${pageOrigin()}/v/${venue.slug}/tv`} />
              <LinkBox label="Untuk Meja" url={`${pageOrigin()}/m/${secret}`} />
            </div>

            {/* history */}
            <section className="mt-6">
              <div className="mb-2 flex items-end justify-between gap-2 px-1">
                <h2 className="font-display text-xl font-semibold text-felt-950">Riwayat hand</h2>
                <span className="shrink-0 text-xs text-felt-900/50">Mulai {startedLabel} · {table.rounds.length} hand</span>
              </div>
              <RoundHistory rounds={table.rounds} players={table.players} rules={rules} startingPoints={table.startingPoints} payRule={table.payRule} onEditFaan={(r) => { setEditing(r); setModal("record"); }} />
            </section>

            {/* anti-gambling */}
            <div className="mt-8 mb-2 flex items-center justify-center gap-2 text-center text-[11px] font-bold uppercase tracking-[0.16em] text-red-600/80">
              <Icon name="ban" className="h-3.5 w-3.5" strokeWidth={2.2} /> Dilarang berjudi · untuk hiburan & olahraga otak
            </div>
          </>
        )}
      </main>

      {/* ---------- STICKY CTA ---------- */}
      {playing && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-cream-100 via-cream-100/95 to-transparent pb-[max(env(safe-area-inset-bottom),14px)] pt-5">
          <div className="mx-auto max-w-3xl px-4">
            <button onClick={() => { setEditing(null); setModal("record"); }} className="btn-primary w-full py-4 text-base">
              <Icon name="plus" className="h-5 w-5" strokeWidth={2.4} /> Catat Round · Hand {handNo}
            </button>
          </div>
        </div>
      )}

      {/* ---------- MODALS ---------- */}
      {playing && (
        <RecordRound
          open={modal === "record"}
          onClose={() => { setModal(null); setEditing(null); }}
          onSubmit={submitRound}
          players={editing && editing.players.length === 4 ? editing.players : table.players}
          dealer={editState?.dealer ?? dealer}
          roundWind={editState?.roundWind ?? roundWind}
          handNo={editing ? table.rounds.findIndex((r) => r.id === editing.id) + 1 : handNo}
          rules={rules}
          payRule={table.payRule}
          initial={editing}
          faanOnly={!!editing}
        />
      )}
      <Modal open={modal === "players"} onClose={() => setModal(null)} title="Pemain di meja" subtitle="Urutan kursi: Timur → Selatan → Barat → Utara">
        <PlayerSetup base={`/api/tables/${secret}`} initial={table.players} onSave={savePlayers} onCancel={() => setModal(null)} note={table.rounds.length ? "Hand yang sudah tercatat tetap atas nama & member lama. Perubahan berlaku untuk hand berikutnya." : undefined} />
      </Modal>
      <Modal open={modal === "rules"} onClose={() => setModal(null)} title="" wide>
        <RulesView rules={rules} venueName={venue.name} onClose={() => setModal(null)} gameType={rules.preset} />
      </Modal>
      <Modal open={modal === "undo"} onClose={() => setModal(null)} title="Undo hand terakhir?"
        footer={<div className="flex gap-2"><button onClick={() => setModal(null)} className="btn-ghost flex-1">Batal</button><button onClick={undo} disabled={busy} className="btn-danger flex-1">{busy ? <Spinner className="h-4 w-4" /> : <Icon name="undo" className="h-4 w-4" />} Ya, undo</button></div>}>
        {last && (() => {
          const pl = last.players.length === 4 ? last.players : table.players;
          return <p className="text-sm text-felt-900/70">Hand #{table.rounds.length}: <b>{last.method === "draw" ? "Seri" : `${pl[last.winnerSeat!]?.name} ${last.method === "selfdraw" ? "Zimo" : "Hu"} ${last.faan} ${unit}`}</b> akan dihapus dan poin dikembalikan.</p>;
        })()}
      </Modal>
      <Modal open={modal === "recap"} onClose={() => setModal(null)} title="Rekap" subtitle={`${table.rounds.length} hand · putaran ${WINDS_ZH[roundWind]}`}
        footer={<div className="flex gap-2"><button onClick={async () => { try { await navigator.clipboard.writeText(recapText(table, table.startingPoints, venue.name, venue.social, venue.shortName, rules)); toast("Rekap disalin"); } catch { toast("Gagal menyalin", "err"); } }} className="btn-ghost flex-1"><Icon name="copy" className="h-4 w-4" /> Salin</button><button onClick={() => setModal("story")} className="btn-primary flex-1"><Icon name="camera" className="h-4 w-4" /> Story</button></div>}>
        <Standings table={table} startingPoints={table.startingPoints} rules={rules} payRule={table.payRule} />
      </Modal>
      <Modal open={modal === "finish"} onClose={() => setModal(null)} title="Selesai bermain?" subtitle="Skor akhir disimpan ke riwayat & liga."
        footer={<div className="flex gap-2"><button onClick={() => setModal(null)} className="btn-ghost flex-1">Lanjut main</button><button onClick={() => tableAction("finish")} disabled={busy} className="btn-danger flex-1">{busy ? <Spinner className="h-4 w-4" /> : <Icon name="flag" className="h-4 w-4" />} Selesai</button></div>}>
        <Standings table={table} startingPoints={table.startingPoints} rules={rules} payRule={table.payRule} />
      </Modal>
      {(playing || finished) && <StoryModal open={modal === "story"} onClose={() => setModal(null)} venue={venue} table={table} startingPoints={table.startingPoints} roomName={venue.shortName} />}
    </div>
  );
}

function pageOrigin() {
  return typeof window !== "undefined" ? window.location.origin : "";
}

