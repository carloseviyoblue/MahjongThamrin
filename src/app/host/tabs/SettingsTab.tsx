"use client";

import { useState } from "react";
import { Icon, Segmented, Spinner, VenueBadge, api, useToast } from "@/components/ui";
import { FONT_PAIRS, LEADERBOARD_STYLES, fontPair, leaderboardStyle } from "@/lib/theme";
import { GAME_TYPES, GAME_TYPE_META, PATTERNS, PAYOUT_LABEL, PRESET_LABEL, defaultPatterns, defaultRuleset, payoutRows, unitLabel, type GameType, type Ruleset } from "@/lib/rules";
import type { PublicVenue } from "@/lib/types";
import type { HostUser } from "../HostDashboard";

type Sub = "look" | "rules" | "backup";
const COLORS = ["#0f5132", "#14532d", "#134e4a", "#1e3a8a", "#7f1d1d", "#4c1d95", "#78350f", "#1f2937"];
const ACCENTS = ["#d4a73d", "#e0bd5f", "#c2410c", "#0ea5e9", "#e11d48", "#f5e9c6", "#34d399", "#f472b6"];

export default function SettingsTab({ user, venue, onSaved }: { user: HostUser; venue: PublicVenue; onSaved: (v: PublicVenue) => void }) {
  const [sub, setSub] = useState<Sub>("look");
  const isOwner = user.role === "owner";
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmented value={sub} onChange={setSub} options={[{ value: "look", label: "Tampilan & Tema" }, { value: "rules", label: "Aturan Faan" }, { value: "backup", label: "Backup" }]} />
        {!isOwner && <span className="chip bg-gold-100 text-gold-600"><Icon name="lock" className="h-3.5 w-3.5" /> Hanya owner yang dapat mengubah</span>}
      </div>
      {sub === "look" && <LookForm venue={venue} onSaved={onSaved} disabled={!isOwner} />}
      {sub === "rules" && <RulesForm venue={venue} onSaved={onSaved} disabled={!isOwner} />}
      {sub === "backup" && <Backup disabled={!isOwner} />}
    </div>
  );
}

