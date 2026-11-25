"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon, Modal, Spinner, api, timeAgo, useToast } from "@/components/ui";
import { fmtPts } from "@/lib/rules";

type M = { id: number; name: string; phone: string; note: string; createdAt: string; games: number; points: number; lastPlayed: string | null };

function displayPhone(p: string) {
  if (!p.startsWith("62")) return p;
  const local = "0" + p.slice(2);
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}

export default function MembersTab() {
  const toast = useToast();
  const [list, setList] = useState<M[] | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "name" | "points" | "games">("new");
  const [form, setForm] = useState({ name: "", phone: "" });
  const [dup, setDup] = useState<{ id: number; name: string } | null>(null);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState<M | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", note: "" });
  const [editErr, setEditErr] = useState("");

  const load = useCallback(async () => {
    try {
      setList((await api<{ members: M[] }>("/api/host/members")).members);
    } catch (e) {
      toast((e as Error).message, "err");
    }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  // live duplicate check while typing phone
  const normalized = useMemo(() => {
    let d = form.phone.replace(/\D/g, "");
    if (d.startsWith("0")) d = "62" + d.slice(1);
    else if (d.startsWith("8")) d = "62" + d;
    return d;
  }, [form.phone]);
  const liveDup = normalized.length >= 10 ? list?.find((m) => m.phone === normalized) : undefined;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setDup(null);
    setSaving(true);
    try {
      await api("/api/host/members", { method: "POST", json: form });
      toast(`${form.name} ditambahkan`);
      setForm({ name: "", phone: "" });
      load();
    } catch (e) {
      const ex = e as Error & { data?: { duplicate?: { id: number; name: string } } };
      setErr(ex.message);
      if (ex.data?.duplicate) setDup(ex.data.duplicate);
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    setEditErr("");
    try {
      await api(`/api/host/members/${edit.id}`, { method: "PATCH", json: editForm });
      toast("Member diperbarui");
      setEdit(null);
      load();
    } catch (e) {
      setEditErr((e as Error).message);
    }
  }

  async function remove(m: M) {
    if (!confirm(`Hapus member ${m.name}? Riwayat round tetap tersimpan sebagai tamu.`)) return;
    try {
      await api(`/api/host/members/${m.id}`, { method: "DELETE" });
      toast("Member dihapus");
      setEdit(null);
      load();
    } catch (e) {
      toast((e as Error).message, "err");
    }
  }

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    const digits = s.replace(/\D/g, "");
    const dq = digits.startsWith("0") ? "62" + digits.slice(1) : digits;
    const f = (list ?? []).filter((m) => !s || m.name.toLowerCase().includes(s) || (dq.length >= 3 && m.phone.includes(dq)));
    const sorted = [...f];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "points") sorted.sort((a, b) => b.points - a.points);
    if (sort === "games") sorted.sort((a, b) => b.games - a.games);
    return sorted;
  }, [list, q, sort]);

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <form onSubmit={add} className="card h-fit space-y-4 p-5 lg:sticky lg:top-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-felt-950">Tambah member</h2>
          <p className="text-xs text-felt-900/55">Nomor HP dobel langsung ketahuan.</p>
        </div>
        <div>
          <label className="label" htmlFor="mname">Nama</label>
          <input id="mname" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Rudi Hartono" required />
        </div>
        <div>
          <label className="label" htmlFor="mphone">Nomor HP</label>
          <input id="mphone" className={`input ${liveDup ? "border-gold-400 ring-4 ring-gold-300/20" : ""}`} inputMode="tel" value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setDup(null); setErr(""); }} placeholder="08xx atau +62" required />
          {(liveDup || dup) && (
            <div className="mt-2 rounded-xl bg-gold-50 p-3 text-xs text-gold-600 ring-1 ring-gold-200">
              Nomor ini sudah terdaftar sebagai <b className="text-felt-950">{(liveDup ?? dup)!.name}</b> ({displayPhone(normalized)}). Mungkin namanya salah ketik?
            </div>
          )}
        </div>
        {err && !dup && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
        <button type="submit" disabled={saving || !!liveDup} className="btn-primary w-full">{saving ? <Spinner className="h-4 w-4" /> : <Icon name="plus" className="h-4 w-4" />} Tambah member</button>
      </form>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-felt-900/35" />
            <input className="input pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau nomor HP" />
          </div>
          <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Urutkan">
            <option value="new">Terbaru</option>
            <option value="name">Nama A–Z</option>
            <option value="points">Poin tertinggi</option>
            <option value="games">Paling sering main</option>
          </select>
        </div>
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-felt-900/45">Member · {list?.length ?? 0}</p>
        {list === null ? (
          <div className="flex justify-center py-16 text-felt-700"><Spinner /></div>
        ) : shown.length === 0 ? (
          <div className="card px-5 py-12 text-center text-sm text-felt-900/55">{q ? "Tidak ada member yang cocok." : "Belum ada member."}</div>
        ) : (
          <ul className="space-y-2">
            {shown.map((m) => (
              <li key={m.id} className="card flex items-center gap-3 p-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-felt-50 font-display text-lg font-semibold text-felt-700">{m.name.charAt(0).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-felt-950">{m.name}</p>
                  <p className="truncate text-xs text-felt-900/50">
                    <span className="font-mono">{displayPhone(m.phone)}</span> · {m.games}× main · terakhir {timeAgo(m.lastPlayed)}
                  </p>
                </div>
                <span className={`hidden shrink-0 font-mono text-sm font-bold sm:block ${m.points > 0 ? "text-felt-700" : m.points < 0 ? "text-red-600" : "text-felt-900/35"}`}>{fmtPts(m.points)}</span>
                <a href={`https://wa.me/${m.phone}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-felt-700 hover:bg-felt-50" aria-label="WhatsApp"><Icon name="phone" className="h-4 w-4" /></a>
                <button onClick={() => { setEdit(m); setEditForm({ name: m.name, phone: displayPhone(m.phone).replace(/-/g, ""), note: m.note }); setEditErr(""); }} className="rounded-lg p-2 text-felt-700 hover:bg-felt-50" aria-label="Edit"><Icon name="edit" className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit member" subtitle={edit ? `Terdaftar ${timeAgo(edit.createdAt)}` : ""}>
        <form onSubmit={saveEdit} className="space-y-4">
          <div><label className="label" htmlFor="ename">Nama</label><input id="ename" className="input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
          <div><label className="label" htmlFor="ephone">Nomor HP</label><input id="ephone" className="input" inputMode="tel" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} required /></div>
          <div><label className="label" htmlFor="enote">Catatan</label><input id="enote" className="input" value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} placeholder="Opsional" /></div>
          {editErr && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{editErr}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => edit && remove(edit)} className="btn-danger"><Icon name="trash" className="h-4 w-4" /> Hapus</button>
            <button type="submit" className="btn-primary flex-1"><Icon name="check" className="h-4 w-4" /> Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
