"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon, Modal, Segmented, Spinner, api, timeAgo, useToast } from "@/components/ui";
import { GAME_TYPES, GAME_TYPE_META, PAY_RULE_DESC, PAY_RULE_LABEL, WINDS_ZH, fmtPts, seatWindOf, type GameType, type Ruleset } from "@/lib/rules";
import type { PublicVenue, SeatPlayer, TableView } from "@/lib/types";
import type { HostUser } from "../HostDashboard";

type T = {
  id: number; label: string; area: string; secret: string; gameType: GameType; active: boolean; status: "open" | "playing" | "finished";
  startingPoints: number; payRule: "half" | "full"; totalRounds: number; lastActivity: string | null; rules: Ruleset; game: TableView | null;
};

export default function TablesTab({ user, venue }: { user: HostUser; venue: PublicVenue }) {
  const toast = useToast();
  const [list, setList] = useState<T[] | null>(null);
  const [filter, setFilter] = useState<"all" | "playing" | "free">("all");
  const [qrFor, setQrFor] = useState<T | null>(null);
  const [qrImgs, setQrImgs] = useState<Record<string, string>>({});
  const [edit, setEdit] = useState<T | null>(null);
  const [editForm, setEditForm] = useState({ label: "", area: "", gameType: "classic" as GameType, startingPoints: 1000, payRule: "half" as "half" | "full" });
  const [add, setAdd] = useState(false);
  const [addMode, setAddMode] = useState<"bulk" | "single">("bulk");
  const [addForm, setAddForm] = useState({ label: "", area: "", count: "4", prefix: "Meja", gameType: venue.defaultGameType as GameType, startingPoints: String(venue.defaultStartingPoints), payRule: venue.defaultPayRule });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setList((await api<{ tables: T[] }>("/api/host/tables")).tables); } catch (e) { toast((e as Error).message, "err"); }
  }, [toast]);
  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 8000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!qrFor) return setQrImgs({});
    (async () => {
      const url = `${window.location.origin}/m/${qrFor.secret}`;
      const { default: QRCode } = await import("qrcode");
      const png = await QRCode.toDataURL(url, { width: 460, margin: 1, color: { dark: "#082e1e", light: "#ffffff" } });
      setQrImgs({ [String(qrFor.id)]: png });
    })();
  }, [qrFor]);

  async function patch(t: T, body: Record<string, unknown>, msg: string) {
    try { await api(`/api/host/tables/${t.id}`, { method: "PATCH", json: body }); toast(msg); await load(); return true; }
    catch (e) { toast((e as Error).message, "err"); return false; }
  }
  async function remove(t: T) {
    if (!confirm(`Hapus ${t.label}? QR lama tidak berlaku. Riwayat meja ini ikut terhapus.`)) return;
    try { await api(`/api/host/tables/${t.id}`, { method: "DELETE" }); toast("Meja dihapus"); setEdit(null); load(); }
    catch (e) { toast((e as Error).message, "err"); }
  }
  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErr("");
    try {
      const body = addMode === "bulk"
        ? { count: Number(addForm.count), prefix: addForm.prefix, area: addForm.area, gameType: addForm.gameType, startingPoints: Number(addForm.startingPoints), payRule: addForm.payRule }
        : { label: addForm.label, area: addForm.area, gameType: addForm.gameType, startingPoints: Number(addForm.startingPoints), payRule: addForm.payRule };
      const d = await api<{ tables: unknown[] }>("/api/host/tables", { method: "POST", json: body });
      toast(`${d.tables.length} meja ditambahkan`);
      setAdd(false); load();
    } catch (e) { setErr((e as Error).message); } finally { setSaving(false); }
  }
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setErr("");
    try { await api(`/api/host/tables/${edit.id}`, { method: "PATCH", json: editForm }); toast("Meja diperbarui"); setEdit(null); load(); }
    catch (e) { setErr((e as Error).message); }
  }
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); toast("Link disalin"); } catch { toast("Gagal menyalin", "err"); } };

  const tables = (list ?? []).filter((t) => filter === "all" || (filter === "playing" ? t.status === "playing" : t.status !== "playing" && t.active));
  const playing = (list ?? []).filter((t) => t.status === "playing").length;

  return (
    <div>
      <div className="mb-5 grid grid-cols-3 gap-3">
        {([["Sedang dimainkan", playing], ["Meja tersedia", (list ?? []).filter((t) => t.active && t.status !== "playing").length], ["Total meja", list?.length ?? 0]] as const).map(([l, v]) => (
          <div key={l} className="card p-4"><p className="text-xs font-semibold text-felt-900/50">{l}</p><p className="mt-1 font-display text-3xl font-semibold text-felt-950">{v}</p></div>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Segmented size="sm" value={filter} onChange={setFilter} options={[{ value: "all", label: "Semua" }, { value: "playing", label: "Dimainkan" }, { value: "free", label: "Tersedia" }]} />
        <div className="flex flex-wrap gap-2">
          <Link href="/host/qr" target="_blank" className="btn-ghost"><Icon name="qr" className="h-4 w-4" /> Cetak semua QR</Link>
          <button onClick={() => { setAdd(true); setErr(""); setAddMode("bulk"); }} className="btn-primary"><Icon name="plus" className="h-4 w-4" strokeWidth={2.4} /> Tambah meja</button>
        </div>
      </div>

      {list === null ? (
        <div className="flex justify-center py-16 text-felt-700"><Spinner /></div>
      ) : tables.length === 0 ? (
        <div className="card px-5 py-14 text-center">
          <p className="font-semibold text-felt-950">{list.length === 0 ? "Belum ada meja" : "Tidak ada meja di filter ini"}</p>
          {list.length === 0 && <p className="mt-1 text-sm text-felt-900/55">Tambahkan meja fisik venue, cetak QR, tempel di meja.</p>}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tables.map((t) => {
            const g = t.game;
            const playing = t.status === "playing";
            return (
              <div key={t.id} className={`overflow-hidden rounded-3xl ${playing ? "felt text-cream-50 shadow-lg shadow-felt-900/20" : "card"} ${t.active ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-3 px-4 pt-4">
                  <div className="min-w-0">
                    <p className={`truncate font-display text-xl font-semibold ${playing ? "" : "text-felt-950"}`}>{t.label}</p>
                    <p className={`truncate text-xs ${playing ? "text-cream-50/60" : "text-felt-900/50"}`}>{t.area || "Tanpa area"} · {GAME_TYPE_META[t.gameType].short} · start {t.startingPoints.toLocaleString("id-ID")} · {t.payRule === "half" ? "半銃" : "全銃"}</p>
                  </div>
                  {!t.active ? <span className="chip shrink-0 bg-black/20 text-cream-50/70">Nonaktif</span>
                    : playing ? <span className="chip shrink-0 bg-emerald-400/20 text-emerald-200"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Bermain</span>
                    : <span className="chip shrink-0 bg-felt-50 text-felt-700">{t.status === "finished" ? "Selesai" : "Tersedia"}</span>}
                </div>
                {playing && g ? (
                  <div className="px-4 pt-2">
                    <p className="text-xs text-cream-50/60">Putaran {WINDS_ZH[g.state.roundWind]} · hand {g.state.handNo} · mulai {new Date(g.rounds[0]?.createdAt ?? g.updatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} · update {timeAgo(g.updatedAt)}</p>
                    <ul className="mt-2">
                      {g.players.map((p: SeatPlayer, s: number) => {
                        const d = g.totals[s] - g.startingPoints;
                        const w = seatWindOf(s, g.state.dealer);
                        return (
                          <li key={s} className="flex items-center justify-between gap-2 border-t border-white/8 py-1.5 text-sm">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className={`w-5 shrink-0 font-han font-black ${w === 0 ? "text-gold-300" : "text-cream-50/40"}`}>{WINDS_ZH[w]}</span>
                              <span className="truncate">{p.name}</span>
                            </span>
                            <span className="flex shrink-0 items-baseline gap-2">
                              <span className="font-mono">{g.totals[s].toLocaleString("id-ID")}</span>
                              <span className={`w-14 text-right font-mono text-xs font-bold ${d > 0 ? "text-emerald-300" : d < 0 ? "text-red-300" : "text-cream-50/40"}`}>{fmtPts(d)}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <p className={`px-4 pt-3 text-sm ${playing ? "text-cream-50/60" : "text-felt-900/55"}`}>{t.totalRounds} hand · terakhir {timeAgo(t.lastActivity)}</p>
                )}
                <div className={`mt-3 flex flex-wrap gap-1.5 border-t px-4 py-3 ${playing ? "border-white/10" : "border-felt-900/6"}`}>
                  <Link href={`/m/${t.secret}`} target="_blank" className={`${playing ? "btn-dark-ghost" : "btn-ghost"} px-3 py-1.5 text-xs`}><Icon name="eye" className="h-3.5 w-3.5" /> Buka</Link>
                  <button onClick={() => setQrFor(t)} className={`${playing ? "btn-dark-ghost" : "btn-ghost"} px-3 py-1.5 text-xs`}><Icon name="qr" className="h-3.5 w-3.5" /> QR</button>
                  <button onClick={() => copy(`${window.location.origin}/m/${t.secret}`)} className={`${playing ? "btn-dark-ghost" : "btn-ghost"} px-3 py-1.5 text-xs`}><Icon name="copy" className="h-3.5 w-3.5" /> Link</button>
                  {playing && <button onClick={() => confirm(`Akhiri permainan di ${t.label}? Skor disimpan.`) && patch(t, { action: "finish" }, "Permainan diakhiri & disimpan")} className="btn-dark-ghost px-3 py-1.5 text-xs"><Icon name="flag" className="h-3.5 w-3.5" /> Akhiri</button>}
                  {playing && <button onClick={() => confirm(`Batalkan sesi di ${t.label}? Semua hand sesi ini dihapus.`) && patch(t, { action: "cancel" }, "Sesi dibatalkan")} className="btn-dark-ghost px-3 py-1.5 text-xs text-red-200"><Icon name="x" className="h-3.5 w-3.5" /> Batal</button>}
                  {t.status === "finished" && <button onClick={() => patch(t, { action: "new" }, "Meja baru dibuka")} className={`${playing ? "btn-dark-ghost" : "btn-ghost"} px-3 py-1.5 text-xs`}><Icon name="refresh" className="h-3.5 w-3.5" /> Meja baru</button>}
                  <button onClick={() => { setEdit(t); setEditForm({ label: t.label, area: t.area, gameType: t.gameType, startingPoints: t.startingPoints, payRule: t.payRule }); setErr(""); }} className={`${playing ? "btn-dark-ghost" : "btn-ghost"} px-3 py-1.5 text-xs`}><Icon name="edit" className="h-3.5 w-3.5" /> Atur</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!qrFor} onClose={() => setQrFor(null)} title={`QR ${qrFor?.label ?? ""}`} subtitle="Alamat rahasia (/m/…) — tidak bisa ditebak pemain lain.">
        {qrFor && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-xs rounded-3xl border-2 bg-white p-5 text-center shadow-lg" style={{ borderColor: venue.primaryColor }}>
              <p className="text-xs font-bold uppercase tracking-widest text-felt-900/50">{venue.name}</p>
              <p className="font-display text-2xl font-semibold text-felt-950">{qrFor.label}</p>
              {qrImgs[String(qrFor.id)] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrImgs[String(qrFor.id)]} alt={`QR ${qrFor.label}`} className="mx-auto my-3 aspect-square w-full max-w-[220px]" />
              ) : <div className="mx-auto my-3 flex aspect-square w-full max-w-[220px] items-center justify-center"><Spinner /></div>}
              <p className="truncate font-mono text-[11px] text-felt-900/50">/m/{qrFor.secret}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {qrImgs[String(qrFor.id)] && <a href={qrImgs[String(qrFor.id)]} download={`qr-${qrFor.label.replace(/\s+/g, "-").toLowerCase()}.png`} className="btn-ghost"><Icon name="download" className="h-4 w-4" /> Unduh PNG</a>}
              <Link href="/host/qr" target="_blank" className="btn-ghost"><Icon name="qr" className="h-4 w-4" /> Cetak</Link>
              <button onClick={async () => { if (await patch(qrFor, { action: "regenerate" }, "Kode QR baru dibuat")) setQrFor(null); }} className="btn-ghost text-red-600">Ganti kode QR</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={add} onClose={() => setAdd(false)} title="Tambah meja">
        <form onSubmit={submitAdd} className="space-y-4">
          <Segmented value={addMode} onChange={setAddMode} options={[{ value: "bulk", label: "Beberapa sekaligus" }, { value: "single", label: "Satu meja" }]} />
          {addMode === "bulk" ? (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="cnt">Jumlah</label><input id="cnt" className="input" inputMode="numeric" value={addForm.count} onChange={(e) => setAddForm({ ...addForm, count: e.target.value.replace(/\D/g, "").slice(0, 2) })} /></div>
              <div><label className="label" htmlFor="pre">Awalan nama</label><input id="pre" className="input" value={addForm.prefix} onChange={(e) => setAddForm({ ...addForm, prefix: e.target.value })} placeholder="Meja" /></div>
            </div>
          ) : (
            <div><label className="label" htmlFor="lbl">Nama meja</label><input id="lbl" className="input" value={addForm.label} onChange={(e) => setAddForm({ ...addForm, label: e.target.value })} placeholder="VIP 3" /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="area">Area</label><input id="area" className="input" value={addForm.area} onChange={(e) => setAddForm({ ...addForm, area: e.target.value })} placeholder="Lantai 2" /></div>
            <div><label className="label" htmlFor="sp">Poin awal</label><input id="sp" className="input" inputMode="numeric" value={addForm.startingPoints} onChange={(e) => setAddForm({ ...addForm, startingPoints: e.target.value.replace(/\D/g, "").slice(0, 7) })} /></div>
          </div>
          <div>
            <label className="label" htmlFor="gt">Aturan main</label>
            <select id="gt" className="input" value={addForm.gameType} onChange={(e) => setAddForm({ ...addForm, gameType: e.target.value as GameType })}>
              {GAME_TYPES.map((t) => <option key={t} value={t}>{GAME_TYPE_META[t].label}</option>)}
            </select>
          </div>
          <div>
            <span className="label">Aturan bayar</span>
            <Segmented value={addForm.payRule} onChange={(v) => setAddForm({ ...addForm, payRule: v })} options={[{ value: "half", label: "半銃 Half" }, { value: "full", label: "全銃 Full" }]} />
            <p className="mt-1.5 text-xs text-felt-900/55">{PAY_RULE_DESC[addForm.payRule]}</p>
          </div>
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full py-3">{saving ? <Spinner className="h-4 w-4" /> : <Icon name="plus" className="h-4 w-4" />} Tambah</button>
        </form>
      </Modal>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={`Atur ${edit?.label ?? ""}`}>
        {edit && (
          <form onSubmit={saveEdit} className="space-y-4">
            <div><label className="label" htmlFor="el">Nama meja</label><input id="el" className="input" value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} /></div>
            <div><label className="label" htmlFor="ea">Area</label><input id="ea" className="input" value={editForm.area} onChange={(e) => setEditForm({ ...editForm, area: e.target.value })} /></div>
            <div><label className="label" htmlFor="eg">Aturan main</label>
              <select id="eg" className="input" value={editForm.gameType} onChange={(e) => setEditForm({ ...editForm, gameType: e.target.value as GameType })}>
                {GAME_TYPES.map((t) => <option key={t} value={t}>{GAME_TYPE_META[t].label}</option>)}
              </select>
              <p className="mt-1 text-xs text-felt-900/50">{GAME_TYPE_META[editForm.gameType].desc}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="es">Poin awal</label><input id="es" className="input" inputMode="numeric" value={editForm.startingPoints} onChange={(e) => setEditForm({ ...editForm, startingPoints: Number(e.target.value.replace(/\D/g, "") || 0) })} /></div>
              <div><span className="label">Aturan bayar</span>
                <Segmented value={editForm.payRule} onChange={(v) => setEditForm({ ...editForm, payRule: v })} options={[{ value: "half", label: "半銃" }, { value: "full", label: "全銃" }]} />
              </div>
            </div>
            {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => remove(edit)} className="btn-danger"><Icon name="trash" className="h-4 w-4" /> Hapus</button>
              <button type="button" onClick={async () => { if (await patch(edit, { active: !edit.active }, edit.active ? "Meja dinonaktifkan" : "Meja diaktifkan")) setEdit(null); }} className="btn-ghost">{edit.active ? "Nonaktifkan" : "Aktifkan"}</button>
              <button type="submit" className="btn-primary flex-1"><Icon name="check" className="h-4 w-4" /> Simpan</button>
            </div>
            <p className="text-xs text-felt-900/45">{PAY_RULE_LABEL[editForm.payRule]}</p>
          </form>
        )}
      </Modal>
    </div>
  );
}