function LookForm({ venue, onSaved, disabled }: { venue: PublicVenue; onSaved: (v: PublicVenue) => void; disabled: boolean }) {
  const toast = useToast();
  const [f, setF] = useState({
    name: venue.name, shortName: venue.shortName, slug: venue.slug, logoText: venue.logoText, logoSubText: venue.logoSubText ?? "中",
    logoUrl: venue.logoUrl, social: venue.social, tagline: venue.tagline, address: venue.address,
    primaryColor: venue.primaryColor, accentColor: venue.accentColor || "#d4a73d", fontPair: venue.fontPair || "jakarta", leaderboardStyle: venue.leaderboardStyle || "podium",
    defaultStartingPoints: String(venue.defaultStartingPoints), defaultPayRule: venue.defaultPayRule, playerSelfOpen: venue.playerSelfOpen ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const fp = fontPair(f.fontPair);

  function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return setErr("Logo harus PNG, JPG, atau WEBP.");
    if (file.size > 5 * 1024 * 1024) return setErr("File terlalu besar (maks 5MB).");
    const img = new Image();
    img.onload = () => {
      const S = 256;
      const c = document.createElement("canvas");
      c.width = S; c.height = S;
      const ctx = c.getContext("2d")!;
      const s = Math.max(S / img.width, S / img.height);
      ctx.drawImage(img, (S - img.width * s) / 2, (S - img.height * s) / 2, img.width * s, img.height * s);
      setF((x) => ({ ...x, logoUrl: c.toDataURL("image/png") }));
      setErr("");
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => setErr("Gagal membaca gambar.");
    img.src = URL.createObjectURL(file);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      const payload = { ...f, defaultStartingPoints: Number(f.defaultStartingPoints) };
      const d = await api<{ venue: PublicVenue }>("/api/host/settings", { method: "PUT", json: payload });
      onSaved({ ...venue, ...payload, slug: d.venue.slug, logoUrl: d.venue.logoUrl });
      setF((x) => ({ ...x, slug: d.venue.slug }));
      toast("Tampilan & tema disimpan");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const field = (k: keyof typeof f, label: string, ph = "", hint = "") => (
    <div>
      <label className="label" htmlFor={`f-${k}`}>{label}</label>
      <input id={`f-${k}`} className="input" value={(f[k] as string) ?? ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} placeholder={ph} disabled={disabled} />
      {hint && <p className="mt-1 text-xs text-felt-900/45">{hint}</p>}
    </div>
  );

  return (
    <form onSubmit={save} className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="card space-y-4 p-5 sm:p-6">
          <h3 className="font-display text-xl font-semibold text-felt-950">Identitas venue</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("name", "Nama venue", "Lotus Mahjong Club")}
            {field("shortName", "Nama pendek", "Lotus")}
          </div>
          {field("slug", "Alamat halaman venue", "lotus", `/v/${f.slug || "…"} · huruf kecil, angka, tanda minus`)}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("social", "Social media", "@lotusmahjong")}
            {field("tagline", "Tagline", "Klub Mahjong Hong Kong")}
          </div>
          {field("address", "Alamat", "Jl. … No. …, Jakarta")}
          <div className="grid gap-4 sm:grid-cols-2">
            {field("logoText", "Huruf utama logo (stempel)", "蓮")}
            {field("logoSubText", "Huruf kecil merah di logo", "中")}
          </div>
          <div>
            <span className="label">Logo gambar (opsional, menggantikan stempel)</span>
            <div className="flex flex-wrap items-center gap-3">
              <VenueBadge logoText={f.logoText || "?"} logoSubText={f.logoSubText} logoUrl={f.logoUrl} color={f.primaryColor} size={56} />
              <label className={`btn-ghost cursor-pointer ${disabled ? "pointer-events-none opacity-50" : ""}`}>
                <Icon name="download" className="h-4 w-4 rotate-180" /> Unggah logo
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onLogo} disabled={disabled} />
              </label>
              {f.logoUrl && <button type="button" onClick={() => setF({ ...f, logoUrl: null })} className="btn-ghost text-red-600" disabled={disabled}>Hapus</button>}
            </div>
          </div>
        </div>

        <div className="card space-y-5 p-5 sm:p-6">
          <div>
            <h3 className="font-display text-xl font-semibold text-felt-950">Tema warna</h3>
            <p className="text-xs text-felt-900/55">Warna utama untuk header & tombol, warna aksen untuk emas/highlight, podium, dan story.</p>
            <p className="mt-2 rounded-xl bg-cream-100 px-3 py-2 text-xs font-medium text-felt-900/70">Saat ini layar memakai tema bawaan WinMahjong yang stabil untuk mencegah pergeseran warna/modal. Gaya leaderboard tetap bisa dipilih.</p>
          </div>
          <div>
            <span className="label">Warna utama</span>
            <Swatches colors={COLORS} value={f.primaryColor} onPick={(c) => setF({ ...f, primaryColor: c })} disabled={disabled} />
          </div>
          <div>
            <span className="label">Warna aksen</span>
            <Swatches colors={ACCENTS} value={f.accentColor} onPick={(c) => setF({ ...f, accentColor: c })} disabled={disabled} />
          </div>
          <div>
            <span className="label">Jenis font web</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {FONT_PAIRS.map((p) => (
                <button key={p.key} type="button" disabled={disabled} onClick={() => setF({ ...f, fontPair: p.key })} className={`rounded-2xl border p-3 text-left transition ${f.fontPair === p.key ? "border-felt-700 bg-felt-50 ring-2 ring-felt-700/20" : "border-felt-900/10 bg-white hover:border-felt-400"}`}>
                  <p style={{ fontFamily: p.display }} className="text-xl leading-tight text-felt-950">Mahjong {p.preview.split(" ")[0]}</p>
                  <p style={{ fontFamily: p.body }} className="mt-0.5 text-xs text-felt-900/60">{p.label} · {p.preview}</p>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-felt-900/45">Font dipilih dari daftar yang sudah dimuat aplikasi — tidak akan merusak tampilan di perangkat apa pun.</p>
          </div>
          <div>
            <span className="label">Gaya leaderboard default</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {LEADERBOARD_STYLES.map((s) => (
                <button key={s.key} type="button" disabled={disabled} onClick={() => setF({ ...f, leaderboardStyle: s.key })} className={`rounded-2xl border p-3 text-left transition ${f.leaderboardStyle === s.key ? "border-felt-700 bg-felt-50 ring-2 ring-felt-700/20" : "border-felt-900/10 bg-white hover:border-felt-400"}`}>
                  <p className="text-sm font-bold text-felt-950">{s.label}</p>
                  <p className="mt-0.5 text-xs text-felt-900/55">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-cream-100 p-4">
            <p className="label">Pendaftaran pemain</p>
            <Switch on={f.playerSelfOpen} onChange={(v) => setF({ ...f, playerSelfOpen: v })} label="Pemain bisa daftar & buka meja sendiri" desc="Jika dimatikan, pemain harus didaftarkan staf: layar buka meja pemain akan terkunci dan hanya staf yang bisa mengisinya." />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="dsp">Poin awal default (room baru)</label>
              <input id="dsp" className="input" inputMode="numeric" disabled={disabled} value={f.defaultStartingPoints} onChange={(e) => setF({ ...f, defaultStartingPoints: e.target.value.replace(/\D/g, "").slice(0, 7) })} />
            </div>
            <div>
              <span className="label">Aturan bayar default</span>
              <Segmented value={f.defaultPayRule} onChange={(v) => setF({ ...f, defaultPayRule: v })} options={[{ value: "half", label: "半銃 Half" }, { value: "full", label: "全銃 Full" }]} />
            </div>
          </div>
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
          <button type="submit" disabled={saving || disabled} className="btn-primary w-full py-3">{saving ? <Spinner className="h-4 w-4" /> : <Icon name="check" className="h-4 w-4" />} Simpan tampilan & tema</button>
        </div>
      </div>

      <div className="h-fit lg:sticky lg:top-4">
        <p className="label">Pratinjau langsung</p>
        <div className="overflow-hidden rounded-[28px] shadow-xl" style={{ background: `radial-gradient(ellipse at top, ${f.primaryColor}, #041a11)`, fontFamily: fp.body }}>
          <div className="flex flex-col items-center px-6 pb-8 pt-9 text-center text-cream-50">
            <VenueBadge logoText={f.logoText || "?"} logoSubText={f.logoSubText} logoUrl={f.logoUrl} color={f.primaryColor} size={72} />
            <p className="mt-4 text-2xl font-semibold" style={{ fontFamily: fp.display }}>{f.name || "Nama venue"}</p>
            <p className="mt-1 text-sm text-cream-50/60">{f.tagline}</p>
            <p className="mt-1 text-sm font-semibold" style={{ color: f.accentColor }}>{f.social}</p>
            <div className="mt-5 grid w-full grid-cols-3 items-end gap-2">
              {[2, 1, 3].map((n) => (
                <div key={n} className="rounded-t-2xl px-2 py-3" style={{ background: n === 1 ? `linear-gradient(180deg, ${f.accentColor}, #8a6414)` : "rgba(255,255,255,0.12)", minHeight: n === 1 ? 86 : 64 }}>
                  <p className="font-black" style={{ fontFamily: fp.display }}>{n}</p>
                  <p className="truncate text-[11px] font-semibold">{n === 1 ? "Juara" : `Pemain ${n}`}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.25em] text-cream-50/50">Gaya: {leaderboardStyle(f.leaderboardStyle)} · Font: {fp.label}</p>
          </div>
        </div>
      </div>
    </form>
  );
}

function Switch({ on, onChange, disabled, label, desc }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; label?: string; desc?: string }) {
  void label; void desc;
  return (
    <button type="button" disabled={disabled} onClick={() => onChange(!on)} className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60" style={{ background: on ? "#156341" : "rgba(11,63,40,0.2)" }}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function Swatches({ colors, value, onPick, disabled }: { colors: string[]; value: string; onPick: (c: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {colors.map((c) => (
        <button type="button" key={c} disabled={disabled} onClick={() => onPick(c)} className={`h-9 w-9 rounded-full ring-offset-2 transition ${value === c ? "ring-2 ring-felt-900" : ""}`} style={{ background: c }} aria-label={c} />
      ))}
      <label className="flex items-center gap-2 rounded-full bg-white px-2 py-1 ring-1 ring-felt-900/10">
        <input type="color" value={value} onChange={(e) => onPick(e.target.value)} className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent" disabled={disabled} />
        <span className="font-mono text-xs">{value}</span>
      </label>
    </div>
  );
}

function RulesForm({ venue, onSaved, disabled }: { venue: PublicVenue; onSaved: (v: PublicVenue) => void; disabled: boolean }) {
  const toast = useToast();
  const [type, setType] = useState<GameType>(venue.rules.preset);
  const [r, setR] = useState<Ruleset>(venue.rules);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const defaults = defaultPatterns(type);
  const unit = unitLabel(r);
  const dirty = JSON.stringify(r) !== JSON.stringify(venue.rules) || type !== venue.rules.preset;

  function switchType(t: GameType) {
    if (t === type) return;
    setType(t);
    setR(t === venue.rules.preset ? venue.rules : defaultRuleset(t));
  }

  async function save() {
    setSaving(true);
    setErr("");
    try {
      const d = await api<{ venue: PublicVenue }>("/api/host/settings", { method: "PUT", json: { rules: { ...r, preset: type } } });
      onSaved({ ...venue, rules: d.venue.rules });
      setR(d.venue.rules);
      toast(`Aturan ${GAME_TYPE_META[type].label} disimpan`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const setPat = (k: string, v: Partial<{ enabled: boolean; faan: number }>) => setR({ ...r, patterns: { ...r.patterns, [k]: { ...r.patterns[k], ...v } } });
  const num = (v: string, fb: number) => (v === "" || Number.isNaN(Number(v)) ? fb : Number(v));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-5">
        <div className="card space-y-4 p-5 sm:p-6">
          <div>
            <h3 className="font-display text-xl font-semibold text-felt-950">Tipe permainan</h3>
            <p className="text-xs text-felt-900/55">Aturan yang disimpan berlaku untuk room bertipe sama. Room tipe lain memakai nilai standar tipe tersebut. Tipe room dipilih saat membuat room.</p>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-3xl bg-cream-100 p-1 sm:grid-cols-4">
            {GAME_TYPES.map((t) => (
              <button key={t} type="button" disabled={disabled} onClick={() => switchType(t)} className={`rounded-2xl px-2 py-2 text-[11px] font-bold uppercase tracking-wide transition ${type === t ? "bg-felt-700 text-cream-50 shadow" : "text-felt-900/55 hover:text-felt-950"}`}>
                {GAME_TYPE_META[t].short}
              </button>
            ))}
          </div>
          <p className="text-xs text-felt-900/55">{GAME_TYPE_META[type].desc} Preset: {PRESET_LABEL[type]}.</p>
          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="label" htmlFor="minf">Min {unit}</label>
              <input id="minf" type="number" min={0} max={16} className="input" value={r.minFaan} disabled={disabled} onChange={(e) => setR({ ...r, minFaan: num(e.target.value, 0) })} />
            </div>
            <div>
              <label className="label" htmlFor="maxf">Batas {unit}</label>
              <input id="maxf" type="number" min={3} max={24} className="input" value={r.maxFaan} disabled={disabled} onChange={(e) => setR({ ...r, maxFaan: num(e.target.value, 3) })} />
            </div>
            <div>
              <label className="label" htmlFor="mult">{type === "taiwan" ? "Poin per tai" : "Pengali"}</label>
              <input id="mult" type="number" min={0.5} step={0.5} className="input" value={r.multiplier} disabled={disabled} onChange={(e) => setR({ ...r, multiplier: num(e.target.value, 1) })} />
            </div>
            <div>
              <label className="label" htmlFor="pt">Tabel poin</label>
              <select id="pt" className="input" value={r.payoutTable} disabled={disabled || type === "taiwan"} onChange={(e) => setR({ ...r, payoutTable: e.target.value as Ruleset["payoutTable"] })}>
                {Object.entries(PAYOUT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {type === "taiwan" && <p className="mt-1 text-[11px] text-felt-900/45">Taiwan selalu linear per tai.</p>}
            </div>
          </div>
        </div>

        {(["hand", "limit", "bonus"] as const).map((cat) => {
          const list = PATTERNS.filter((p) => p.category === cat && (type === "taiwan" ? p.taiwan !== null : true));
          if (!list.length) return null;
          return (
            <div key={cat} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-felt-900/6 px-5 py-3">
                <h3 className="font-semibold text-felt-950">{cat === "hand" ? "Pola tangan" : cat === "limit" ? "Limit / khusus" : "Bonus"}</h3>
                <span className="text-xs text-felt-900/45">Nilai · standar {GAME_TYPE_META[type].short}</span>
              </div>
              <ul className="divide-y divide-felt-900/5">
                {list.map((p) => {
                  const s = r.patterns[p.key] ?? { enabled: false, faan: 0 };
                  const changed = s.faan !== (defaults[p.key]?.faan ?? 0);
                  return (
                    <li key={p.key} className={`flex items-center gap-3 px-5 py-2.5 ${s.enabled ? "" : "opacity-50"}`}>
                      <input type="checkbox" checked={s.enabled} disabled={disabled} onChange={(e) => setPat(p.key, { enabled: e.target.checked })} className="h-4 w-4 shrink-0 accent-emerald-700" aria-label={`Aktifkan ${p.name}`} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-felt-950">{p.name} <span className="font-han font-bold text-felt-700/70">{p.zh}</span></p>
                        <p className="truncate text-xs text-felt-900/50">{p.desc}</p>
                      </div>
                      <input type="number" min={0} max={24} value={s.faan} disabled={disabled || !s.enabled} onChange={(e) => setPat(p.key, { faan: num(e.target.value, 0) })} className={`input w-16 px-2 py-1.5 text-center font-mono ${changed ? "border-gold-400 bg-gold-50" : ""}`} aria-label={`Nilai ${p.name}`} />
                      <span className="w-16 shrink-0 text-right text-xs text-felt-900/40">standar {defaults[p.key]?.faan ?? 0}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="h-fit space-y-4 lg:sticky lg:top-4">
        <div className="card p-4">
          <p className="label">Tabel poin ({unit} → P)</p>
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {payoutRows(r).map((row) => (
                  <tr key={row.faan} className={`border-t border-felt-900/5 ${row.faan < r.minFaan ? "text-felt-900/35" : ""}`}>
                    <td className="py-1">{row.faan} {unit}</td>
                    <td className="py-1 text-right font-mono font-semibold">{row.discard.toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{err}</p>}
        <button onClick={save} disabled={saving || disabled || !dirty} className="btn-primary w-full py-3">{saving ? <Spinner className="h-4 w-4" /> : <Icon name="check" className="h-4 w-4" />} Simpan aturan {GAME_TYPE_META[type].short}</button>
        <button onClick={() => setR(defaultRuleset(type))} disabled={disabled} className="btn-ghost w-full"><Icon name="refresh" className="h-4 w-4" /> Reset ke standar {GAME_TYPE_META[type].short}</button>
        <p className="text-xs text-felt-900/45">Berlaku untuk round baru. Round lama tidak dihitung ulang kecuali diedit. Panduan lengkap: <a className="font-semibold underline" href={`/panduan/${type}`} target="_blank">/panduan/{type}</a></p>
      </div>
    </div>
  );
}

function Backup({ disabled }: { disabled: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-felt-50 text-felt-700"><Icon name="download" /></span>
        <h3 className="mt-4 font-display text-xl font-semibold text-felt-950">Backup lengkap (JSON)</h3>
        <p className="mt-1 text-sm text-felt-900/55">Venue, tema, aturan, member, room, meja, dan seluruh round.</p>
        <a href={disabled ? undefined : "/api/host/backup?format=json"} aria-disabled={disabled} className={`btn-primary mt-5 ${disabled ? "pointer-events-none opacity-50" : ""}`}>Unduh JSON</a>
      </div>
      <div className="card p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-100 text-gold-600"><Icon name="grid" /></span>
        <h3 className="mt-4 font-display text-xl font-semibold text-felt-950">Ekspor round (CSV)</h3>
        <p className="mt-1 text-sm text-felt-900/55">Buka di Excel / Google Sheets untuk analisis atau arsip.</p>
        <a href={disabled ? undefined : "/api/host/backup?format=csv"} aria-disabled={disabled} className={`btn-ghost mt-5 ${disabled ? "pointer-events-none opacity-50" : ""}`}>Unduh CSV</a>
      </div>
    </div>
  );
}
