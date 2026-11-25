"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon, Modal, Segmented, Spinner, api, timeAgo, useToast } from "@/components/ui";
import type { HostUser } from "../HostDashboard";

type S = { id: number; name: string; username: string; role: "owner" | "staff"; active: boolean; createdAt: string };

export default function StaffTab({ user }: { user: HostUser }) {
  const toast = useToast();
  const isOwner = user.role === "owner";
  const [list, setList] = useState<S[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "staff" as "staff" | "owner" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwFor, setPwFor] = useState<S | null>(null);
  const [newPw, setNewPw] = useState("");

  const load = useCallback(async () => {
    try { setList((await api<{ staff: S[] }>("/api/host/staff")).staff); } catch (e) { toast((e as Error).message, "err"); }
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      await api("/api/host/staff", { method: "POST", json: form });
      toast("Akun staf dibuat");
      setOpen(false);
      setForm({ name: "", username: "", password: "", role: "staff" });
      load();
    } catch (e) { setErr((e as Error).message); } finally { setSaving(false); }
  }
  async function patch(s: S, body: Record<string, unknown>, msg: string) {
    try { await api(`/api/host/staff/${s.id}`, { method: "PATCH", json: body }); toast(msg); load(); return true; } catch (e) { toast((e as Error).message, "err"); return false; }
  }
  async function remove(s: S) {
    if (!confirm(`Hapus akun ${s.name}?`)) return;
    try { await api(`/api/host/staff/${s.id}`, { method: "DELETE" }); toast("Akun dihapus"); load(); } catch (e) { toast((e as Error).message, "err"); }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-felt-950">Staf & akses</h2>
          <p className="text-sm text-felt-900/55">Staf bisa membuat & menutup room serta mengelola member. Pengaturan venue hanya untuk owner.</p>
        </div>
        {isOwner && <button onClick={() => { setOpen(true); setErr(""); }} className="btn-primary"><Icon name="plus" className="h-4 w-4" /> Tambah staf</button>}
      </div>
      {list === null ? (
        <div className="flex justify-center py-16 text-felt-700"><Spinner /></div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((s) => (
            <li key={s.id} className={`card p-4 ${s.active ? "" : "opacity-60"}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl font-display text-lg font-semibold ${s.role === "owner" ? "bg-gold-100 text-gold-600" : "bg-felt-50 text-felt-700"}`}>{s.name.charAt(0).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-felt-950">{s.name}{s.id === user.id && <span className="ml-1.5 text-xs font-normal text-felt-900/45">(Anda)</span>}</p>
                  <p className="truncate text-xs text-felt-900/50"><span className="font-mono">@{s.username}</span> · dibuat {timeAgo(s.createdAt)}</p>
                </div>
                <span className={`chip ${s.role === "owner" ? "bg-gold-100 text-gold-600" : "bg-felt-50 text-felt-700"}`}>{s.role === "owner" ? "Owner" : "Staf"}</span>
              </div>
              {isOwner && s.id !== user.id && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-felt-900/6 pt-3">
                  <button onClick={() => patch(s, { active: !s.active }, s.active ? "Akun dinonaktifkan" : "Akun diaktifkan")} className="btn-ghost px-3 py-1.5 text-xs">{s.active ? "Nonaktifkan" : "Aktifkan"}</button>
                  <button onClick={() => { setPwFor(s); setNewPw(""); }} className="btn-ghost px-3 py-1.5 text-xs"><Icon name="lock" className="h-3.5 w-3.5" /> Reset password</button>
                  <button onClick={() => remove(s)} className="btn-danger px-3 py-1.5 text-xs"><Icon name="trash" className="h-3.5 w-3.5" /></button>
                </div>
              )}
              {isOwner && s.id === user.id && (
                <div className="mt-3 border-t border-felt-900/6 pt-3">
                  <button onClick={() => { setPwFor(s); setNewPw(""); }} className="btn-ghost px-3 py-1.5 text-xs"><Icon name="lock" className="h-3.5 w-3.5" /> Ganti password saya</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Tambah staf">
        <form onSubmit={add} className="space-y-4">
          <div><label className="label" htmlFor="sname">Nama</label><input id="sname" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label" htmlFor="suser">Username</label><input id="suser" className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })} required /></div>
          <div><label className="label" htmlFor="spw">Password</label><input id="spw" type="text" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 6 karakter" required /></div>
          <div><span className="label">Peran</span><Segmented value={form.role} onChange={(v) => setForm({ ...form, role: v })} options={[{ value: "staff", label: "Staf" }, { value: "owner", label: "Owner" }]} /></div>
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? <Spinner className="h-4 w-4" /> : <Icon name="check" className="h-4 w-4" />} Buat akun</button>
        </form>
      </Modal>

      <Modal open={!!pwFor} onClose={() => setPwFor(null)} title="Atur password baru" subtitle={pwFor ? `@${pwFor.username} — sesi aktif akan dikeluarkan.` : ""}>
        <form onSubmit={async (e) => { e.preventDefault(); if (pwFor && (await patch(pwFor, { password: newPw }, "Password diperbarui"))) { setPwFor(null); if (pwFor.id === user.id) location.href = "/host/login"; } }} className="space-y-4">
          <input className="input" type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Minimal 6 karakter" minLength={6} required />
          <button type="submit" className="btn-primary w-full"><Icon name="check" className="h-4 w-4" /> Simpan password</button>
        </form>
      </Modal>
    </div>
  );
}
